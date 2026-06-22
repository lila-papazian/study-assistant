import type {
  UploadResponse,
  SummarizeResponse,
  OllamaChunk,
} from '../types/api';

export async function uploadPdf(
  file: File,
  signal?: AbortSignal
): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to upload PDF');
  }

  return response.json();
}

export async function summarizeText(
  text: string,
  signal?: AbortSignal
): Promise<SummarizeResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to summarize text');
  }

  return response.json();
}

export async function summarizeStream(
  text: string,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to summarize");
  }

  if (!response.body) {
    throw new Error("Response body is missing");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines = buffer.split("\n");

    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const chunk = JSON.parse(line) as OllamaChunk;

      const token = chunk.message?.content ?? "";

      if (token) {
        onToken(token);
      }
    }
  }
}