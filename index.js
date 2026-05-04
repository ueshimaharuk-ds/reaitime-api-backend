require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");

const app = express();

// フロントエンドのURLを許可
app.use(
  cors({
    origin: "https://icy-forest-0f8312e00.7.azurestaticapps.net",
  }),
);

app.use(express.json());

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
});

app.post("/realtime/session", async (req, res) => {
  try {
    // Google Cloud の認証情報を取得
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const projectId = await auth.getProjectId();

    // フロントエンドに接続情報を返す
    res.json({
      access_token: tokenResponse.token,
      project_id: projectId,
      location: "us-west1",
      model_id: "gemini-live-2.5-flash-native-audio",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Vertex AI セッション作成失敗" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
