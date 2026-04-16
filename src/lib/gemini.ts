import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIAdvice(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-flash-preview",
      contents: `Suggest a Lucide React icon name that best represents this application.
      Name: ${name}
      Description: ${description}`,
      config: {
        systemInstruction: "You are a UI/UX designer. Choose one icon name from the Lucide React library (e.g., 'Zap', 'Shield', 'Cpu', 'Activity', 'Globe', 'Smartphone', 'Database', 'Cloud', 'Lock', 'Key', 'Layers', 'Box', 'Package', 'Terminal', 'Code', 'BarChart', 'PieChart', 'LineChart', 'Users', 'User', 'Mail', 'MessageSquare', 'Bell', 'Settings', 'Search', 'Filter', 'Trash', 'Edit', 'Plus', 'Minus', 'Check', 'X', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown', 'ExternalLink', 'Download', 'Upload', 'Eye', 'EyeOff', 'Heart', 'Star', 'Bookmark', 'Share', 'Copy', 'Clipboard', 'Calendar', 'Clock', 'MapPin', 'Phone', 'Camera', 'Video', 'Music', 'Mic', 'Speaker', 'Monitor', 'Tv', 'Laptop', 'Tablet', 'Smartphone', 'Watch', 'Wifi', 'Battery', 'Bluetooth', 'HardDrive', 'Cpu', 'Mouse', 'Keyboard', 'Printer', 'Save', 'File', 'Folder', 'Image', 'Gift', 'ShoppingBag', 'ShoppingCart', 'CreditCard', 'DollarSign', 'Euro', 'Bitcoin', 'Briefcase', 'GraduationCap', 'Book', 'Library', 'PenTool', 'Brush', 'Palette', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Wind', 'Zap', 'Flame', 'Droplet', 'Leaf', 'Tree', 'Flower', 'Heart', 'Smile', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown', 'Award', 'Trophy', 'Medal', 'Flag', 'Anchor', 'LifeBuoy', 'Compass', 'Navigation', 'Map', 'Globe', 'Plane', 'Train', 'Car', 'Bike', 'Truck', 'Bus', 'Ship', 'Rocket', 'Space', 'Atom', 'Dna', 'Flask', 'Beaker', 'Microscope', 'Telescope', 'Stethoscope', 'Syringe', 'Pill', 'Activity', 'HeartPulse', 'Thermometer', 'Wind', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'CloudFog', 'CloudSun', 'CloudMoon', 'Sun', 'Moon', 'Sunrise', 'Sunset', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudDrizzle', 'CloudFog', 'CloudSun', 'CloudMoon', 'Sun', 'Moon', 'Sunrise', 'Sunset'). Return ONLY the icon name as a string in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            iconName: { type: Type.STRING }
          },
          required: ["iconName"]
        }
      }
    });
    return JSON.parse(response.text).iconName;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Box";
  }
}
