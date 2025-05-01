
/**
 * Utility function to parse the strategy JSON from potentially formatted text
 * Handles markdown, escaped characters, and malformed JSON structures
 */
export function parseFullStrategyJson(raw: string | null): any {
  if (!raw || raw.trim().length === 0) return null;

  try {
    // Remove markdown code blocks
    let cleaned = raw.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/g, '');

    // Attempt to extract the JSON body
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Replace common GPT formatting issues
    cleaned = cleaned
      .replace(/\\"/g, '"')           // Unescape double quotes
      .replace(/\\n/g, '\n')          // Fix escaped newlines
      .replace(/\r/g, '')             // Remove carriage returns

    // Attempt final parse
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Failed to parse strategy JSON:", error);
    console.log("↳ Raw strategy snippet:\n", raw?.slice(0, 200));
    return null;
  }
}

/**
 * Attempts to extract a summary string from parsed JSON or fallback from raw text
 */
export function getStrategySummary(parsedJson: any, rawText: string | null): string | null {
  if (parsedJson?.summary) return parsedJson.summary;

  if (rawText) {
    const firstSentences = rawText.split(/[.!?]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join('. ');
    return firstSentences ? firstSentences + '.' : null;
  }

  return null;
}
