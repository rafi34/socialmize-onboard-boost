
// Helper functions for edge functions

export function extractJsonFromMessage(message: string): Record<string, any> | null {
  try {
    // Try to find content between ```json and ``` markers
    const jsonMatch = message.match(/```json([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try to find content between { and } if no code block markers
    const jsonObjectMatch = message.match(/{[\s\S]*?}/);
    
    if (jsonObjectMatch) {
      return JSON.parse(jsonObjectMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting JSON from message:", error);
    return null;
  }
}

// Extract mission map from strategy content
export function extractMissionMap(message: string): any | null {
  try {
    // Look for mission map section
    const missionMapSection = message.match(/Mission Map[\s\S]*?(?=\n\s*\n\s*\w+:|$)/i);
    
    if (!missionMapSection) return null;
    
    // Try to parse JSON first
    const json = extractJsonFromMessage(missionMapSection[0]);
    if (json) return json;
    
    // If no JSON, try to parse the text structure
    const phases = [];
    const phaseMatches = missionMapSection[0].matchAll(/Phase \d+[:\s]+([\w\s]+)[\s\S]*?(?=Phase \d+|$)/g);
    
    for (const match of phaseMatches) {
      const phaseName = match[1].trim();
      const phaseContent = match[0];
      
      const weeklyFocus = extractListItems(phaseContent, "Weekly Focus");
      const contentFormats = extractListItems(phaseContent, "Content Formats");
      const platforms = extractListItems(phaseContent, "Platforms");
      
      // Extract tone guidance
      const toneMatch = phaseContent.match(/Tone Guidance[:\s]+([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]|$)/i);
      const toneGuidance = toneMatch ? toneMatch[1].trim() : "";
      
      phases.push({
        name: phaseName,
        weeklyFocus: weeklyFocus,
        contentFormats: contentFormats,
        platforms: platforms,
        toneGuidance: toneGuidance
      });
    }
    
    return { phases };
  } catch (error) {
    console.error("Error extracting mission map:", error);
    return null;
  }
}

// Helper function to extract list items
function extractListItems(text: string, sectionName: string): string[] {
  const sectionMatch = text.match(new RegExp(`${sectionName}[:\\s]+([\s\S]*?)(?=\\n\\s*\\n|\\n\\s*[A-Z]|$)`, 'i'));
  
  if (!sectionMatch) return [];
  
  return sectionMatch[1]
    .split('\n')
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
}

// Extract content ideas from message
export function extractContentIdeas(message: string): string[] {
  try {
    // Look for content ideas section with various markers
    const sectionMarkers = [
      "CONTENT_IDEAS",
      "Content Ideas",
      "Content ideas",
      "content ideas",
      "Topic Ideas",
      "TOPIC IDEAS"
    ];
    
    let contentSection = null;
    
    for (const marker of sectionMarkers) {
      const markerRegex = new RegExp(`${marker}[:\\s]*([\s\S]*?)(?=\\n\\s*\\n\\s*\\w+:|$)`, 'i');
      const match = message.match(markerRegex);
      
      if (match) {
        contentSection = match[1];
        break;
      }
    }
    
    if (!contentSection) {
      // Try to find the first list in the message
      const listMatch = message.match(/(?:^|\n)(?:[-*•][\s].*\n)+/);
      contentSection = listMatch ? listMatch[0] : null;
    }
    
    if (!contentSection) return [];
    
    // Try to extract JSON first
    const json = extractJsonFromMessage(contentSection);
    if (json && Array.isArray(json.ideas || json.content_ideas)) {
      return json.ideas || json.content_ideas;
    }
    
    // If no JSON, split by list markers and clean up
    return contentSection
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0 && line.length < 200); // Reasonable length for ideas
  } catch (error) {
    console.error("Error extracting content ideas:", error);
    return [];
  }
}
