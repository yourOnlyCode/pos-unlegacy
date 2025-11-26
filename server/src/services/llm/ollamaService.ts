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
  isValid: boolean;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2:1b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async parseOrder(message: string, menu: Record<string, number>): Promise<LLMParseResult> {
    const menuItems = Object.keys(menu).join(', ');

    const prompt = `Parse this restaurant order SMS and extract information in JSON format:

Message: "${message}"
Available menu items: ${menuItems}

Extract:
1. Customer name (if mentioned)
2. Table number (if mentioned) 
3. Ordered items with quantities
4. Match items to menu (fuzzy matching allowed)

Respond with JSON only:
{
  "customerName": "name or null",
  "tableNumber": "number or null", 
  "items": [{"name": "menu_item", "quantity": 2, "confidence": 0.9}],
  "confidence": 0.8
}`;

    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9
        }
      });

      const result = JSON.parse(response.data.response);
      return {
        ...result,
        rawText: message,
        isValid: result.items && result.items.length > 0,
      };
    } catch (error) {
      console.error('Ollama parsing failed:', error);
      return {
        customerName: undefined,
        tableNumber: undefined,
        items: [],
        confidence: 0.3,
        rawText: message,
        isValid: false,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
}