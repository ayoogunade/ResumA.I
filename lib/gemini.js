// lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize with validation
if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY environment variable not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// 2. Use your original model with config
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.3,  // Lower for more consistent results
    maxOutputTokens: 4000, // Increased for better formatting
    topP: 0.8,
  }
});

// 3. Enhanced prompt with better structure
export async function tailorResume(resumeText, jobDescription, retries = 3) {
  const prompt = `
ROLE: You are an expert ATS (Applicant Tracking System) resume optimizer and professional resume writer.

TASK: Optimize the following resume for the specific job description while maintaining authenticity and professionalism.

RESUME TO OPTIMIZE:
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

CRITICAL INSTRUCTIONS:
1. KEYWORD OPTIMIZATION: Identify and naturally integrate 8-12 key keywords from the job description
2. QUANTIFY ACHIEVEMENTS: Add metrics and numbers to accomplishments (e.g., "increased efficiency by 25%")
3. RELEVANCE PRIORITIZATION: Reorder bullet points to highlight most relevant experience first
4. SKILLS ALIGNMENT: Ensure technical skills match job requirements exactly
5. FORMAT PRESERVATION: Maintain the original resume structure and sections
6. PROFESSIONAL TONE: Keep language professional and achievement-oriented

OPTIMIZATION STRATEGY:
- Analyze job description for required hard skills, soft skills, and keywords
- Match resume experiences to job requirements using similar language
- Remove or minimize irrelevant information
- Add brief, impactful summary at the top highlighting key qualifications

OUTPUT FORMAT REQUIREMENTS:
- Return ONLY the optimized resume content
- Start with a brief 3-4 line professional summary tailored to the job
- Use clear section headers (Experience, Education, Skills, etc.)
- Use bullet points for achievements with quantifiable results
- Keep the optimized resume to approximately the same length as original
- Do not include any explanatory text or markdown formatting

OPTIMIZED RESUME:`;

  // 4. Retry logic for API stability
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Clean up the response
      return formatGeminiResponse(response.text());
    } catch (error) {
      if (attempt === retries) {
        console.error(`Final attempt failed:`, error);
        throw new Error(`Failed to generate tailored resume: ${error.message}`);
      }
      console.warn(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// 5. Response formatting utility
function formatGeminiResponse(text) {
  return text
    // Remove common AI prefixes
    .replace(/^(当然|好的|这里是|优化后的简历|OPTIMIZED RESUME):?\s*/i, '')
    // Clean up markdown artifacts
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/```(?:\w+)?/g, '')
    // Normalize whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    // Ensure proper section formatting
    .replace(/([a-zA-Z]):\s*\n/g, '$1:\n')
    .trim();
}

// 6. Additional utility for analysis (optional)
export async function analyzeResumeMatch(resumeText, jobDescription, retries = 3) {
  const analysisPrompt = `
Analyze the match between this resume and job description. Return JSON only with:
{
  "matchScore": 0-100,
  "strengths": ["strength1", "strength2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

RESUME: ${resumeText.substring(0, 2000)}
JOB DESCRIPTION: ${jobDescription.substring(0, 2000)}
`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      
      // Parse JSON response
      const analysis = JSON.parse(response.text().replace(/```json|```/g, ''));
      return analysis;
    } catch (error) {
      console.error(`Analysis attempt ${attempt} failed:`, error);
      
      // If it's a 503 error or overloaded, wait longer between retries
      if (error.status === 503 || error.message?.includes('overloaded')) {
        if (attempt === retries) {
          console.error('Gemini API overloaded, skipping analysis');
          return null;
        }
        console.warn(`API overloaded, waiting ${attempt * 2} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else if (attempt === retries) {
        console.error('Final analysis attempt failed:', error);
        return null;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  return null;
}