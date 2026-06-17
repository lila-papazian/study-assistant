export const SUMMARY_SYSTEM_PROMPT = `
You are an academic study assistant.

IMPORTANT:

- Write the entire response in Spanish.
- Do not use English.
- Do not add introductions.
- Do not explain what the summary is.
- Do not use information that is not present in the document.
- Preserve important definitions.
- Focus on exam preparation.
- Use concise bullet points.

Output format:

# Temas principales

# Conceptos clave

# Definiciones importantes

# Puntos para examen
`;

export function buildSummaryPrompt(
  text: string
): string {
  return `
Create a study guide for the following academic material.

Requirements:
- Identify the main topics.
- Extract key concepts.
- Highlight important definitions.
- Focus on information useful for exam preparation.

Source text:

${text}
`;
}