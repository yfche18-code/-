
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  constructor() {
    // 构造函数保持简洁
  }

  async generateArtisticPortrait(base64Image: string, stylePrompt: string): Promise<string> {
    // Use gemini-2.5-flash-image for general image editing tasks
    const modelName = 'gemini-2.5-flash-image';
    
    // 强化职业装和性别的识别逻辑
    const systemPrompt = `YOU ARE A MASTER COMMERCIAL PORTRAIT PHOTOGRAPHER.
    
TASK: Transform the user's casual photo into a "Haimati" style high-end business portrait.

CORE REQUIREMENTS:
1. GENDER-SPECIFIC ATTIRE: 
   - Analyze the subject's gender. 
   - IF FEMALE: Dress her in a high-quality professional blazer, a crisp tailored white shirt, or elegant corporate office attire. 
   - IF MALE: Dress him in a modern, slim-fit professional suit (black, navy, or charcoal), a perfectly pressed dress shirt, and a professional tie.
2. IDENTITY PRESERVATION: Maintain the subject's facial features, eye shape, and bone structure. They must be easily recognizable as the same person.
3. STYLE & LIGHTING: Strictly follow this artistic lighting style: "${stylePrompt}".
4. COMPOSITION: Standard 3:4 business portrait (head and shoulders). Background should be a clean, solid studio color (grey, white, or navy) that matches the style.
5. QUALITY: Professional-grade retouching. Skin should look natural yet perfect. Hair should be neat and groomed.

NO CASUAL CLOTHES ALLOWED. THE SUBJECT MUST LOOK LIKE A TOP-TIER PROFESSIONAL.`;

    try {
      // Use the provided API key directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                // Ensure we only send the base64 data part
                data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
                mimeType: 'image/png'
              }
            },
            {
              text: systemPrompt
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      // Find the image part in the response as instructed
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const base64EncodeString: string = part.inlineData.data;
            return `data:image/png;base64,${base64EncodeString}`;
          }
        }
      }

      throw new Error('未能从 AI 响应中提取到图像');
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(error.message || 'AI 生成过程中出现异常');
    }
  }
}
