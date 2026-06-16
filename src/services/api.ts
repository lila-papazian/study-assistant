import type {
  UploadResponse,
  SummarizeResponse,
} from '../types/api';

export async function uploadPdf(
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload PDF');
  }

  return response.json();
}

export async function summarizeText(
  text: string
): Promise<SummarizeResponse> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to summarize text');
  }

  return response.json();
}