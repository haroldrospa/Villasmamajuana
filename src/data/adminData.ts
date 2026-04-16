export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  timestamp: string;
}

// Default admin accounts
export const defaultAdmins: AdminUser[] = [
  {
    id: 'admin-1',
    name: 'Administrador Principal',
    email: 'admin@villasmamajuana.com',
    password: 'admin123',
    createdAt: '2026-01-01',
  },
];

export const defaultActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-1',
    adminName: 'Administrador Principal',
    action: 'Inicio de sesión',
    timestamp: '2026-03-18T10:00:00',
  },
];
