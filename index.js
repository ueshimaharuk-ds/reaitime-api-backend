require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library"); // 1度目の宣言（ここでOK）

const app = express();

// CORS設定の強化
const corsOptions = {
  origin: [
    "https://icy-forest-0f8312e00.7.azurestaticapps.net",
    "http://localhost:3000", // ローカルテスト用
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// --- 認証設定の初期化 ---
// 重複していた require と宣言を削除し、既存の GoogleAuth を使用
const auth = new GoogleAuth({
  // 環境変数からJSON文字列を取得し、オブジェクトに変換して渡す
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

app.post("/realtime/session", async (req, res) => {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const projectId = await auth.getProjectId();

    // 正常なレスポンス
    res.json({
      access_token: tokenResponse.token,
      project_id: projectId,
      location: "us-west1",
      model_id: "gemini-live-2.5-flash-native-audio",
    });
  } catch (err) {
    console.error("Auth Error:", err);
    // エラー時もJSONで詳細を返す（503を避けるため）
    res.status(500).json({
      error: "Vertex AI セッション作成失敗",
      details: err.message,
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
