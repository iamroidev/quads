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
  async groupProducts(products: any[]): Promise<any[]> {
    if (!this.apiKey) {
      console.error('OPENROUTER_API_KEY is not set');
      return [];
    }

    try {
      const productList = products.map(p => ({
        id: p._id,
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category?.name || 'Uncategorized'
      }));

      const prompt = `
        You are a creative marketplace curator for the UMaT campus.
        Below is a list of products currently available on the QUADS marketplace.
        Group them into 3-5 catchy, relevant campus-themed collections.

        Examples of collection themes:
        - "Freshman Starter Pack" (essentials for new students)
        - "Engineer's Toolkit" (tech, gadgets, tools)
        - "Hostel Hype" (room decor, comfort items)
        - "Exam Survival Kit" (snacks, stationery, coffee)
        - "Graduation Clear-out" (items from departing students)

        Return ONLY a JSON array of objects with the following structure:
        [
          {
            "title": "Collection Title",
            "description": "Short catchy description",
            "slug": "collection-slug",
            "productIds": ["id1", "id2", "..."]
          }
        ]

        Only include products that actually fit the theme. A product can be in multiple collections if it fits.

        PRODUCTS:
        ${JSON.stringify(productList)}
      `;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a professional marketplace curator. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
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

      const content = response.data.choices[0].message.content;
      // Extract JSON array from response
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If it's an object with a collections key
      const data = JSON.parse(content);
      return data.collections || data;
    } catch (error: any) {
      console.error('OpenRouter Grouping Error:', error.response?.data || error.message);
      return [];
    }
  }
}

export default new AiService();
