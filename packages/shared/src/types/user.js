"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.ROLE_PERMISSIONS = {
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
        'devices:read',
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
//# sourceMappingURL=user.js.map