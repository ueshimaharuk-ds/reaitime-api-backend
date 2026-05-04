require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");

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
app.options("*", cors(corsOptions)); // プリフライト（OPTIONS）リクエストを確実に処理

app.use(express.json());

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

app.post("/realtime/session", async (req, res) => {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const projectId = await auth.getProjectId();

    res.json({
      access_token: tokenResponse.token,
      project_id: projectId,
      location: "us-west1",
      model_id: "gemini-live-2.5-flash-native-audio",
    });
  } catch (err) {
    console.error("Auth Error:", err);
    // エラー時もCORSヘッダーが消えないようExpressが処理しますが、
    // 明示的にJSONでエラーを返します
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
