import bcrypt from 'bcryptjs';

export interface UserAccount {
  id: string; // uuid or business scoped id
  businessId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const users = new Map<string, UserAccount>(); // key: email

export async function createUser(businessId: string, email: string, password: string): Promise<UserAccount> {
  const existing = users.get(email.toLowerCase());
  if (existing) throw new Error('Email already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  const user: UserAccount = {
    id: `${businessId}:${Date.now()}`,
    businessId,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date()
  };
  users.set(user.email, user);
  return user;
}

export async function validateUser(email: string, password: string): Promise<UserAccount | null> {
  const user = users.get(email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function getUserByEmail(email: string): UserAccount | null {
  return users.get(email.toLowerCase()) || null;
}

export function getUsersByBusiness(businessId: string): UserAccount[] {
  return Array.from(users.values()).filter(u => u.businessId === businessId);
}
