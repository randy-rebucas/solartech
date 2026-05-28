export type UserRole =
  | 'super_admin'
  | 'solar_company'
  | 'installer'
  | 'technician'
  | 'client'
  | 'lgu_officer'
  | 'finance_officer'
  | 'investor';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile extends User {
  organization?: Organization;
  permissions: Permission[];
}

export type Permission =
  | 'quotations:read'
  | 'quotations:write'
  | 'quotations:delete'
  | 'installers:read'
  | 'installers:write'
  | 'clients:read'
  | 'clients:write'
  | 'devices:read'
  | 'devices:write'
  | 'billing:read'
  | 'billing:write'
  | 'analytics:read'
  | 'analytics:write'
  | 'admin:read'
  | 'admin:write'
  | 'maintenance:read'
  | 'maintenance:write'
  | 'smart_city:read'
  | 'smart_city:write';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'quotations:read', 'quotations:write', 'quotations:delete',
    'installers:read', 'installers:write',
    'clients:read', 'clients:write',
    'devices:read', 'devices:write',
    'billing:read', 'billing:write',
    'analytics:read', 'analytics:write',
    'admin:read', 'admin:write',
    'maintenance:read', 'maintenance:write',
    'smart_city:read', 'smart_city:write',
  ],
  solar_company: [
    'quotations:read', 'quotations:write',
    'installers:read', 'installers:write',
    'clients:read', 'clients:write',
    'devices:read', 'devices:write',
    'billing:read', 'billing:write',
    'analytics:read',
    'maintenance:read', 'maintenance:write',
  ],
  installer: [
    'quotations:read', 'quotations:write',
    'clients:read',
    'devices:read', 'devices:write',
    'installers:read', 'installers:write',
    'maintenance:read', 'maintenance:write',
    'analytics:read',
  ],
  technician: [
    'devices:read',
    'maintenance:read', 'maintenance:write',
    'clients:read',
  ],
  client: [
    'quotations:read',
    'devices:read',
    'billing:read',
    'analytics:read',
    'maintenance:read',
    'installers:read',
  ],
  lgu_officer: [
    'analytics:read',
    'smart_city:read',
    'devices:read',
  ],
  finance_officer: [
    'billing:read', 'billing:write',
    'analytics:read',
    'quotations:read',
  ],
  investor: [
    'analytics:read',
    'billing:read',
  ],
};
