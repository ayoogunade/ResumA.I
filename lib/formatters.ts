// lib/formatters.ts - NEW FILE
export function formatTailoredResume(text: string): string {
    // Clean and format the AI response
    return text
      // Remove any AI-specific prefixes
      .replace(/^(优化后的简历| tailored resume| enhanced resume):?\s*/i, '')
      // Clean up markdown
      .replace(/#{1,6}\s?/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code blocks
      // Normalize sections
      .replace(/([A-Z][A-Za-z\s]+):/g, '\n$1:\n') // Ensure section headers have space
      // Clean up whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }
  
  export function highlightChanges(original: string, optimized: string): string {
    // Simple change highlighting (you can enhance this)
    const originalLines = original.split('\n');
    const optimizedLines = optimized.split('\n');
    
    return optimizedLines.map(line => {
      if (!originalLines.includes(line)) {
        return `🆕 ${line}`;
      }
      return line;
    }).join('\n');
  }