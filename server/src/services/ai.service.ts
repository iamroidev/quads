import axios from 'axios';

class AiService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  // Primary model + fallback in case of rate limits
  private readonly models: string[] = [
    'google/gemini-2.0-flash-lite-001',
    'meta-llama/llama-3.1-8b-instruct',
    'google/gemini-2.0-flash-001',
  ];

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  private async callModel(model: string, messages: { role: string; content: string }[]): Promise<string> {
    const response = await axios.post(
      this.apiUrl,
      { model, messages, max_tokens: 500 },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://quadsmarket.tech',
          'X-Title': 'QUADS Marketplace AI Support',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from model');
    return content;
  }

  async generateResponse(
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    context?: any
  ): Promise<string> {
    if (!this.apiKey) {
      console.error('[AI] OPENROUTER_API_KEY is not configured');
      return "I'm currently offline. Please contact support@quadsmarket.tech directly.";
    }

    const systemPrompt = `You are the official QUADS campus marketplace AI assistant for UMaT students in Ghana.
Be concise, helpful, and friendly. Help with: buying/selling items, escrow payments, pickup spots, account issues.
If you cannot resolve something (disputes, bugs, refunds), say "ESCALATING TO HUMAN SUPPORT" and explain why.
Context: ${JSON.stringify(context || {})}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8), // last 8 messages for context window efficiency
      { role: 'user', content: userMessage },
    ];

    // Try each model in order, fall back if rate-limited
    for (const model of this.models) {
      try {
        const result = await this.callModel(model, messages);
        console.log(`[AI] Responded via ${model}`);
        return result;
      } catch (error: any) {
        const msg = error.response?.data?.error?.message || error.message || '';
        const isRateLimit = msg.includes('rate-limit') || msg.includes('rate_limit') || msg.includes('429') || error.response?.status === 429;
        const isNotFound = msg.includes('not a valid model') || error.response?.status === 404;
        if (isRateLimit || isNotFound) {
          console.warn(`[AI] Model ${model} unavailable (${isRateLimit ? 'rate-limit' : 'not-found'}), trying next...`);
          continue;
        }
        // Non-recoverable error
        console.error(`[AI] OpenRouter error on ${model}:`, msg);
        break;
      }
    }

    return "I'm having trouble responding right now. ESCALATING TO HUMAN SUPPORT — a team member will follow up shortly.";
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
          model: this.models[0],
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
