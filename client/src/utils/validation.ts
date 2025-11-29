export interface ValidationError {
  field: string;
  message: string;
}

export const validateBusinessForm = (data: {
  businessName: string;
  email: string;
  menu?: Record<string, number>;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Business name validation
  if (!data.businessName.trim()) {
    errors.push({ field: 'businessName', message: 'Business name is required' });
  } else if (data.businessName.length < 2) {
    errors.push({ field: 'businessName', message: 'Business name must be at least 2 characters' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  // Menu validation (optional)
  const menuItems = data.menu ? Object.keys(data.menu) : [];
  
  menuItems.forEach(item => {
    if (!item.trim()) {
      errors.push({ field: 'menu', message: 'Menu item names cannot be empty' });
    }
    if (data.menu && data.menu[item] <= 0) {
      errors.push({ field: 'menu', message: 'Menu item prices must be greater than 0' });
    }
  });

  return errors;
};

export const generateBusinessId = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
};