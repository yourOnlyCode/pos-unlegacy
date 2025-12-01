export const sendChatMessage = async (
  businessId: string,
  message: string,
  sessionId: string
) => {
  const response = await fetch('/api/orders/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId,
      message,
      customerPhone: sessionId,
    }),
  });
  return response.json();
};

export const fetchBusinessMenu = async (businessId: string) => {
  const response = await fetch(`/api/business/${businessId}/public`);
  return response.json();
};

export const fetchNotifications = async (sessionId: string) => {
  const response = await fetch(`/api/orders/notifications/${sessionId}`);
  return response.json();
};