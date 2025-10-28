'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { PeriodSelector } from '@/components/ui/period-selector';
import { PayrollManagement } from '@/components/payroll/payroll-management';

export default function PayrollPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('202412');

  const hasAccess = user && ['branch_economist', 'branch_accountant', 'branch_hr', 'hq_chief_economist', 'admin'].includes(user.role);

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
            <p>У вас нет прав доступа к этому разделу</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Хедер */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                На главную
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ФОТ</h1>
              <p className="text-gray-600">
                {user.org_unit_code} | {user.name}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline">
              Экспорт
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Селектор периода */}
        <div className="flex justify-end mb-6">
          <div>
            <label className="text-sm font-medium mb-1 block">Период</label>
            <PeriodSelector
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              className="w-40"
            />
          </div>
        </div>

        {/* Основной модуль Payroll */}
        <PayrollManagement
          orgUnitCode={user.org_unit_code}
          selectedPeriod={selectedPeriod}
        />


      </div>
    </div>
  );
}