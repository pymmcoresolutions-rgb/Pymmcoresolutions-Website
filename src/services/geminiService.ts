import axios from 'axios';

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
  try {
    const response = await axios.post('/api/ai/audit', appData);
    return response.data;
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
  try {
    const response = await axios.post('/api/ai/suggest-icon', { name, description });
    return response.data;
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
  try {
    const response = await axios.post('/api/ai/marketing-info', appData);
    return response.data;
  } catch (error) {
    console.error("Marketing generation failed:", error);
    return {
      caption: `Unleash the power of ${appData.name} on the Matrix! 🚀`,
      videoPrompt: `Fallback marketing prompt.`
    };
  }
}

export async function generateMarketingVideo(prompt: string): Promise<string> {
  try {
    const response = await axios.post('/api/ai/marketing-video', { prompt });
    return response.data.videoUrl || "";
  } catch (error) {
    console.error("Video generation failed:", error);
    return "";
  }
}
