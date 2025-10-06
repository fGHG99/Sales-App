// Mock data for IT Support Dashboard

export const mockData = {
  // Account Management Data
  accounts: [
    {
      id: 1,
      username: 'john_admin',
      email: 'john.admin@company.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-15',
      isDeleted: false
    },
    {
      id: 2,
      username: 'sarah_superadmin',
      email: 'sarah.super@company.com',
      role: 'superadmin',
      status: 'active',
      createdAt: '2024-01-10',
      isDeleted: false
    },
    {
      id: 3,
      username: 'mike_courier',
      email: 'mike.courier@company.com',
      role: 'courier',
      status: 'active',
      createdAt: '2024-02-01',
      isDeleted: false
    },
    {
      id: 4,
      username: 'alice_user',
      email: 'alice.user@company.com',
      role: 'user',
      status: 'inactive',
      createdAt: '2024-02-05',
      isDeleted: true
    },
    {
      id: 5,
      username: 'bob_user',
      email: 'bob.user@company.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-02-10',
      isDeleted: false
    },
    {
      id: 6,
      username: 'emma_admin',
      email: 'emma.admin@company.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-02-12',
      isDeleted: false
    },
    {
      id: 7,
      username: 'david_courier',
      email: 'david.courier@company.com',
      role: 'courier',
      status: 'active',
      createdAt: '2024-02-14',
      isDeleted: true
    },
    {
      id: 8,
      username: 'lisa_user',
      email: 'lisa.user@company.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-02-16',
      isDeleted: false
    },
    {
      id: 9,
      username: 'tom_user',
      email: 'tom.user@company.com',
      role: 'user',
      status: 'inactive',
      createdAt: '2024-02-18',
      isDeleted: false
    },
    {
      id: 10,
      username: 'jane_admin',
      email: 'jane.admin@company.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-02-20',
      isDeleted: false
    },
    {
      id: 11,
      username: 'mark_courier',
      email: 'mark.courier@company.com',
      role: 'courier',
      status: 'active',
      createdAt: '2024-02-22',
      isDeleted: false
    },
    {
      id: 12,
      username: 'anna_user',
      email: 'anna.user@company.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-02-24',
      isDeleted: true
    }
  ],

  // Role Management Data
  roles: [
    {
      id: 1,
      name: 'Super Administrator',
      accessKeys: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'Administrator',
      accessKeys: [1, 2, 3, 4, 5, 6, 7, 8],
      createdAt: '2024-01-01'
    },
    {
      id: 3,
      name: 'Courier',
      accessKeys: [1, 2, 3, 4],
      createdAt: '2024-01-01'
    },
    {
      id: 4,
      name: 'User',
      accessKeys: [1, 2],
      createdAt: '2024-01-01'
    }
  ],

  // Access Keys Data
  accessKeys: [
    {
      id: 1,
      name: 'READ_DASHBOARD',
      description: 'Access to view dashboard',
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      name: 'READ_PROFILE',
      description: 'Access to view profile information',
      createdAt: '2024-01-01'
    },
    {
      id: 3,
      name: 'EDIT_PROFILE',
      description: 'Access to edit profile information',
      createdAt: '2024-01-01'
    },
    {
      id: 4,
      name: 'CREATE_ORDER',
      description: 'Access to create new orders',
      createdAt: '2024-01-01'
    },
    {
      id: 5,
      name: 'MANAGE_ORDERS',
      description: 'Access to manage all orders',
      createdAt: '2024-01-01'
    },
    {
      id: 6,
      name: 'MANAGE_USERS',
      description: 'Access to manage user accounts',
      createdAt: '2024-01-01'
    },
    {
      id: 7,
      name: 'MANAGE_ROLES',
      description: 'Access to manage roles and permissions',
      createdAt: '2024-01-01'
    },
    {
      id: 8,
      name: 'SYSTEM_CONFIG',
      description: 'Access to system configuration',
      createdAt: '2024-01-01'
    },
    {
      id: 9,
      name: 'AUDIT_LOG',
      description: 'Access to view audit logs',
      createdAt: '2024-01-01'
    },
    {
      id: 10,
      name: 'SUPER_ADMIN',
      description: 'Full system administrative access',
      createdAt: '2024-01-01'
    }
  ],

  // System Configuration Data
  systemConfig: {
    email: {
      userAgent: 'support@company.com',
      appPassword: 'app-specific-password-123',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587
    },
    twilio: {
      accountSid: 'MOCK_TWILIO_SID',
      authToken: 'your-auth-token-here',
      phoneNumber: '+1234567890'
    }
  },

  // Audit Log Data
  auditLog: [
    {
      id: 1,
      action: 'LOGIN',
      entity: 'User',
      entityId: 'john_admin',
      oldValue: null,
      newValue: null,
      timestamp: new Date('2024-02-15T10:30:00Z').toLocaleString(),
      user: 'john_admin'
    },
    {
      id: 2,
      action: 'UPDATE',
      entity: 'Account',
      entityId: 'alice_user',
      oldValue: { status: 'active' },
      newValue: { status: 'inactive' },
      timestamp: new Date('2024-02-15T09:15:00Z').toLocaleString(),
      user: 'sarah_superadmin'
    },
    {
      id: 3,
      action: 'CREATE',
      entity: 'Role',
      entityId: 'courier_role',
      oldValue: null,
      newValue: { name: 'Courier', permissions: ['READ_DASHBOARD', 'CREATE_ORDER'] },
      timestamp: new Date('2024-02-14T16:45:00Z').toLocaleString(),
      user: 'sarah_superadmin'
    },
    {
      id: 4,
      action: 'DELETE',
      entity: 'AccessKey',
      entityId: 'TEMP_ACCESS',
      oldValue: { name: 'TEMP_ACCESS', description: 'Temporary access key' },
      newValue: null,
      timestamp: new Date('2024-02-14T14:20:00Z').toLocaleString(),
      user: 'john_admin'
    },
    {
      id: 5,
      action: 'UPDATE',
      entity: 'SystemConfig',
      entityId: 'email_config',
      oldValue: { userAgent: 'old@company.com' },
      newValue: { userAgent: 'support@company.com' },
      timestamp: new Date('2024-02-13T11:10:00Z').toLocaleString(),
      user: 'sarah_superadmin'
    },
    {
      id: 6,
      action: 'LOGOUT',
      entity: 'User',
      entityId: 'mike_courier',
      oldValue: null,
      newValue: null,
      timestamp: new Date('2024-02-13T17:30:00Z').toLocaleString(),
      user: 'mike_courier'
    },
    {
      id: 7,
      action: 'CREATE',
      entity: 'Account',
      entityId: 'bob_user',
      oldValue: null,
      newValue: { username: 'bob_user', email: 'bob.user@company.com', role: 'user' },
      timestamp: new Date('2024-02-12T13:25:00Z').toLocaleString(),
      user: 'john_admin'
    },
    {
      id: 8,
      action: 'OTHER',
      entity: 'System',
      entityId: 'backup_process',
      oldValue: null,
      newValue: { status: 'completed', backup_size: '2.5GB' },
      timestamp: new Date('2024-02-12T02:00:00Z').toLocaleString(),
      user: 'system'
    }
  ]
};