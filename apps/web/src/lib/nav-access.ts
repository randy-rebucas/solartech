import { ROLE_PERMISSIONS, type Permission, type UserRole } from '@solartech/shared';

export type NavAccessRule = {
  /** Role must be one of these (if set) */
  roles?: UserRole[];
  /** User needs any one of these permissions (if set) */
  permissions?: Permission[];
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === 'super_admin') return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Nav visible when role/permission rules pass (OR between roles and permissions when both set). */
export function canAccessNav(role: UserRole, rule?: NavAccessRule): boolean {
  if (!rule) return true;
  if (role === 'super_admin') return true;

  const roleOk = rule.roles ? rule.roles.includes(role) : false;
  const permOk = rule.permissions?.length
    ? rule.permissions.some((p) => hasPermission(role, p))
    : false;

  if (rule.roles && rule.permissions) return roleOk || permOk;
  if (rule.roles) return roleOk;
  if (rule.permissions) return permOk;
  return true;
}
