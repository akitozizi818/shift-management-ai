# ==============================================
# 本番用 Dockerfile - Cloud Run デプロイ対応
# ==============================================

# =====================================
# Dependencies Stage (本番用依存関係のインストール)
# このステージは、本番環境で実行するために必要な最小限の依存関係をインストールします。
# ビルドに必要な開発用依存関係は含みません。
# =====================================
FROM node:20-slim AS deps

# CurlはRunner Stageでも不要であれば削除してOK
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# package.json と package-lock.json をコピー
# これにより、これらのファイルが変更されない限り、このレイヤーはキャッシュが有効になります。
COPY package*.json ./

# 本番用依存関係のみをインストール
RUN npm ci --only=production && npm cache clean --force

# =====================================
# Builder Stage (アプリケーションのビルド)
# このステージで、アプリケーションのソースコードをコピーし、
# 開発用依存関係を含む全ての依存関係をインストールし、Next.jsをビルドします。
# =====================================
FROM node:20-slim AS builder

WORKDIR /app

# package.json と package-lock.json をコピー
# このステージで全ての依存関係をインストールするために必要です。
COPY package*.json ./

# tsconfig.json と next-env.d.ts を npm ci の前にコピー
# TypeScript が依存関係インストール前に設定を認識できるようにします。
COPY tsconfig.json ./
COPY next-env.d.ts ./

# 既存のnode_modulesを削除し、完全にクリーンな状態から依存関係を再インストール
# npm ci は通常クリーンインストールを行いますが、Dockerキャッシュとの問題で
# これが効果的な場合があります。
RUN rm -rf node_modules && npm ci

# @emotion/is-prop-valid を明示的にインストール
# framer-motion の警告を解消するため
RUN npm install @emotion/is-prop-valid

COPY . .

# ★★★ すべての環境変数を .env ファイルから読み込み、npm run build を実行 ★★★
# --mount=type=secret で .env ファイルをマウントし、
# その内容を bash の `source` コマンドで環境変数として設定します。
# これにより、ビルド時に必要な全ての変数が確実に利用可能になります。
RUN --mount=type=secret,id=app_env,dst=/tmp/app.env \
    /bin/bash -c " \
      source /tmp/app.env && \
      echo \"--- DIAGNOSTIC: Environment Variables before npm run build ---\" && \
      printenv | grep -E 'FIREBASE|LINE|GOOGLE_CLOUD_PROJECT|NEXT_PUBLIC_' || true && \
      echo \"--- END DIAGNOSTIC ---\" && \
      npm run build \
    "

# Node.js 環境変数 (Next.js 固有ではないもの)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# RUN npm run build # この行は上に移動しました

# =====================================
# Runner Stage (本番環境でのアプリケーション実行)
# このステージは、ビルドされた軽量なイメージであり、
# アプリケーションを実行するために必要なファイルのみを含みます。
# =====================================
FROM node:20-slim AS runner

# セキュリティ: 非rootユーザーを作成
RUN groupadd --gid 1001 --system nodejs
RUN useradd --uid 1001 --system --gid nodejs nextjs

WORKDIR /app

# Runner StageではCurlのインストールは不要です (ヘルスチェックがないため)
# RUN apt-get update && apt-get install -y \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# ここでは、アプリケーションの実行時に必要な環境変数を設定します。
# これらの環境変数は、Dockerイメージをビルドした後、
# Cloud Run (または他のデプロイ環境) にデプロイする際に、
# 安全な方法で注入されるべきです。Dockerfileにはここでは記載しません。
# (Cloud Runのサービス設定で直接設定します)

ENV NODE_ENV=production
ENV PORT=8080 
# Cloud Runはデフォルトで8080ポートをlistenします。

# Next.js の Standalone ビルドをコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
