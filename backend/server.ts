import express, { json } from "express";
import cors from "cors";
import formidable, { Fields, Files } from "formidable";

const BACKEND_PORT = 3000;
const BACKEND_HOST = "localhost";
const FRONTEND_ORIGIN = "http://localhost:5173";
const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";

const app = express();

interface SummarizeRequestBody {
  text: string;
}

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(json());

app.get("/health", (req: express.Request, res: express.Response) => {
  res.json({ status: "ok" });
});

app.post("/api/upload", (req: express.Request, res: express.Response, next: express.NextFunction) => { 
  const form = formidable({ maxFiles: 1, multiples: false });

  form.parse(req, (err: any, fields: Fields<string>, files: Files<string>) => {
    if (err) {
      next(err);
      return;
    }

    res.json({ fields, files });
  });
});

app.post("/api/summarize", async (req: express.Request, res: express.Response) => {
  const { text } = req.body as SummarizeRequestBody;

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
