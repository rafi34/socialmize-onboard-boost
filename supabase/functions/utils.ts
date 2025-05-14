
// Helper function to extract mission map from AI response
export function extractMissionMap(aiResponse: string) {
  try {
    // Look for JSON-like structure with mission map data
    const missionMapMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (missionMapMatch && missionMapMatch[1]) {
      try {
        return JSON.parse(missionMapMatch[1]);
      } catch (e) {
        console.error("Error parsing mission map JSON:", e);
      }
    }
    
    // Alternative pattern matching for mission phases
    const phasesMatch = aiResponse.match(/\*\*Phase 1.*?Phase 3.*?\*\*/s);
    if (phasesMatch) {
      // Extract structured data from text
      const phaseTexts = phasesMatch[0];
      
      // Simple phase extraction
      const phase1 = phaseTexts.match(/\*\*Phase 1[^\n]*\*\*\s*([\s\S]*?)(?=\*\*Phase 2)/);
      const phase2 = phaseTexts.match(/\*\*Phase 2[^\n]*\*\*\s*([\s\S]*?)(?=\*\*Phase 3)/);
      const phase3 = phaseTexts.match(/\*\*Phase 3[^\n]*\*\*\s*([\s\S]*?)(?=\*\*|$)/);
      
      return {
        phase1: phase1 ? phase1[1].trim() : "",
        phase2: phase2 ? phase2[1].trim() : "",
        phase3: phase3 ? phase3[1].trim() : "",
        rawText: phaseTexts
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting mission map:", error);
    return null;
  }
}

// Helper function to extract content ideas from AI response
export function extractContentIdeas(aiResponse: string): string[] {
  try {
    // Try to find a section marked as content ideas
    let contentSection = aiResponse;
    
    // Look for standard markers
    const contentMarkers = [
      /\[CONTENT IDEAS\]([\s\S]*?)(?:\[|$)/i,
      /\[CONTENT_IDEAS_READY\]([\s\S]*?)(?:\[|$)/i,
      /Content Ideas:([\s\S]*?)(?:(?:##|\[|$))/i,
      /Content Ideas \([\d]+-[\d]+\):([\s\S]*?)(?:(?:##|\[|$))/i,
      /Here are some content ideas for you:([\s\S]*?)(?:(?:##|\[|$))/i,
      /content ideas based on your strategy:([\s\S]*?)(?:(?:##|\[|$))/i
    ];
    
    for (const marker of contentMarkers) {
      const match = aiResponse.match(marker);
      if (match && match[1]) {
        contentSection = match[1];
        break;
      }
    }
    
    // Extract numbered or bulleted list items
    const ideas: string[] = [];
    const listItemRegex = /(?:^|\n)(?:\d+\.\s+|\*\s+|•\s+|-)(.+?)(?=(?:\n\d+\.\s+|\n\*\s+|\n•\s+|\n-|\n\n|$))/g;
    
    let match;
    while ((match = listItemRegex.exec(contentSection)) !== null) {
      if (match[1] && match[1].trim()) {
        ideas.push(match[1].trim());
      }
    }
    
    // If no list items found, try splitting by newlines
    if (ideas.length === 0) {
      return contentSection
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.startsWith('#') && !line.startsWith('['));
    }
    
    return ideas;
  } catch (error) {
    console.error("Error extracting content ideas:", error);
    return [];
  }
}
