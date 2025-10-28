'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Briefcase, Calculator } from 'lucide-react';
import { seedReferenceData } from '@/lib/seed-data';
import { calculateContingentStats, initializeDemoData } from '@/lib/demo-data';

interface SystemStatus {
  isInitialized: boolean;
  recordCount: number;
  lastUpdated: Date | null;
}

export default function SystemInfoPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isInitialized: false,
    recordCount: 0,
    lastUpdated: null
  });
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const statsResult = await calculateContingentStats();
      if (statsResult) {
        setStats(statsResult);
        setSystemStatus({
          isInitialized: statsResult.totalStudents > 0,
          recordCount: statsResult.totalStudents,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Ошибка проверки статуса системы:', error);
    }
  };

  const initializeSystem = async () => {
    setIsLoading(true);
    try {
      await seedReferenceData();
      await initializeDemoData();
      await checkSystemStatus();
    } catch (error) {
      console.error('Ошибка инициализации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      stats: stats,
      metadata: {
        generated_by: 'ФИНКА MVP',
        description: 'Демонстрационные данные системы управления бюджетом РФМШ'
      }
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finka_demo_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 ФИНКА MVP
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Система управления бюджетом РФМШ
          </p>
          <Badge variant="outline" className="text-sm">
            Версия 1.0 | MVP Demo
          </Badge>
        </div>

        {/* Статус системы */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Статус системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Статус</p>
                <p className={`text-lg font-semibold ${systemStatus.isInitialized ? 'text-green-600' : 'text-orange-600'}`}>
                  {systemStatus.isInitialized ? '✅ Готов' : '⏳ Не инициализирован'}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Записей данных</p>
                <p className="text-lg font-semibold text-green-600">
                  {systemStatus.recordCount}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Последнее обновление</p>
                <p className="text-lg font-semibold text-purple-600">
                  {systemStatus.lastUpdated ? 
                    systemStatus.lastUpdated.toLocaleString('ru-RU') : 
                    'Никогда'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        {stats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Общая статистика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">По филиалам:</h4>
                    {Object.entries(stats.byOrgUnit).map(([orgUnit, data]: [string, any]) => (
                      <div key={orgUnit} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{orgUnit}</span>
                        <div className="text-right">
                          <div>{data.students} чел.</div>
                          <div className="text-sm text-gray-500">
                            {data.revenue.toLocaleString()} ₸
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">По источникам:</h4>
                    {Object.entries(stats.byFundingSource).map(([source, data]: [string, any]) => (
                      <div key={source} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{source}</span>
                        <div className="text-right">
                          <div>{data.students} чел.</div>
                          <div className="text-sm text-gray-500">
                            {data.revenue.toLocaleString()} ₸
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Действия */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={initializeSystem}
                disabled={isLoading}
                className="h-auto p-4 flex-col space-y-2"
              >
                <Briefcase className="w-6 h-6" />
                <span>{isLoading ? 'Инициализация...' : 'Инициализировать систему'}</span>
                <span className="text-xs opacity-75">
                  Создать демо данные и справочники
                </span>
              </Button>

              <Button 
                variant="outline"
                onClick={exportData}
                disabled={!systemStatus.isInitialized}
                className="h-auto p-4 flex-col space-y-2"
              >
                <Download className="w-6 h-6" />
                <span>Экспорт данных</span>
                <span className="text-xs opacity-75">
                  Скачать JSON с демо данными
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Описание MVP */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>О системе ФИНКА MVP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="mb-4">
                <strong>ФИНКА</strong> — это система управления бюджетом филиалов 
                Республиканской физико-математической школы (РФМШ). 
                MVP демонстрирует основные возможности платформы.
              </p>
              
              <h4 className="font-semibold mb-2">Реализованные модули:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Доходы:</strong> Контингент, начисления, график платежей</li>
                <li><strong>ФОТ:</strong> Штат, тарификация, премии, налоги</li>
                <li><strong>OPEX:</strong> Командировки, коммунальные, прочие расходы</li>
                <li><strong>Дашборд HQ:</strong> P&L, CashFlow, Payroll, сравнения</li>
              </ul>

              <h4 className="font-semibold mb-2 mt-4">Роли пользователей:</h4>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Экономист филиала:</strong> Ввод доходов и OPEX</li>
                <li><strong>Бухгалтер филиала:</strong> График платежей, налоги</li>
                <li><strong>HR филиала:</strong> Штат, тарификация</li>
                <li><strong>Главный экономист:</strong> Консолидация, планы</li>
                <li><strong>Правление:</strong> Просмотр отчетности</li>
              </ul>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Примечание:</strong> Это MVP версия с данными в браузере. 
                  Полная версия будет включать подключение к БД, 
                  расширенную аналитику и дополнительные модули.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}