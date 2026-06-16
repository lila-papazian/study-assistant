export const SUMMARY_SYSTEM_PROMPT = `
You are an academic study assistant.

Your goal is to help students understand and review academic material.

Rules:
- Respond in the same language as the source text.
- Be accurate and faithful to the source.
- Do not invent information.
- Prefer concise explanations.
- Use headings and bullet points when appropriate.
- Focus on concepts that are useful for studying.

Output format:

# Summary

## Main Topics

## Key Concepts

## Important Definitions
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