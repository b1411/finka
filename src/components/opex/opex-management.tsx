'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Plus, Edit2, Trash2, Search, Plane, Calculator, Building, DollarSign } from 'lucide-react';
import { opexRepo, type TripsFormData, type CalcPuRbFormData } from '@/lib/repositories/opex-repository';
import { StgTrips, StgCalcPuRb, StgSchoolArea } from '@/types/stg-entities';

interface OpexManagementProps {
  orgUnitCode?: string;
  selectedPeriod: string;
}

export function OpexManagement({ orgUnitCode, selectedPeriod }: OpexManagementProps) {
  const { user } = useAuth();
  
  // Проверка доступа
  const hasAccess = user && ['branch_economist', 'branch_accountant', 'hq_chief_economist', 'admin'].includes(user.role);
  
  const [trips, setTrips] = useState<StgTrips[]>([]);
  const [calculations, setCalculations] = useState<StgCalcPuRb[]>([]);
  const [areas, setAreas] = useState<StgSchoolArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTripForm, setShowTripForm] = useState(false);
  const [showCalcForm, setShowCalcForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [summary, setSummary] = useState<{
    trips: { count: number; total: number; avgPerTrip: number };
    calculations: { count: number; total: number; byType: Record<string, number> };
    areas: { count: number; totalArea: number; rentTotal: number; avgRatePerSqm: number; byType: Record<string, number> };
    grandTotal: number;
  } | null>(null);

  // Состояние формы командировки
  const [tripData, setTripData] = useState<Partial<TripsFormData>>({
    org_unit_code: '',
    period_ym: selectedPeriod,
    employee_name: '',
    destination: '',
    purpose: '',
    start_date: new Date(),
    end_date: new Date(),
    transport_cost: 0,
    accommodation_cost: 0,
    per_diem: 0,
    other_expenses: 0,
    total_cost: 0,
    funding_source: 'PU',
    article_code: '',
  });

  // Состояние формы расчетов
  const [calcData, setCalcData] = useState<Partial<CalcPuRbFormData>>({
    org_unit_code: '',
    period_ym: selectedPeriod,
    expense_type: '',
    article_code: '',
    calculation_method: '',
    base_value: 0,
    rate: 0,
    calculated_amount: 0,
    funding_source: 'PU',
  });

  // Состояние формы площадей (пока не используется)
  // const [areaData, setAreaData] = useState<Partial<SchoolAreaFormData>>(...)

  // Загрузка данных
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const orgCode = orgUnitCode || user?.org_unit_code || '';
      
      const [tripsData, calcData, areasData, summaryData] = await Promise.all([
        opexRepo.getTrips(orgCode, selectedPeriod),
        opexRepo.getCalcPuRb(orgCode, selectedPeriod),
        opexRepo.getSchoolAreas(orgCode, selectedPeriod),
        opexRepo.getOpexSummary(orgCode, selectedPeriod)
      ]);

      setTrips(tripsData);
      setCalculations(calcData);
      setAreas(areasData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Ошибка загрузки OPEX:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orgUnitCode, selectedPeriod, user?.org_unit_code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Создание командировки
  const handleCreateTrip = () => {
    setTripData({
      org_unit_code: orgUnitCode || user?.org_unit_code || '',
      period_ym: selectedPeriod,
      employee_name: '',
      destination: '',
      purpose: '',
      start_date: new Date(),
      end_date: new Date(),
      transport_cost: 0,
      accommodation_cost: 0,
      per_diem: 0,
      other_expenses: 0,
      total_cost: 0,
      funding_source: 'PU',
      article_code: '',
    });
    setShowTripForm(true);
  };

  // Сохранение командировки
  const handleSaveTrip = async () => {
    try {
      // Автоматический расчет общей стоимости
      const totalCost = (tripData.transport_cost || 0) + 
                       (tripData.accommodation_cost || 0) + 
                       (tripData.per_diem || 0) + 
                       (tripData.other_expenses || 0);

      const formData = { ...tripData, total_cost: totalCost } as TripsFormData;
      
      await opexRepo.createTrip(formData);
      setShowTripForm(false);
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения командировки:', error);
    }
  };

  // Создание расчета
  const handleCreateCalc = () => {
    setCalcData({
      org_unit_code: orgUnitCode || user?.org_unit_code || '',
      period_ym: selectedPeriod,
      expense_type: '',
      article_code: '',
      calculation_method: '',
      base_value: 0,
      rate: 0,
      calculated_amount: 0,
      funding_source: 'PU',
    });
    setShowCalcForm(true);
  };

  // Автоматический расчет суммы
  const calculateAmount = () => {
    const amount = opexRepo.calculateAmount(
      calcData.calculation_method || '',
      calcData.base_value || 0,
      calcData.rate || 0
    );
    setCalcData({ ...calcData, calculated_amount: amount });
  };

  // Сохранение расчета
  const handleSaveCalc = async () => {
    try {
      await opexRepo.createCalcPuRb(calcData as CalcPuRbFormData);
      setShowCalcForm(false);
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения расчета:', error);
    }
  };

  if (!user) {
    return <div>Необходима авторизация</div>;
  }

  if (!hasAccess) {
    return <div>Нет доступа к модулю OPEX</div>;
  }

  return (
    <div className="space-y-6">
      {/* Сводная статистика */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Командировки</p>
                  <p className="text-2xl font-bold">{summary.trips.count}</p>
                  <p className="text-xs text-gray-400">{Math.round(summary.trips.total / 1000)}K ₸</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Расчеты ПУ/РБ</p>
                  <p className="text-2xl font-bold">{summary.calculations.count}</p>
                  <p className="text-xs text-gray-400">{Math.round(summary.calculations.total / 1000)}K ₸</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Площади</p>
                  <p className="text-2xl font-bold">{Math.round(summary.areas.totalArea)} м²</p>
                  <p className="text-xs text-gray-400">{Math.round(summary.areas.rentTotal / 1000)}K ₸</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Общие OPEX</p>
                  <p className="text-2xl font-bold">{Math.round(summary.grandTotal / 1000000 * 10) / 10}M ₸</p>
                  <p className="text-xs text-gray-400">за месяц</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Основные вкладки */}
      <Tabs defaultValue="trips" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trips">Командировки</TabsTrigger>
          <TabsTrigger value="calculations">Расчеты ПУ/РБ</TabsTrigger>
          <TabsTrigger value="areas">Площади</TabsTrigger>
        </TabsList>

        {/* Командировки */}
        <TabsContent value="trips">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Командировки - {selectedPeriod}</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Поиск..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button onClick={handleCreateTrip}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить командировку
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сотрудник</TableHead>
                      <TableHead>Направление</TableHead>
                      <TableHead>Цель</TableHead>
                      <TableHead>Период</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips
                      .filter(trip => 
                        trip.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>{trip.employee_name}</TableCell>
                          <TableCell>{trip.destination}</TableCell>
                          <TableCell>{trip.purpose}</TableCell>
                          <TableCell>
                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {trip.total_cost.toLocaleString()} ₸
                          </TableCell>
                          <TableCell>
                            <Badge variant={trip.status === 'approved' ? 'default' : 'secondary'}>
                              {trip.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Расчеты ПУ/РБ */}
        <TabsContent value="calculations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Расчеты ПУ/РБ - {selectedPeriod}</CardTitle>
                <Button onClick={handleCreateCalc}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить расчет
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип расхода</TableHead>
                      <TableHead>Статья</TableHead>
                      <TableHead>Метод расчета</TableHead>
                      <TableHead className="text-right">База</TableHead>
                      <TableHead className="text-right">Ставка</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell>{calc.expense_type}</TableCell>
                        <TableCell>{calc.article_code}</TableCell>
                        <TableCell>{calc.calculation_method}</TableCell>
                        <TableCell className="text-right">{calc.base_value.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{calc.rate.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{calc.calculated_amount.toLocaleString()} ₸</TableCell>
                        <TableCell>
                          <Badge variant={calc.status === 'approved' ? 'default' : 'secondary'}>
                            {calc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Площади */}
        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Площади школы - {selectedPeriod}</CardTitle>
                <Button onClick={() => setShowAreaForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить площадь
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Загрузка...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тип площади</TableHead>
                      <TableHead className="text-right">Площадь (м²)</TableHead>
                      <TableHead className="text-right">Отопление</TableHead>
                      <TableHead className="text-right">Электричество</TableHead>
                      <TableHead className="text-right">Охрана</TableHead>
                      <TableHead className="text-right">Уборка</TableHead>
                      <TableHead className="text-right">Итого</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areas.map((area) => {
                      const totalCost = (area.heating_cost || 0) + 
                                       (area.electricity_cost || 0) + 
                                       (area.security_cost || 0) + 
                                       (area.cleaning_cost || 0) + 
                                       (area.maintenance_cost || 0);
                      return (
                        <TableRow key={area.id}>
                          <TableCell>{area.area_type}</TableCell>
                          <TableCell className="text-right">{area.area_sqm.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(area.heating_cost || 0).toLocaleString()} ₸</TableCell>
                          <TableCell className="text-right">{(area.electricity_cost || 0).toLocaleString()} ₸</TableCell>
                          <TableCell className="text-right">{(area.security_cost || 0).toLocaleString()} ₸</TableCell>
                          <TableCell className="text-right">{(area.cleaning_cost || 0).toLocaleString()} ₸</TableCell>
                          <TableCell className="text-right">{totalCost.toLocaleString()} ₸</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Форма командировки */}
      <Dialog open={showTripForm} onOpenChange={setShowTripForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Новая командировка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Сотрудник</Label>
                <Input
                  value={tripData.employee_name || ''}
                  onChange={(e) => setTripData({...tripData, employee_name: e.target.value})}
                  placeholder="ФИО сотрудника"
                />
              </div>
              <div>
                <Label>Место назначения</Label>
                <Input
                  value={tripData.destination || ''}
                  onChange={(e) => setTripData({...tripData, destination: e.target.value})}
                  placeholder="Город/страна"
                />
              </div>
            </div>

            <div>
              <Label>Цель командировки</Label>
              <Input
                value={tripData.purpose || ''}
                onChange={(e) => setTripData({...tripData, purpose: e.target.value})}
                placeholder="Цель поездки"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Транспорт</Label>
                <Input
                  type="number"
                  value={tripData.transport_cost || 0}
                  onChange={(e) => setTripData({...tripData, transport_cost: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Проживание</Label>
                <Input
                  type="number"
                  value={tripData.accommodation_cost || 0}
                  onChange={(e) => setTripData({...tripData, accommodation_cost: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Суточные</Label>
                <Input
                  type="number"
                  value={tripData.per_diem || 0}
                  onChange={(e) => setTripData({...tripData, per_diem: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Прочее</Label>
                <Input
                  type="number"
                  value={tripData.other_expenses || 0}
                  onChange={(e) => setTripData({...tripData, other_expenses: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTripForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveTrip}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Форма расчетов */}
      <Dialog open={showCalcForm} onOpenChange={setShowCalcForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Новый расчет</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Тип расхода</Label>
                <Input
                  value={calcData.expense_type || ''}
                  onChange={(e) => setCalcData({...calcData, expense_type: e.target.value})}
                  placeholder="аренда, утилиты..."
                />
              </div>
              <div>
                <Label>Код статьи</Label>
                <Input
                  value={calcData.article_code || ''}
                  onChange={(e) => setCalcData({...calcData, article_code: e.target.value})}
                  placeholder="Статья БДР"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>База расчета</Label>
                <Input
                  type="number"
                  value={calcData.base_value || 0}
                  onChange={(e) => setCalcData({...calcData, base_value: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label>Ставка</Label>
                <Input
                  type="number"
                  value={calcData.rate || 0}
                  onChange={(e) => {
                    setCalcData({...calcData, rate: Number(e.target.value)});
                    setTimeout(calculateAmount, 100);
                  }}
                />
              </div>
              <div>
                <Label>Расчетная сумма</Label>
                <Input
                  type="number"
                  value={calcData.calculated_amount || 0}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCalcForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveCalc}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}