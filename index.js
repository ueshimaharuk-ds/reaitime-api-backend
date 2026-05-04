require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleAuth } = require("google-auth-library");
const { WebSocketServer, WebSocket } = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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

async function getGcpToken() {
  const credentials = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  );
  const identityEndpoint = process.env.IDENTITY_ENDPOINT;
  const identityHeader = process.env.IDENTITY_HEADER;

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
  return { token: tokenResponse.token, projectId };
}

// REST: トークン取得エンドポイント
app.post("/realtime/session", async (req, res) => {
  try {
    const { token, projectId } = await getGcpToken();
    res.json({
      access_token: token,
      project_id: projectId,
      location: "us-central1",
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

// WebSocketプロキシ
wss.on("connection", async (clientWs) => {
  console.log("クライアントWS接続");
  try {
    const { token, projectId } = await getGcpToken();
    const location = "us-central1";
    const modelId = "gemini-live-2.5-flash-native-audio";
    const vertexUrl = `wss://${location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`;

    const vertexWs = new WebSocket(vertexUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    vertexWs.on("open", () => {
      console.log("Vertex AI WS接続成功");
      const setup = {
        setup: {
          model: `projects/${projectId}/locations/${location}/publishers/google/models/${modelId}`,
        },
      };
      vertexWs.send(JSON.stringify(setup));
    });

    // Vertex AI → クライアント
    vertexWs.on("message", (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    // クライアント → Vertex AI
    clientWs.on("message", (data) => {
      if (vertexWs.readyState === WebSocket.OPEN) {
        vertexWs.send(data);
      }
    });

    vertexWs.on("error", (err) => {
      console.error("Vertex WS Error:", err.message);
      clientWs.close();
    });

    vertexWs.on("close", (code, reason) => {
      console.log(`Vertex WS切断: ${code} ${reason}`);
      clientWs.close();
    });

    clientWs.on("close", () => {
      console.log("クライアントWS切断");
      vertexWs.close();
    });

    clientWs.on("error", (err) => {
      console.error("Client WS Error:", err.message);
      vertexWs.close();
    });
  } catch (err) {
    console.error("WS Auth Error:", err.message);
    clientWs.close();
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
