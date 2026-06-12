const express = require("express");
const cors = require("cors");

const BACKEND_PORT = 3000;
const BACKEND_HOST = "localhost";
const FRONTEND_ORIGIN = "http://localhost:5173";
const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/summarize", async (req, res) => {
  const { text } = req.body;

  try {
    const ollamaResponse = await fetch(OLLAMA_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3:latest",
        stream: false,
        messages: [
          {
            role: "system",
            content: "You are a concise assistant that summarizes texts clearly.",
          },
          {
            role: "user",
            content: `Summarize this text:\n\n${text}`,
          },
        ],
      }),
    });

    const data = await ollamaResponse.json();

    res.json({
      summary: data.message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to connect to Ollama" });
  }
});

app.listen(BACKEND_PORT, BACKEND_HOST, () => {
  console.log(`Backend listening at http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
