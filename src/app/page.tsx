import AnimatedBackground from "@/components/animated-background";
import Link  from "next/link";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <AnimatedBackground />
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center text-white/90">
          シフト管理AIエージェント
        </h1>
        <p className="text-center mt-4 text-white/80">
          AIエージェントを活用したLINEベースのシフト管理システム
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href= "/admin" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
            店長ログイン
          </Link>
          <Link href= "/member" className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition">
            バイトログイン
          </Link>
        </div>
      </div>
    </main>
  );
}
