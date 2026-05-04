require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");

const app = express();

const corsOptions = {
  origin: [
    "https://icy-forest-0f8312e00.7.azurestaticapps.net",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ★ デバッグログ（問題解決後に削除可）
console.log(
  "ENV TYPE:",
  typeof process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
);
console.log(
  "ENV PREVIEW:",
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(0, 80),
);

// ★ 起動時クラッシュを防ぐため、リクエスト時に認証を初期化
app.post("/realtime/session", async (req, res) => {
  try {
    const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!rawJson) {
      return res
        .status(500)
        .json({ error: "GOOGLE_APPLICATION_CREDENTIALS_JSON が未設定" });
    }

    let credentials;
    try {
      credentials = JSON.parse(rawJson);
    } catch (e) {
      return res
        .status(500)
        .json({ error: "JSON parse失敗", preview: rawJson.substring(0, 100) });
    }

    const auth = new GoogleAuth({
      credentials,
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

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
