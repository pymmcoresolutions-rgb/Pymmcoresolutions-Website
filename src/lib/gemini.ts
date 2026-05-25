import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIAdvice(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the PymmCore Product Consultant. You provide expert advice on selecting the right applications from our storefront. You help users understand platform compatibility (Web, Mobile, Desktop), pricing, and feature sets. Keep your responses professional, helpful, and focused on product discovery.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI Advisor is currently offline. Please check your protocol settings.";
  }
}

export async function optimizeMetadata(name: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Optimize this application metadata for a premium app storefront. 
      Name: ${name}
      Description: ${description}`,
      config: {
        systemInstruction: "You are an expert marketing copywriter for a premium app marketplace. Suggest optimized tags and a more detailed, engaging description that highlights the product's value proposition.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 technical tags like 'AI', 'Security', 'Web3'."
            },
            description: {
              type: Type.STRING,
              description: "An engaging, professional, and detailed description."
            }
          },
          required: ["tags", "description"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { tags: [], description };
  }
}

export async function generateIconSuggestion(name: string, description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Suggest 5 Lucide React icon names that best represent this application.
      Name: ${name}
      Description: ${description}`,
      config: {
        systemInstruction: "You are a UI/UX designer. Choose 5 unique and relevant icon names from the Lucide React library. Output them as a JSON array of strings under the key 'suggestions'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions"]
        }
      }
    });
    const data = JSON.parse(response.text);
    return Array.isArray(data.suggestions) ? data.suggestions : ["Box", "Package", "Layers", "Cpu", "Zap"];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Box", "Package", "Layers", "Cpu", "Zap"];
  }
}
