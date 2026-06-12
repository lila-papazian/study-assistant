const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/summarize", async (req, res) => {
  const { text } = req.body;

  try {
    const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
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

app.listen(3001, () => {
  console.log("Server running on port 3001");
});