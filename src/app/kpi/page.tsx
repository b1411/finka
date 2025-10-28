'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PeriodSelector } from '@/components/ui/period-selector';
import { KPIDashboard } from '@/components/kpi/kpi-dashboard';

export default function KPIPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('202412');

  // Проверка доступа - доступ ко всем ролям для демонстрации
  const hasAccess = user && [
    'branch_economist', 
    'branch_accountant',
    'branch_hr',
    'hq_chief_economist', 
    'hq_chief_accountant',
    'hq_board',
    'hq_ceo', 
    'admin'
  ].includes(user.role);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Необходима авторизация</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Нет доступа к KPI дашборду</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMetricClick = (metric: any) => {
    console.log('Клик по метрике:', metric);
    // Здесь можно реализовать переход к детальному отчету по метрике
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={user.role.includes('hq_') ? '/hq/dashboard' : '/branch/revenue'}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              KPI Dashboard
            </h1>
          </div>
          
          {/* Селектор периода */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Период</label>
              <PeriodSelector
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                className="w-40"
              />
            </div>
          </div>
        </div>

        {/* Основной KPI дашборд */}
        <KPIDashboard
          orgUnitCode={user.org_unit_code}
          selectedPeriod={selectedPeriod}
          onMetricClick={handleMetricClick}
        />
      </div>
    </div>
  );
}