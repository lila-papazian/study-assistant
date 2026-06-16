function chunkText(text: string, maxChars = 8000): string[] {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }

  return chunks;
}

export default chunkText;