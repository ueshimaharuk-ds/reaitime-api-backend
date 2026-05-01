require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// 本番はここを自分のフロントURLに
app.use(cors({
  origin: "https://icy-forest-0f8312e00.7.azurestaticapps.net"
}));

app.use(express.json());

// 確認用
app.get("/", (req, res) => {
  res.send("Backend OK 🚀");
});

// セッション取得
app.post("/realtime/session", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-realtime",
          voice: "alloy",
          instructions: `
        あなたは落ち着いた男性のAIです。
        日本語で自然に会話してください。
        短く、わかりやすく答えてください。
        `
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "session作成失敗" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Backend running on port " + port);
});

