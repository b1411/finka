'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContingentManagement } from '@/components/contingent/contingent-management';
import { AccrualsManagement } from '@/components/accruals/accruals-management';
import { CashScheduleManagement } from '@/components/cash-schedule/cash-schedule-management';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function RevenuePage() {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-6">Требуется авторизация</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Модуль доходов</h1>
            <p className="text-muted-foreground">
              Управление контингентом, начислениями и поступлениями средств
            </p>
          </div>
        </div>

        {/* Табы с модулями */}
        <Tabs defaultValue="contingent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contingent">Контингент</TabsTrigger>
            <TabsTrigger value="accruals">Начисления</TabsTrigger>
            <TabsTrigger value="schedule">График платежей</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contingent" className="space-y-4">
            <ContingentManagement />
          </TabsContent>
          
          <TabsContent value="accruals" className="space-y-4">
            <AccrualsManagement />
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4">
            <CashScheduleManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}