
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
  // If there's a summary key in the top level, use that
  if (parsedJson?.summary) return parsedJson.summary;
  
  // Try to get summary from phases
  if (parsedJson?.phases && Array.isArray(parsedJson.phases) && parsedJson.phases.length > 0) {
    if (parsedJson.phases[0].title) {
      return `${parsedJson.phases[0].title}: ${parsedJson.phases[0].goal || ''}`;
    }
  }

  // Fallback to extracting from raw text
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

/**
 * Converts a JSON strategy to human-readable text
 */
export function strategyJsonToText(parsedJson: any): string | null {
  if (!parsedJson) return null;
  
  let text = '';
  
  // Add summary
  if (parsedJson.summary) {
    text += `${parsedJson.summary}\n\n`;
  }
  
  // Add phases
  if (parsedJson.phases && Array.isArray(parsedJson.phases)) {
    parsedJson.phases.forEach((phase: any, index: number) => {
      text += `Phase ${index + 1}: ${phase.title || ''}\n`;
      
      if (phase.goal) {
        text += `Goal: ${phase.goal}\n`;
      }
      
      if (phase.tactics && Array.isArray(phase.tactics)) {
        text += 'Tactics:\n';
        phase.tactics.forEach((tactic: string, i: number) => {
          text += `- ${tactic}\n`;
        });
      }
      
      if (phase.content_plan) {
        text += '\nContent Plan:\n';
        
        if (phase.content_plan.weekly_schedule) {
          text += 'Weekly Schedule:\n';
          Object.entries(phase.content_plan.weekly_schedule).forEach(([format, count]) => {
            text += `- ${format}: ${count}x per week\n`;
          });
        }
        
        if (phase.content_plan.example_post_ideas && Array.isArray(phase.content_plan.example_post_ideas)) {
          text += '\nExample Post Ideas:\n';
          phase.content_plan.example_post_ideas.slice(0, 5).forEach((idea: string) => {
            text += `- ${idea}\n`;
          });
        }
      }
      
      text += '\n';
    });
  }
  
  // Add topic ideas
  if (parsedJson.topic_ideas && Array.isArray(parsedJson.topic_ideas)) {
    text += 'Content Topic Ideas:\n';
    parsedJson.topic_ideas.forEach((topic: string) => {
      text += `- ${topic}\n`;
    });
  }
  
  return text;
}
