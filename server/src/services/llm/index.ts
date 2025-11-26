import { OllamaService } from './ollamaService';
import { OpenAIService } from './openaiService';

export interface LLMParseResult {
  customerName?: string;
  tableNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    confidence: number;
  }>;
  confidence: number;
  rawText: string;
  usedLLM: boolean;
}

export class HybridOrderParser {
  private llmService?: OllamaService | OpenAIService;

  constructor() {
    // Initialize LLM service if available (optional)
    if (process.env.OLLAMA_ENABLED === 'true') {
      this.llmService = new OllamaService(
        process.env.OLLAMA_URL || 'http://localhost:11434',
        process.env.OLLAMA_MODEL || 'llama3.2:3b'
      );
    } else if (process.env.OPENAI_API_KEY) {
      this.llmService = new OpenAIService(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_MODEL || 'gpt-4o-mini'
      );
    }
  }

  async parseOrder(message: string, menu: Record<string, number>): Promise<LLMParseResult> {
    // Step 1: Try existing fast parser first
    const { parseOrder } = require('../orderParser');
    const basicResult = parseOrder(message, menu);
    
    // Step 2: Check if parsing was successful
    const hasValidItems = basicResult.items && basicResult.items.length > 0;
    const hasHighConfidence = !basicResult.hasFuzzyMatches;
    
    if (hasValidItems && hasHighConfidence) {
      // Basic parser succeeded - return result
      return {
        customerName: basicResult.customerName,
        tableNumber: basicResult.tableNumber,
        items: basicResult.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          confidence: 0.9
        })),
        confidence: 0.9,
        rawText: message,
        usedLLM: false
      };
    }
    
    // Step 3: Basic parser failed or uncertain - use LLM as safety net
    if (this.llmService) {
      console.log('Basic parser failed/uncertain, using LLM fallback');
      const llmResult = await this.llmService.parseOrder(message, menu);
      return {
        ...llmResult,
        usedLLM: true
      };
    }
    
    // Step 4: No LLM available - return basic result anyway
    return {
      customerName: basicResult.customerName,
      tableNumber: basicResult.tableNumber,
      items: basicResult.items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        confidence: 0.5
      })) || [],
      confidence: 0.5,
      rawText: message,
      usedLLM: false
    };
  }

  async isHealthy(): Promise<boolean> {
    if (!this.llmService) return true; // Basic parser always works
    if (this.llmService instanceof OllamaService) {
      return this.llmService.isHealthy();
    }
    return true;
  }
}

export { OllamaService, OpenAIService };