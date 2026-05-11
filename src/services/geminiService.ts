import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AuditResult {
  riskScore: 'Safe' | 'Suspicious' | 'Dangerous';
  report: string;
  flags: string[];
}

export async function auditApplication(appData: {
  name: string;
  description: string;
  link: string;
  sourceCodeUrl?: string;
  developer: string;
}): Promise<AuditResult> {
  const prompt = `
    Perform a multi-stage security and content audit on the following software submission for the PymmCore Matrix.
    
    APP METADATA:
    Name: ${appData.name}
    Description: ${appData.description}
    Target URL: ${appData.link}
    Source Code: ${appData.sourceCodeUrl || 'Not Provided'}
    Developer: ${appData.developer}

    AUDIT PROTOCOLS:
    1. URL ANALYSIS: Check the target URL for signs of phishing, deceptive patterns, or known malicious domains.
    2. CONTENT MODERATION: Scan description for spam, offensive language, or misleading claims.
    3. TECHNICAL SCAVENGE: If source code URL is provided, evaluate the reputation of the repository domain.
    4. RISK SCORING: Assign a score (Safe, Suspicious, Dangerous).

    Output a detailed technical report and a final risk assessment.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: {
              type: Type.STRING,
              enum: ["Safe", "Suspicious", "Dangerous"],
              description: "Final risk determination"
            },
            report: {
              type: Type.STRING,
              description: "Technical audit summary"
            },
            flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific security or policy flags"
            }
          },
          required: ["riskScore", "report", "flags"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Audit failed:", error);
    return {
      riskScore: 'Suspicious',
      report: 'Automated audit sequence interrupted. Manual verification required.',
      flags: ['AUDIT_FAILURE']
    };
  }
}

export async function suggestAppIcon(name: string, description: string): Promise<{ iconName: string; reason: string }> {
  const prompt = `
    Suggest a single icon name from the Lucide React library that best represents the following application.
    
    App Name: ${name}
    Description: ${description}

    The icon name must be a valid PascalCase Lucide icon name (e.g., 'Shield', 'Cpu', 'Rocket', 'Activity', 'Globe').
    Return only a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            iconName: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["iconName", "reason"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Icon suggestion failed:", error);
    return { iconName: 'Box', reason: 'Default fallback Protocol.' };
  }
}

export async function generateSocialMarketingInfo(appData: {
  name: string;
  description: string;
  features: string[];
  link: string;
}): Promise<{ caption: string; videoPrompt: string }> {
  const prompt = `
    Create high-engagement social media marketing materials for the following application hosted on PymmCore Matrix.
    
    APP DATA:
    Name: ${appData.name}
    Description: ${appData.description}
    Features: ${appData.features.join(', ')}
    Link: ${appData.link}

    MARKETING REQUIREMENTS:
    1. CAPTION: Create a compelling, professional, and slightly futuristic caption that highlights the core features listed in the app data. Ensure there is a clear and strong call to action (CTA) inviting users to experience the application on the PymmCore Matrix marketplace using the provided link. Include relevant hashtags like #PymmCore #Matrix #TechInnovation #SoftwareApproved.
    2. VIDEO PROMPT: Create a detailed visual prompt for a high-quality video generation tool. The video should showcase the app's core themes (e.g., productivity, finance) with a tech-forward, slick aesthetic. Mention cinematic lighting and 3D UI elements.

    Output as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            videoPrompt: { type: Type.STRING }
          },
          required: ["caption", "videoPrompt"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Marketing generation failed:", error);
    return {
      caption: `Unleash the power of ${appData.name} on the Matrix! 🚀 Featuring ${appData.features.slice(0, 2).join(', ')} and more. Experience the next generation of software here: ${appData.link} #PymmCore #Innovation #Approved`,
      videoPrompt: `A slick 3D technical animation of a digital interface for ${appData.name}, showing its core ecosystem and data flows in a cinematic tech lab environment.`
    };
  }
}

export async function generateMarketingVideo(prompt: string): Promise<string> {
  try {
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: `${prompt}. High quality, professional marketing video.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    // Simple polling for preview environment
    let attempts = 0;
    while (attempts < 5) {
      const response = await (ai.operations as any).get(operation.name);
      if (response.done) {
        const result = response.response as any;
        const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part?.inlineData?.data) {
          return `data:video/mp4;base64,${part.inlineData.data}`;
        }
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    return "";
  } catch (error) {
    console.error("Video generation failed:", error);
    return "";
  }
}
