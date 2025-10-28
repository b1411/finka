'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContingentManagement } from '@/components/contingent/contingent-management';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function RevenuePage() {
  const { user } = useAuth();
  const isEconomist = useRole('branch_economist');
  const [isInitialized, setIsInitialized] = useState(false);
  const [contingentData, setContingentData] = useState<StgContingent[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalCash: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация данных
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // Инициализируем справочники
        await seedReferenceData();
        
        // Создаем демо данные если их нет
        await initializeDemoData();
        
        // Загружаем контингент для текущего филиала
        if (user?.org_unit_code) {
          const data = await contingentRepo.findByOrgUnit(user.org_unit_code);
          setContingentData(data);
          
          // Рассчитываем статистику
          const currentMonth = new Date().toISOString().substring(0, 7);
          const monthData = data.filter(item => item.period_ym === currentMonth);
          const totalStudents = monthData.reduce((sum, item) => sum + item.student_count, 0);
          const totalRevenue = monthData
            .filter(item => item.funding_source === 'PU' && item.tariff_amount)
            .reduce((sum, item) => sum + (item.student_count * (item.tariff_amount || 0)), 0);
          
          setStats({
            totalStudents,
            totalRevenue,
            totalCash: totalRevenue * 0.85 // эмуляция собираемости 85%
          });
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      initializeData();
    }
  }, [isInitialized, user?.org_unit_code]);

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

  if (!isEconomist) {
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
              <h1 className="text-3xl font-bold text-gray-900">Доходы</h1>
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

        {/* Вкладки маршрута доходы */}
        <Tabs defaultValue="contingent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contingent">Контингент</TabsTrigger>
            <TabsTrigger value="accruals">Начисления</TabsTrigger>
            <TabsTrigger value="schedule">График платежей</TabsTrigger>
          </TabsList>

          <TabsContent value="contingent">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Контингент обучающихся</CardTitle>
                    <p className="text-sm text-gray-600">
                      Ввод данных о количестве учеников и тарифах по программам
                    </p>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Загрузка данных...</p>
                  </div>
                ) : isInitialized && contingentData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Программа</TableHead>
                            <TableHead>Класс</TableHead>
                            <TableHead>Учеников</TableHead>
                            <TableHead>Источник</TableHead>
                            <TableHead>Тариф</TableHead>
                            <TableHead>Доход/мес</TableHead>
                            <TableHead>Статус</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contingentData
                            .filter(item => item.period_ym === new Date().toISOString().substring(0, 7))
                            .slice(0, 10)
                            .map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.program_name}</TableCell>
                                <TableCell>{item.class_level} класс</TableCell>
                                <TableCell>{item.student_count}</TableCell>
                                <TableCell>{item.funding_source}</TableCell>
                                <TableCell>
                                  {item.tariff_amount ? `${item.tariff_amount.toLocaleString()} ₸` : '—'}
                                </TableCell>
                                <TableCell>
                                  {item.tariff_amount ? 
                                    `${(item.student_count * item.tariff_amount).toLocaleString()} ₸` : 
                                    '—'
                                  }
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={item.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                    {contingentData.length > 10 && (
                      <div className="text-center">
                        <Button variant="outline">
                          Показать все ({contingentData.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Данные не найдены
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить контингент
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accruals">
            <Card>
              <CardHeader>
                <CardTitle>Начисления доходов</CardTitle>
                <p className="text-sm text-gray-600">
                  Автоматически рассчитанные доходы из контингента и планов
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Начисления будут сформированы автоматически после добавления контингента
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>График платежей</CardTitle>
                <p className="text-sm text-gray-600">
                  Планируемые и фактические поступления средств
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    График платежей не добавлен
                  </p>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить платеж
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Сводка */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Сводка по доходам за текущий месяц</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <p className="text-sm text-gray-600">Контингент</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">учеников</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-gray-600">План доходов</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.totalRevenue.toLocaleString()} ₸</p>
                <p className="text-xs text-gray-500">за месяц</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                  <p className="text-sm text-gray-600">Факт поступлений</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalCash.toLocaleString()} ₸</p>
                <p className="text-xs text-gray-500">
                  {stats.totalRevenue > 0 ? 
                    `${((stats.totalCash / stats.totalRevenue) * 100).toFixed(1)}% собираемость` : 
                    'за месяц'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}