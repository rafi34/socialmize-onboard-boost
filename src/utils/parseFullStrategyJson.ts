
/**
 * Utility functions for parsing and extracting data from strategy JSON
 */

// Attempt to parse the full strategy text as JSON
export const parseFullStrategyJson = (text?: string | null): any => {
  if (!text) return null;
  
  try {
    // Clean the text to handle potential formatting issues
    const cleanedText = cleanJsonText(text);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error parsing strategy JSON:", error);
    return extractStructuredData(text);
  }
};

// Clean JSON text that might have markdown or other formatting
export const cleanJsonText = (text?: string | null): string => {
  if (!text) return "";
  
  // Remove markdown code block indicators
  let cleaned = text.trim()
    .replace(/^```json\s*/g, '')  // Remove opening ```json
    .replace(/^```\s*/g, '')      // Remove opening ``` without json
    .replace(/```$/g, '');        // Remove closing ```
  
  // Try to find JSON object boundaries if there's other text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Fix common JSON string issues
  cleaned = cleaned
    .replace(/\\"/g, '"') // Fix escaped quotes inside already escaped content
    .replace(/\\n/g, ' ') // Replace \n with spaces for better readability
    .replace(/\r\n/g, ' ') // Replace Windows line breaks
    .replace(/\n/g, ' '); // Replace Unix line breaks
    
  return cleaned;
};

// When JSON parsing fails, try to extract structured data from the text
export const extractStructuredData = (text: string): any => {
  const result: any = {
    weeks: [],
    topic_ideas: []
  };
  
  // Try to extract a summary
  const summaryMatch = text.match(/summary:\s*([^.!?]*[.!?])/i);
  if (summaryMatch && summaryMatch[1].trim().length > 10) {
    result.summary = summaryMatch[1].trim();
  }
  
  // Try to extract week information
  const weekMatches = text.matchAll(/week\s*(\d+)[:\s]*([^#]*)/gi);
  for (const match of weekMatches) {
    if (match[1] && match[2]) {
      result.weeks.push({
        week: parseInt(match[1]),
        description: match[2].trim()
      });
    }
  }
  
  // Try to extract topic ideas
  const topicSection = text.match(/topic ideas:\s*([^#]*)/i);
  if (topicSection && topicSection[1]) {
    const topics = topicSection[1]
      .split(/[\n\r]+/) // Split by lines
      .map(line => line.trim().replace(/^[-*•]\s*/, '')) // Remove bullet points
      .filter(line => line.length > 0);
    
    result.topic_ideas = topics;
  }
  
  return result;
};

// Get a human-readable summary from the strategy data
export const getStrategySummary = (parsedJson: any, fullText?: string | null): string | null => {
  if (!parsedJson && !fullText) return null;
  
  // If we have parsed JSON, try to extract summary from different fields
  if (parsedJson) {
    if (parsedJson.summary) return parsedJson.summary;
    if (parsedJson.overview) return parsedJson.overview;
    if (parsedJson.strategy_summary) return parsedJson.strategy_summary;
    
    // If we have weeks data, use the first week's description
    if (parsedJson.weeks && parsedJson.weeks.length > 0) {
      const firstWeek = parsedJson.weeks[0];
      if (firstWeek.description) return firstWeek.description;
    }
  }
  
  // If no structured data found, extract from text
  if (fullText) {
    // Look for summary patterns
    const summaryMatch = fullText.match(/summary:([^.!?]*[.!?])/i);
    if (summaryMatch && summaryMatch[1].trim().length > 10) {
      return summaryMatch[1].trim();
    }
    
    // Get first few sentences
    const sentences = fullText.split(/[.!?]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      // Get first 2-3 sentences
      const firstSentences = sentences.slice(0, 3).join(". ");
      return firstSentences + (firstSentences.endsWith(".") ? "" : ".");
    }
  }
  
  return null;
};
