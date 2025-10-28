'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Search, Users, Calculator, TrendingUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { staffingRepo, type StaffingFormData } from '@/lib/repositories/staffing-repository';
import { StaffingRecord } from '@/types/core-entities';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface StaffingManagementProps {
  orgUnitCode?: string;
  selectedPeriod: string;
}

export function StaffingManagement({ orgUnitCode, selectedPeriod }: StaffingManagementProps) {
  const { user } = useAuth();
  
  // Проверка доступа
  const hasAccess = user && ['branch_hr', 'hq_chief_economist', 'admin'].includes(user.role);
  
  const [staffing, setStaffing] = useState<StaffingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffingRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalEmployees: number;
    activeEmployees: number;
    totalSalaryExpense: number;
    averageSalary: number;
    byEmploymentType: Record<string, number>;
    byDepartment: Record<string, number>;
  } | null>(null);

  // Форма
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<StaffingFormData>();

  // Загрузка данных
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let records: StaffingRecord[] = [];
      
      if (orgUnitCode) {
        records = await staffingRepo.findByOrgUnit(orgUnitCode);
      } else {
        records = await staffingRepo.findAll();
      }

      // Фильтрация по периоду
      const filtered = records.filter(r => r.period_ym === selectedPeriod);
      setStaffing(filtered);

      // Загрузка статистики
      if (orgUnitCode) {
        const orgStats = await staffingRepo.getOrgUnitStats(orgUnitCode, selectedPeriod);
        setStats(orgStats);
      }
    } catch (error) {
      console.error('Ошибка загрузки персонала:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orgUnitCode, selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Открыть форму создания
  const handleCreate = () => {
    reset({
      org_unit_code: orgUnitCode || user?.org_unit_code || '',
      period_ym: selectedPeriod,
      employment_type: 'FULL_TIME',
      base_salary: 0,
      bonus: 0,
      allowances: 0,
      deductions: 0,
      social_tax: 0,
      pension_contribution: 0,
      is_active: true,
      employment_status: 'ACTIVE',
      hire_date: new Date(),
    });
    setEditingRecord(null);
    setShowForm(true);
  };

  // Открыть форму редактирования
  const handleEdit = (record: StaffingRecord) => {
    reset({
      ...record,
      hire_date: new Date(record.hire_date),
      termination_date: record.termination_date ? new Date(record.termination_date) : undefined,
    });
    setEditingRecord(record);
    setShowForm(true);
  };

  // Сохранение
  const onSubmit = async (data: StaffingFormData) => {
    try {
      if (editingRecord) {
        await staffingRepo.update(editingRecord.id, data);
      } else {
        await staffingRepo.create(data);
      }
      
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  // Удаление
  const handleDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      await staffingRepo.delete(recordToDelete);
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  // Фильтрация данных
  const filteredStaffing = staffing.filter(record =>
    record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employee_id.includes(searchTerm) ||
    record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div>Необходима авторизация</div>;
  }

  if (!hasAccess) {
    return <div>Нет доступа к модулю HR</div>;
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Всего сотрудников</p>
                  <p className="text-2xl font-bold">{stats.activeEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Фонд оплаты</p>
                  <p className="text-2xl font-bold">{Math.round(stats.totalSalaryExpense / 1000)}K ₸</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Средняя зарплата</p>
                  <p className="text-2xl font-bold">{Math.round(stats.averageSalary / 1000)}K ₸</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Штатный персонал</p>
                  <p className="text-2xl font-bold">{stats.byEmploymentType.FULL_TIME}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Управление */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Штатное расписание - {selectedPeriod}</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск сотрудника..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить сотрудника
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRecord ? 'Редактировать сотрудника' : 'Новый сотрудник'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employee_id">ID сотрудника</Label>
                        <Input
                          id="employee_id"
                          {...register('employee_id')}
                          placeholder="EMP001"
                        />
                        {errors.employee_id && (
                          <p className="text-sm text-red-500">{errors.employee_id.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="full_name">ФИО</Label>
                        <Input
                          id="full_name"
                          {...register('full_name')}
                          placeholder="Иванов Иван Иванович"
                        />
                        {errors.full_name && (
                          <p className="text-sm text-red-500">{errors.full_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="position">Должность</Label>
                        <Input
                          id="position"
                          {...register('position')}
                          placeholder="Преподаватель"
                        />
                        {errors.position && (
                          <p className="text-sm text-red-500">{errors.position.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="department">Департамент</Label>
                        <Input
                          id="department"
                          {...register('department')}
                          placeholder="Академический департамент"
                        />
                        {errors.department && (
                          <p className="text-sm text-red-500">{errors.department.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employment_type">Тип трудоустройства</Label>
                        <Select onValueChange={(value) => setValue('employment_type', value as 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL_TIME">Полная ставка</SelectItem>
                            <SelectItem value="PART_TIME">Частичная занятость</SelectItem>
                            <SelectItem value="CONTRACT">Контракт</SelectItem>
                            <SelectItem value="INTERN">Стажер</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="base_salary">Оклад</Label>
                        <Input
                          id="base_salary"
                          type="number"
                          {...register('base_salary', { valueAsNumber: true })}
                          placeholder="0"
                        />
                        {errors.base_salary && (
                          <p className="text-sm text-red-500">{errors.base_salary.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="bonus">Премия</Label>
                        <Input
                          id="bonus"
                          type="number"
                          {...register('bonus', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="allowances">Надбавки</Label>
                        <Input
                          id="allowances"
                          type="number"
                          {...register('allowances', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deductions">Удержания</Label>
                        <Input
                          id="deductions"
                          type="number"
                          {...register('deductions', { valueAsNumber: true })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Отмена
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                  <TableHead>ID</TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Департамент</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="text-right">Оклад</TableHead>
                  <TableHead className="text-right">Итого</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaffing.map((record) => {
                  const salary = staffingRepo.calculateSalary(record);
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono">{record.employee_id}</TableCell>
                      <TableCell>{record.full_name}</TableCell>
                      <TableCell>{record.position}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>
                        <Badge variant={record.employment_type === 'FULL_TIME' ? 'default' : 'secondary'}>
                          {record.employment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.base_salary.toLocaleString()} ₸
                      </TableCell>
                      <TableCell className="text-right">
                        {salary.grossSalary.toLocaleString()} ₸
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            record.employment_status === 'ACTIVE' ? 'default' :
                            record.employment_status === 'TERMINATED' ? 'destructive' : 'secondary'
                          }
                        >
                          {record.employment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRecordToDelete(record.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
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

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите удаление</AlertDialogTitle>
            <AlertDialogDescription>
              Сотрудник будет помечен как неактивный. Это действие можно отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}