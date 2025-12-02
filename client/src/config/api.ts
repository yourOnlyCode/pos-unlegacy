export const API_BASE_URL = (import.meta as any).env?.MODE === 'production' 
  ? '' // Same domain in production
  : 'http://localhost:5000';