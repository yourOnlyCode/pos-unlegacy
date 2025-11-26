// Manages multi-step SMS conversations for order collection

export interface ConversationState {
  phone: string;
  businessPhone: string;
  stage: 'awaiting_info' | 'complete';
  orderText?: string;
  parsedOrder?: any;
  customerName?: string;
  tableNumber?: string;
  timestamp: Date;
}

// In-memory conversation state (use Redis in production)
const conversations = new Map<string, ConversationState>();

// Conversation expires after 10 minutes
const CONVERSATION_TIMEOUT = 10 * 60 * 1000;

export function getConversation(customerPhone: string): ConversationState | undefined {
  const conversation = conversations.get(customerPhone);
  
  if (conversation) {
    // Check if conversation has expired
    const age = Date.now() - conversation.timestamp.getTime();
    if (age > CONVERSATION_TIMEOUT) {
      conversations.delete(customerPhone);
      return undefined;
    }
  }
  
  return conversation;
}

export function createConversation(
  customerPhone: string, 
  businessPhone: string,
  stage: 'awaiting_info',
  orderText: string,
  parsedOrder: any
): ConversationState {
  const conversation: ConversationState = {
    phone: customerPhone,
    businessPhone,
    stage,
    orderText,
    parsedOrder,
    timestamp: new Date()
  };
  
  conversations.set(customerPhone, conversation);
  return conversation;
}

export function updateConversation(
  customerPhone: string,
  updates: Partial<ConversationState>
): ConversationState | undefined {
  const conversation = conversations.get(customerPhone);
  
  if (!conversation) {
    return undefined;
  }
  
  // Update fields
  Object.assign(conversation, updates);
  conversation.timestamp = new Date();
  
  conversations.set(customerPhone, conversation);
  return conversation;
}

export function completeConversation(customerPhone: string): void {
  conversations.delete(customerPhone);
}

export function clearExpiredConversations(): void {
  const now = Date.now();
  
  for (const [phone, conversation] of conversations.entries()) {
    const age = now - conversation.timestamp.getTime();
    if (age > CONVERSATION_TIMEOUT) {
      conversations.delete(phone);
    }
  }
}

// Cleanup expired conversations every minute
setInterval(clearExpiredConversations, 60000);
