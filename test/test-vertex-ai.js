const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config({ path: '.env.local' });

async function testVertexAI() {
  console.log('🔄 Vertex AI接続テスト開始...');
  
  try {
    // 環境変数確認
    console.log('プロジェクトID:', process.env.VERTEX_AI_PROJECT_ID);
    console.log('リージョン:', process.env.VERTEX_AI_LOCATION || 'asia-northeast1');
    
    const vertexAI = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID,
      location: process.env.VERTEX_AI_LOCATION || 'asia-northeast1',
    });
    
    const model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
    });
    
    const result = await model.generateContent('こんにちは！このメッセージは接続テストです。');
    
    console.log('✅ Vertex AI Gemini API 接続成功');
    console.log('レスポンス:', result.response.candidates[0].content.parts[0].text);
    
  } catch (error) {
    console.error('❌ Vertex AI テストエラー:', error.message);
    console.error('確認事項:');
    console.error('- .env.localにVERTEX_AI_PROJECT_IDが設定されているか');
    console.error('- Google Cloud認証情報が正しく設定されているか');
    console.error('- Vertex AI APIが有効化されているか');
  }
}

testVertexAI();
