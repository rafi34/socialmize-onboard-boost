/**
 * Utility function to parse the strategy JSON from potentially formatted text
 * This handles various edge cases like markdown code blocks, escaped characters, etc.
 */
export function parseFullStrategyJson(raw: string | null): any {
  if (!raw || raw.trim().length === 0) return null;

  try {
    // Remove markdown code block indicators
    let cleaned = raw.trim()
      .replace(/^```json\s*/g, '')  // Remove opening ```json
      .replace(/^```\s*/g, '')      // Remove opening ``` without json
      .replace(/```$/g, '');        // Remove closing ```
    
    // Try to find JSON object boundaries if there's other text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Fix common escaping issues
    cleaned = cleaned
      .replace(/\\"/g, '"') // Fix escaped quotes inside already escaped content
      .replace(/\r\n/g, '\\n')
      .replace(/\n/g, '\\n');
    
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("❌ Failed to parse strategy JSON:", error);
    console.log("Raw text sample:", raw?.substring(0, 100));
    return null;
  }
}

/**
 * Gets a summary from the parsed strategy JSON or generates one from raw text
 */
export function getStrategySummary(parsedJson: any, rawText: string | null): string | null {
  // If we have parsed JSON with a summary, use it
  if (parsedJson?.summary) {
    return parsedJson.summary;
  }
  
  // Otherwise try to extract from raw text
  if (rawText) {
    const sentences = rawText.split(/[.!?]/);
    if (sentences.length > 0) {
      // Get up to first 3 sentences that have content
      const firstSentences = sentences
        .filter(s => s.trim().length > 0)
        .slice(0, 3)
        .join(". ");
      
      return firstSentences + (firstSentences.endsWith(".") ? "" : ".");
    }
  }
  
  return null;
}
