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

app.post("/realtime/session", async (req, res) => {
  try {
    const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!rawJson) {
      return res
        .status(500)
        .json({ error: "GOOGLE_APPLICATION_CREDENTIALS_JSON が未設定" });
    }

    const credentials = JSON.parse(rawJson);

    // Azure App Service Linux 用エンドポイントに動的差し替え
    const identityEndpoint = process.env.IDENTITY_ENDPOINT; // http://169.254.131.2:8081/msi/token
    const identityHeader = process.env.IDENTITY_HEADER; // 再起動ごとに変わる値

    if (identityEndpoint && identityHeader) {
      credentials.credential_source.url = `${identityEndpoint}?api-version=2019-08-01&resource=api://AzureADTokenExchange`;
      credentials.credential_source.headers = {
        "X-IDENTITY-HEADER": identityHeader,
      };
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
