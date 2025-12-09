import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImageWithGemini = async (base64Image: string): Promise<AIAnalysis> => {
  // Remove header if present (e.g., "data:image/png;base64,")
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image for a 'paint by numbers' project. Provide a creative title, a short encouraging description for the painter, an estimated difficulty level (Easy, Medium, or Hard), and a fun fact about the subject or style."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
            funFact: { type: Type.STRING }
          },
          required: ["title", "description", "difficulty", "funFact"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysis;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback if AI fails
    return {
      title: "My Masterpiece",
      description: "A beautiful custom paint-by-numbers canvas.",
      difficulty: "Medium",
      funFact: "Paint by numbers was invented in the 1950s!"
    };
  }
};
