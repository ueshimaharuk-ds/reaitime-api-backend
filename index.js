require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express(); // ← これが最重要

app.use(cors());
app.use(express.json());

// 確認用
app.get("/", (req, res) => {
  res.send("Hello from Backend 🚀");
});

// セッションAPI
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
          model: "gpt-4o-realtime-preview",
        }),
      }
    );

    const data = await response.json();
    console.log("OpenAI response:", data);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "session作成失敗" });
  }
});

// 起動
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log("Backend running on port " + port);
});
