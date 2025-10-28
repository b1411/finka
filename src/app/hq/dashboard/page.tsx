'use client';

import { useAuth, useRole } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { PeriodSelector } from '@/components/ui/period-selector';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { contingentRepo } from '@/lib/repositories/contingent-repository';
import { cashScheduleRepo } from '@/lib/repositories/cash-schedule-repository';
import { getETLStatistics } from '@/lib/etl/aggregation-functions';
import { getOrgUnits } from '@/lib/seed-data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Демо данные для графиков
const revenueData = [
  { month: 'Янв', plan: 4000, fact: 3800, pu: 2400, rb: 1000, dota: 400 },
  { month: 'Фев', plan: 3000, fact: 3200, pu: 1800, rb: 1000, dota: 400 },
  { month: 'Мар', plan: 2000, fact: 2800, pu: 1600, rb: 800, dota: 400 },
  { month: 'Апр', plan: 2780, fact: 2600, pu: 1400, rb: 800, dota: 400 },
  { month: 'Май', plan: 1890, fact: 2400, pu: 1200, rb: 800, dota: 400 },
];

const branchData = [
  { name: 'ALM', revenue: 12000, expenses: 10000, margin: 16.7 },
  { name: 'AST', revenue: 8000, expenses: 7500, margin: 6.3 },
  { name: 'URA', revenue: 6000, expenses: 5800, margin: 3.3 },
  { name: 'SHY', revenue: 7000, expenses: 6800, margin: 2.9 },
];

const sourceDistribution = [
  { name: 'ПУ', value: 60, amount: 18000 },
  { name: 'РБ', value: 30, amount: 9000 },
  { name: 'Дотации', value: 10, amount: 3000 },
];

// Интерфейс для данных дашборда
interface DashboardData {
  totalStudents: number;
  totalRevenue: number;
  totalCashFlow: number;
  totalExpenses: number;
  revenueByMonth: { month: string; plan: number; fact: number; pu: number; rb: number; dota: number }[];
  branchPerformance: { name: string; revenue: number; expenses: number; students: number; margin: number }[];
  fundingDistribution: { name: string; value: number; amount: number }[];
  etlStats: {
    stgRecords: {
      contingent: number;
      accruals: number;
      cashSchedule: number;
    };
    processedPeriods: string[];
    lastProcessedDate: Date | null;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const hasAccess = useRole(['hq_chief_economist', 'hq_board', 'admin']);
  const [selectedPeriod, setSelectedPeriod] = useState('2024-10');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных дашборда
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Получаем все филиалы
      const orgUnits = await getOrgUnits();
      
      // Агрегируем данные по всем филиалам
      let totalStudents = 0;
      let totalRevenue = 0;
      let totalCashFlow = 0;
      const branchPerformance = [];
      const fundingSourceTotals = { PU: 0, RB: 0, DOTA: 0 };

      for (const orgUnit of orgUnits) {
        // Получаем контингент
        const contingent = await contingentRepo.findByOrgUnit(orgUnit.org_unit_code);
        const currentPeriodContingent = contingent.filter(c => c.period_ym === selectedPeriod);
        
        const branchStudents = currentPeriodContingent.reduce((sum, c) => sum + c.student_count, 0);
        const branchRevenue = currentPeriodContingent
          .filter(c => c.funding_source === 'PU' && c.tariff_amount)
          .reduce((sum, c) => sum + (c.student_count * (c.tariff_amount || 0)), 0);

        // Получаем денежные потоки
        const cashFlow = await cashScheduleRepo.findByOrgUnit(orgUnit.org_unit_code);
        const currentPeriodCash = cashFlow
          .filter(cf => cf.period_ym === selectedPeriod)
          .reduce((sum, cf) => sum + cf.amount, 0);

        // Группируем по источникам финансирования
        currentPeriodContingent.forEach(c => {
          if (c.funding_source === 'PU' && c.tariff_amount) {
            fundingSourceTotals.PU += c.student_count * c.tariff_amount;
          }
        });

        totalStudents += branchStudents;
        totalRevenue += branchRevenue;
        totalCashFlow += currentPeriodCash;

        branchPerformance.push({
          name: orgUnit.org_unit_code,
          revenue: branchRevenue,
          expenses: branchRevenue * 0.85, // Примерные расходы 85%
          students: branchStudents,
          margin: branchRevenue > 0 ? ((branchRevenue - branchRevenue * 0.85) / branchRevenue) * 100 : 0
        });
      }

      // Получаем статистику ETL
      const etlStats = await getETLStatistics();

      // Формируем данные для графиков
      const revenueByMonth = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (4 - i));
        const monthStr = date.toLocaleDateString('ru-RU', { month: 'short' });
        
