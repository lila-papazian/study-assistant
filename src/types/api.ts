export interface UploadResponse {
  filename: string;
  textLength: number;
  text: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface OllamaChunk {
  message?: {
    content?: string;
  };
  done?: boolean;
}