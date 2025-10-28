'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Building2, Calculator, TrendingUp, Users, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { SystemStats, QuickActions, RealTimeNotifications } from '@/components/ui/ux-components';

export default function HomePage() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Неверный email или пароль');
    }
    setIsLoading(false);
  };

  // Демо пользователи для быстрого входа
  const demoUsers = [
    { email: 'economist.alm@rfmsh.kz', role: 'Экономист филиала (Алматы)', icon: Calculator },
    { email: 'accountant.alm@rfmsh.kz', role: 'Бухгалтер филиала (Алматы)', icon: Building2 },
    { email: 'chief.economist@rfmsh.kz', role: 'Главный экономист', icon: TrendingUp },
    { email: 'board@rfmsh.kz', role: 'Правление РФМШ', icon: Users }
  ];

  if (user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                onClick={logout}
              >
                Выйти
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Добро пожаловать в ФИНКА
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Привет, {user.name}!
            </p>
            <p className="text-lg text-gray-500">
              Роль: {getRoleDisplayName(user.role)}
              {user.org_unit_code && ` | Филиал: ${user.org_unit_code}`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Main content area with role cards */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Карточки быстрого доступа в зависимости от роли */}
                {renderRoleCards(user.role)}
                
                {/* Системная карточка для всех */}
                <Link href="/system">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-600">
                        <Building2 className="w-5 h-5 mr-2" />
                        Система
                      </CardTitle>
                      <CardDescription>
                        Статус, статистика, управление данными
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                {/* О системе карточка */}
                <Link href="/about">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-indigo-300">
                    <CardHeader>
                      <CardTitle className="flex items-center text-indigo-600">
                        <FileText className="w-5 h-5 mr-2" />
                        О системе
                      </CardTitle>
                      <CardDescription>
                        Информация, архитектура, roadmap
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>
            
            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* System Statistics */}
              <SystemStats className="shadow-lg" />
              
              {/* Quick Actions */}
              <QuickActions userRole={user.role} className="shadow-lg" />
              
              {/* Real-time Notifications */}
              <RealTimeNotifications />
              
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Активность</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Новых записей</span>
                    <span className="font-bold text-blue-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Обновлений</span>
                    <span className="font-bold text-green-600">34</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ошибок валидации</span>
                    <span className="font-bold text-red-600">2</span>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус системы</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">База данных</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Экспорт отчетов</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Валидация данных</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">ФИНКА</h1>
          <p className="text-xl text-gray-600 mb-2">
            Финансовый модуль РФМШ
          </p>
          <p className="text-gray-500">
            Система управления бюджетом филиалов
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Форма входа */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Вход в систему</CardTitle>
              <CardDescription>
                Введите ваши учетные данные для доступа к платформе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@rfmsh.kz"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    required
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Вход...' : 'Войти'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Демо аккаунты */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Демо доступ</CardTitle>
              <CardDescription>
                Выберите роль для демонстрации (пароль: 123456)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoUsers.map((demo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword('123456');
                    }}
                  >
                    <demo.icon className="w-5 h-5 mr-3 shrink-0" />
                    <div>
                      <div className="font-medium">{demo.role}</div>
                      <div className="text-sm text-gray-500">{demo.email}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'branch_economist': 'Экономист филиала',
    'branch_accountant': 'Бухгалтер филиала',
    'branch_hr': 'HR/Замдиректора филиала',
    'hq_chief_economist': 'Главный экономист',
    'hq_board': 'Правление РФМШ',
    'admin': 'Системный администратор'
  };
  return roleNames[role] || role;
}

function renderRoleCards(role: string) {
  const cards = [];

  // Филиальные роли
  if (role.startsWith('branch_')) {
    cards.push(
      <Link key="revenue" href="/branch/revenue">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Доходы
            </CardTitle>
            <CardDescription>
              Контингент, начисления, график платежей
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );

    cards.push(
      <Link key="payroll" href="/branch/payroll">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              ФОТ
            </CardTitle>
            <CardDescription>
              Штат, тарификация, премии, налоги
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );

    cards.push(
      <Link key="opex" href="/branch/opex">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Расходы
            </CardTitle>
            <CardDescription>
              Командировки, коммунальные, прочие OPEX
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );
  }

  // Отчеты (доступны экономистам и бухгалтерам)
  if (['branch_economist', 'branch_accountant', 'hq_chief_economist', 'hq_chief_accountant', 'hq_ceo', 'admin'].includes(role)) {
    cards.push(
      <Link key="reports" href="/reports">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Отчеты
            </CardTitle>
            <CardDescription>
              Excel/PDF экспорт, аналитика, KPI
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );

    // Валидация данных (для экономистов и бухгалтеров)
    cards.push(
      <Link key="validation" href="/validation">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Валидация
            </CardTitle>
            <CardDescription>
              Проверка данных, бизнес-правила
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );
  }

  // KPI Dashboard (доступен всем ролям)
  cards.push(
    <Link key="kpi" href="/kpi">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            KPI Dashboard
          </CardTitle>
          <CardDescription>
            Ключевые показатели эффективности
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );

  // HQ роли
  if (role.startsWith('hq_') || role === 'admin') {
    cards.push(
      <Link key="dashboard" href="/hq/dashboard">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Дашборд
            </CardTitle>
            <CardDescription>
              P&L, CashFlow, Payroll, Сравнения
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    );

    if (role === 'hq_chief_economist') {
      cards.push(
        <Link key="planning" href="/hq/planning">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Планирование
              </CardTitle>
              <CardDescription>
                Планы, план-факт, консолидация
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      );
    }
  }

  return cards;
}
