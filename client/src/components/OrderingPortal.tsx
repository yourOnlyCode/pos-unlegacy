import { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import FloatingCart from './FloatingCart';
import OrderHeader from './order-portal/OrderHeader';
import MessageList from './order-portal/MessageList';
import CartActions from './order-portal/CartActions';
import OrderInput from './order-portal/OrderInput';
import { CartItem, addToCart, removeFromCart, formatCartOrder } from '../ordering-helpers/cartHelpers';
import { Message, createCustomerMessage, createSystemMessage, createErrorMessage } from '../ordering-helpers/messageHelpers';
import { sendChatMessage } from '../ordering-helpers/apiHelpers';

interface OrderingPortalProps {
  businessId: string;
  businessName: string;
}

interface BusinessMenu {
  [key: string]: number;
}

export default function OrderingPortal({ businessId, businessName }: OrderingPortalProps) {
  const [sessionId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Welcome to ${businessName}! Here's our menu:`,
      sender: 'system',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const menuSentRef = useRef(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessMenu, setBusinessMenu] = useState<BusinessMenu>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`/api/business/${businessId}/public`);
        const business = await response.json();
        setBusinessMenu(business.menu || {});

        if (!menuSentRef.current) {
          menuSentRef.current = true;
          const menuResponse = await fetch('/api/orders/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId,
              message: 'menu',
              customerPhone: sessionId,
            }),
          });

          const result = await menuResponse.json();
          const menuMessage: Message = {
            id: '2',
            text: result.response,
            sender: 'system',
            timestamp: new Date(),
            type: 'info'
          };

          setMessages(prev => [...prev, menuMessage]);
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      }
    };
    fetchMenu();
  }, [businessId, sessionId]);

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const response = await fetch(`/api/orders/notifications/${sessionId}`);
        const result = await response.json();

        if (result.notifications && result.notifications.length > 0) {
          result.notifications.forEach((notification: any) => {
            const systemMessage: Message = {
              id: notification.id,
              text: notification.message,
              sender: 'system',
              timestamp: new Date(notification.timestamp),
              type: 'info'
            };
            setMessages(prev => [...prev, systemMessage]);
          });
        }
      } catch (error) {
        // Silently fail - notifications are not critical
      }
    };

    const interval = setInterval(pollNotifications, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const customerMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'customer',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, customerMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/orders/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          message: inputText,
          customerPhone: sessionId,
        }),
      });

      const result = await response.json();

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: 'system',
        timestamp: new Date(),
        type: result.type || 'info',
        paymentLink: result.paymentLink,
        orderId: result.orderId,
        total: result.total,
        orderItems: result.orderItems,
      };

      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, something went wrong. Please try again.',
        sender: 'system',
        timestamp: new Date(),
        type: 'info',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToOrder = (item: string, quantity: number) => {
    setCartItems(prev => addToCart(prev, item, quantity));
  };

  const handleRemoveFromCart = (itemName: string) => {
    setCartItems(prev => removeFromCart(prev, itemName));
  };

  const handleSendCart = async () => {
    if (cartItems.length === 0) return;

    const orderText = formatCartOrder(cartItems);
    setCartItems([]);
    setInputText('');
    
    setMessages(prev => [...prev, createCustomerMessage(orderText)]);
    
    setLoading(true);
    try {
      const result = await sendChatMessage(businessId, orderText, sessionId);
      const systemMessage = createSystemMessage(result.response, result.type, {
        paymentLink: result.paymentLink,
        orderId: result.orderId,
        total: result.total,
        orderItems: result.orderItems,
      });
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      setMessages(prev => [...prev, createErrorMessage()]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <FloatingCart items={cartItems} onRemoveItem={handleRemoveFromCart} />
      
      <OrderHeader businessName={businessName} />
      
      <MessageList
        messages={messages}
        businessMenu={businessMenu}
        onAddToOrder={handleAddToOrder}
        businessId={businessId}
        sessionId={sessionId}
        setMessages={setMessages}
        setCartItems={setCartItems}
        setLoading={setLoading}
      />
      
      <div ref={messagesEndRef} />
      
      <CartActions
        cartItemsCount={cartItems.length}
        onSendCart={handleSendCart}
        onClearCart={() => setCartItems([])}
      />
      
      <OrderInput
        inputText={inputText}
        setInputText={setInputText}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
        loading={loading}
        cartItemsCount={cartItems.length}
      />
    </Box>
  );
}