        // Имитируем исторические данные
        const monthlyRevenue = totalRevenue * (0.8 + Math.random() * 0.4);
        revenueByMonth.push({
          month: monthStr,
          plan: monthlyRevenue,
          fact: monthlyRevenue * (0.9 + Math.random() * 0.2),
          pu: monthlyRevenue * 0.6,
          rb: monthlyRevenue * 0.3,
          dota: monthlyRevenue * 0.1
        });
      }

      const fundingDistribution = [
        { name: 'Платные услуги', value: 60, amount: fundingSourceTotals.PU },
        { name: 'Респ. бюджет', value: 30, amount: fundingSourceTotals.RB },
        { name: 'Дотации', value: 10, amount: fundingSourceTotals.DOTA }
      ];

      setDashboardData({
        totalStudents,
        totalRevenue,
        totalCashFlow,
        totalExpenses: totalRevenue * 0.85,
        revenueByMonth,
        branchPerformance,
        fundingDistribution,
        etlStats
      });

    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
              <h1 className="text-3xl font-bold text-gray-900">Консолидированная отчетность</h1>
              <p className="text-gray-600">
                {user.name} | {user.role === 'hq_board' ? 'Правление' : 'Главный экономист'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </Button>
          </div>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm font-medium mb-1 block">Период</label>
                <PeriodSelector 
                  value={selectedPeriod} 
                  onChange={setSelectedPeriod}
                  className="w-40"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Филиал</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все филиалы</SelectItem>
                    <SelectItem value="ALM">Алматы</SelectItem>
                    <SelectItem value="AST">Астана</SelectItem>
                    <SelectItem value="URA">Уральск</SelectItem>
                    <SelectItem value="SHY">Шымкент</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Общий доход</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? '...' : `${((dashboardData?.totalRevenue || 0) / 1000000).toFixed(1)}M ₸`}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% к плану
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Расходы</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? '...' : `${((dashboardData?.totalExpenses || 0) / 1000000).toFixed(1)}M ₸`}
                  </p>
                  <p className="text-sm text-red-600 flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    +5% к плану
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">EBITDA</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? '...' : `${(((dashboardData?.totalRevenue || 0) - (dashboardData?.totalExpenses || 0)) / 1000000).toFixed(1)}M ₸`}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    {isLoading ? '...' : `${(((dashboardData?.totalRevenue || 0) - (dashboardData?.totalExpenses || 0)) / (dashboardData?.totalRevenue || 1) * 100).toFixed(1)}% маржа`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Студенты</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? '...' : (dashboardData?.totalStudents || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    {isLoading ? '...' : `${Math.round((dashboardData?.totalRevenue || 0) / (dashboardData?.totalStudents || 1)).toLocaleString()} ₸/студент`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Дашборды */}
        <Tabs defaultValue="budget" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="budget">P&L</TabsTrigger>
            <TabsTrigger value="cashflow">CashFlow</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="compare">Сравнение</TabsTrigger>
          </TabsList>

          <TabsContent value="budget">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>План vs Факт по доходам</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData?.revenueByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="plan" fill="#8884d8" name="План" />
                      <Bar dataKey="fact" fill="#82ca9d" name="Факт" />
                      <Bar dataKey="pu" fill="#ff7c7c" name="ПУ" />
                      <Bar dataKey="rb" fill="#ffc658" name="РБ" />
                      <Bar dataKey="dota" fill="#8dd1e1" name="ДОТА" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Структура доходов по источникам</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, value}) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cashflow">
            <Card>
              <CardHeader>
                <CardTitle>Движение денежных средств</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pu" stroke="#8884d8" name="Притоки (ПУ)" />
                    <Line type="monotone" dataKey="rb" stroke="#82ca9d" name="Притоки (РБ)" />
                    <Line type="monotone" dataKey="dota" stroke="#ffc658" name="Дотации" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle>Структура ФОТ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Общий ФОТ</p>
                    <p className="text-2xl font-bold text-blue-600">18.5M ₸</p>
                    <p className="text-xs text-gray-500">74% от расходов</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Сотрудников</p>
                    <p className="text-2xl font-bold text-green-600">347</p>
                    <p className="text-xs text-gray-500">324.2 FTE</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Средняя з/п</p>
                    <p className="text-2xl font-bold text-purple-600">57,063 ₸</p>
                    <p className="text-xs text-gray-500">нетто</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Сравнение филиалов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Филиал</th>
                        <th className="text-right p-2">Доходы</th>
                        <th className="text-right p-2">Расходы</th>
                        <th className="text-right p-2">Маржа %</th>
                        <th className="text-right p-2">Рейтинг</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchData.map((branch, index) => (
                        <tr key={branch.name} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{branch.name}</td>
                          <td className="p-2 text-right text-green-600">
                            {branch.revenue.toLocaleString()} ₸
                          </td>
                          <td className="p-2 text-right text-red-600">
                            {branch.expenses.toLocaleString()} ₸
                          </td>
                          <td className="p-2 text-right">
                            <span className={`font-semibold ${branch.margin > 10 ? 'text-green-600' : branch.margin > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {branch.margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              #{index + 1}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}