import axios from 'axios';

interface LLMParseResult {
  customerName?: string;
  tableNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    confidence: number;
  }>;
  confidence: number;
  rawText: string;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async parseOrder(message: string, menu: Record<string, number>): Promise<LLMParseResult> {
    const menuItems = Object.keys(menu).join(', ');
    
    const prompt = `Parse this restaurant order SMS and extract information. Return valid JSON only.

Message: "${message}"
Menu: ${menuItems}

Extract customer name, table number, and ordered items with quantities. Match items to menu using fuzzy matching.

JSON format:
{
  "customerName": "name or null",
  "tableNumber": "number or null",
  "items": [{"name": "menu_item", "quantity": 2, "confidence": 0.9}],
  "confidence": 0.8
}`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = JSON.parse(response.data.choices[0].message.content);
      return {
        ...result,
        rawText: message,
        usedLLM: true
      };
    } catch (error) {
      console.error('OpenAI parsing failed:', error);
      return {
        customerName: undefined,
        tableNumber: undefined,
        items: [],
        confidence: 0.3,
        rawText: message,
        usedLLM: true
      };
    }
  }

  private fallbackParse(message: string, menu: Record<string, number>): LLMParseResult {
    const { parseOrder } = require('../orderParser');
    const result = parseOrder(message, menu);
    
    return {
      customerName: result.customerName,
      tableNumber: result.tableNumber,
      items: result.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        confidence: 0.7
      })),
      confidence: 0.7,
      rawText: message
    };
  }
}