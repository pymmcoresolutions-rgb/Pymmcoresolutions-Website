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
