import axios from 'axios';
import ApiError from '../utils/ApiError';

class AiService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model: string = 'google/gemini-2.0-flash-001'; // Fast and capable

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  async generateResponse(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    context?: any
  ): Promise<string> {
    if (!this.apiKey) {
      console.error('OPENROUTER_API_KEY is not set');
      return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later or contact support@quadsmarket.tech.";
    }

    try {
      const systemPrompt = `
You are the Official QUADS (Institutional Marketplace) AI Assistant. 
Your goal is to help UMaT students with their marketplace queries.

GUIDELINES:
1. Be professional, helpful, and concise.
2. Answer questions about how the platform works (escrow, delivery, verified sellers).
3. If you CANNOT help with a specific request (e.g., technical bugs, payment issues, disputes), you MUST ESCALATE.
4. To escalate, include the phrase "ESCALATING TO HUMAN SUPPORT" in your response.
5. Use context about the current conversation if provided.

CONTEXT:
${JSON.stringify(context || {})}

USER MESSAGE:
${userMessage}
      `;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://quadsmarket.tech',
            'X-Title': 'QUADS Marketplace',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenRouter Error:', error.response?.data || error.message);
      return "I'm having a bit of trouble processing that. Let me get a human to help you. ESCALATING TO HUMAN SUPPORT.";
    }
  }
}

export default new AiService();
