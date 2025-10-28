'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types/finka-core';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole, orgUnitCode?: string) => void;
  hasPermission: (action: string, resource: string) => boolean;
  canAccessOrgUnit: (orgUnitCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Демо пользователи для тестирования
const DEMO_USERS: User[] = [
  {
    id: 'user-1',
    email: 'economist.alm@rfmsh.kz',
    name: 'Аида Касымова',
    role: 'branch_economist',
    org_unit_code: 'ALM'
  },
  {
    id: 'user-2',
    email: 'accountant.alm@rfmsh.kz',
    name: 'Бахтияр Жумабеков',
    role: 'branch_accountant',
    org_unit_code: 'ALM'
  },
  {
    id: 'user-3',
    email: 'hr.ast@rfmsh.kz',
    name: 'Гульнара Назарбаева',
    role: 'branch_hr',
    org_unit_code: 'AST'
  },
  {
    id: 'user-4',
    email: 'chief.economist@rfmsh.kz',
    name: 'Марат Абдуллин',
    role: 'hq_chief_economist'
  },
  {
    id: 'user-5',
    email: 'board@rfmsh.kz',
    name: 'Правление РФМШ',
    role: 'hq_board'
  },
  {
    id: 'user-6',
    email: 'admin@rfmsh.kz',
    name: 'Системный администратор',
    role: 'admin'
  }
];

// Права доступа по ролям
const ROLE_PERMISSIONS = {
  branch_economist: [
    'read:stg_contingent',
    'write:stg_contingent',
    'read:stg_income_accruals',
    'write:stg_income_accruals',
    'read:stg_trips',
    'write:stg_trips',
    'read:stg_calc_pu_rb',
    'write:stg_calc_pu_rb'
  ],
  branch_accountant: [
    'read:stg_cash_schedule',
    'write:stg_cash_schedule',
    'read:stg_social_taxes',
    'write:stg_social_taxes',
    'read:stg_fot_main',
    'write:stg_fot_main'
  ],
  branch_hr: [
    'read:stg_staffing',
    'write:stg_staffing',
    'read:stg_tariffs',
    'write:stg_tariffs',
    'read:stg_timetable',
    'write:stg_timetable'
  ],
  hq_chief_economist: [
    'read:*',
    'write:bdr_itog',
    'write:dds_itog',
    'write:fot_itog',
    'approve:*',
    'read:stg_plans_23',
    'write:stg_plans_23',
    'read:stg_plan_fact_24',
    'write:stg_plan_fact_24'
  ],
  hq_board: [
    'read:consolidated_budget',
    'read:consolidated_cashflow',
    'read:consolidated_payroll',
    'read:branch_comparison',
    'read:kpi_metrics'
  ],
  admin: ['*']
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Инициализация пользователя из localStorage
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('finka_current_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error);
          localStorage.removeItem('finka_current_user');
        }
      }
    }
    return null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Эмуляция проверки пароля (для демо все пароли = "123456")
    if (password !== '123456') {
      return false;
    }

    const foundUser = DEMO_USERS.find(u => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('finka_current_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('finka_current_user');
  };

  const switchRole = (role: UserRole, orgUnitCode?: string) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      role,
      org_unit_code: orgUnitCode
    };
    
    setUser(updatedUser);
    localStorage.setItem('finka_current_user', JSON.stringify(updatedUser));
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Админ имеет все права
    if (userPermissions.includes('*')) return true;
    
    // Точное совпадение
    const exactPermission = `${action}:${resource}`;
    if (userPermissions.includes(exactPermission)) return true;
    
    // Wildcard для действия
    const actionWildcard = `${action}:*`;
    if (userPermissions.includes(actionWildcard)) return true;
    
    return false;
  };

  const canAccessOrgUnit = (orgUnitCode: string): boolean => {
    if (!user) return false;
    
    // HQ роли видят все филиалы
    if (user.role.startsWith('hq_') || user.role === 'admin') {
      return true;
    }
    
    // Филиальные роли видят только свой филиал
    return user.org_unit_code === orgUnitCode;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        switchRole, 
        hasPermission, 
        canAccessOrgUnit 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}

// Hook для проверки конкретной роли
export function useRole(requiredRole: UserRole | UserRole[]) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

// Hook для проверки прав доступа
export function usePermission(action: string, resource: string) {
  const { hasPermission } = useAuth();
  return hasPermission(action, resource);
}