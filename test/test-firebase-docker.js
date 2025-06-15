const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');


async function testFirebaseDocker() {
  try {
    console.log('🔄 Docker環境 Firebase Emulator接続テスト開始...');
    
    // 環境変数の確認
    console.log('📝 環境変数確認:');
    console.log('- FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
    console.log('- FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    
    // Firebase Admin SDK初期化（Emulator用）
    const app = initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID ,
    });
    
    const db = getFirestore(app);
    
    // テストデータ作成
    const testData = {
      message: 'Docker Compose環境でのFirebaseテスト',
      timestamp: new Date(),
      container: 'shift-management-ai-dev',
      emulator: true,
      environment: 'docker-compose'
    };
    
    console.log('📤 Firestoreにテストデータを書き込み中...');
    await db.collection('docker-compose-test').doc('integration').set(testData);
    console.log('✅ Firestore書き込み成功');
    
    // データ読み取りテスト
    console.log('📥 Firestoreからデータを読み取り中...');
    const doc = await db.collection('docker-compose-test').doc('integration').get();
    
    if (doc.exists) {
      console.log('✅ Firestore読み取り成功:');
      console.log(JSON.stringify(doc.data(), null, 2));
    } else {
      throw new Error('Document not found');
    }
    
    // コレクション一覧取得テスト
    console.log('📋 コレクション一覧取得中...');
    const collections = await db.listCollections();
    console.log('✅ コレクション一覧:', collections.map(c => c.id));
    
    // クリーンアップ
    console.log('🧹 テストデータ削除中...');
    await db.collection('docker-compose-test').doc('integration').delete();
    console.log('✅ テストデータ削除完了');
    
    console.log('🎉 Docker Compose環境でのFirebase Emulatorテスト完了！');
    console.log('');
    console.log('🌐 Emulator UI: http://localhost:4000');
    console.log('🔥 Firestore: http://localhost:4000/firestore');
    console.log('🔐 Auth: http://localhost:4000/auth');
    
  } catch (error) {
    console.error('❌ Firebase Emulatorテストエラー:', error.message);
    console.error('');
    console.error('🔍 デバッグ情報:');
    console.error('- エラー詳細:', error);
    console.error('- 現在の環境変数:');
    console.error('  FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
    console.error('  FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
    console.error('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.error('');
    console.error('💡 確認項目:');
    console.error('1. Firebase Emulatorが起動しているか: docker-compose logs firebase-emulator');
    console.error('2. ネットワーク接続確認: docker-compose exec app-dev ping firebase-emulator');
    console.error('3. Emulator UI確認: http://localhost:4000');
  }
}

// プロセス終了時の処理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

testFirebaseDocker();