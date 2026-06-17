import express, { json } from "express";
import cors from "cors";
import formidable, { Fields, Files } from "formidable";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { PDFParse } from "pdf-parse";
import getUploadedFile from "./utils/getUploadedFile";
import { buildSummaryPrompt, SUMMARY_SYSTEM_PROMPT } from "./prompts/summarize";

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

  form.parse(req, async (err: any, fields: Fields<string>, files: Files<string>) => {
    if (err) {
      next(err);
      return;
    }

    const uploadedFile = getUploadedFile(files);

    if (!uploadedFile) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    let parser: PDFParse | undefined;

    try {
      const pdfBuffer = await readFile(uploadedFile.filepath);
      parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();

      res.json({
        filename: uploadedFile.originalFilename,
        textLength: result.text.length,
        text: result.text,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to extract PDF text" });
    } finally {
      await parser?.destroy();
    }
  });
});

app.post(
  "/api/summarize",
  async (
    req: express.Request,
    res: express.Response
  ) => {
    const { text } =
      req.body as SummarizeRequestBody;

    try {
      const ollamaResponse = await fetch(
        OLLAMA_CHAT_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            model: "gemma3:4b",
            stream: true,
            messages: [
              {
                role: "system",
                content: SUMMARY_SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: buildSummaryPrompt(text),
              },
            ],
          }),
        }
      );

      if (!ollamaResponse.ok) {
        throw new Error(
          `Ollama returned ${ollamaResponse.status}`
        );
      }

      if (!ollamaResponse.body) {
        throw new Error(
          "Ollama returned no body"
        );
      }

      res.setHeader(
        "Content-Type",
        "application/x-ndjson"
      );

      await pipeline(
        Readable.fromWeb(
          ollamaResponse.body as any
        ),
        res
      );
    } catch (err) {
      console.error(err);

      if (!res.headersSent) {
        res.status(500).json({
          error:
            "Failed to connect to Ollama",
        });
      }
    }
  }
);

app.listen(BACKEND_PORT, BACKEND_HOST, () => {
  console.log(`Backend listening at http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
