'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Search } from 'lucide-react';
import { staffingRepo, type StaffingFormData } from '@/lib/repositories/staffing-repository';
import { StaffingRecord } from '@/types/core-entities';

interface PayrollManagementProps {
  orgUnitCode?: string;
  selectedPeriod: string;
}

export function PayrollManagement({ orgUnitCode, selectedPeriod }: PayrollManagementProps) {
  const { user } = useAuth();
  
  // Проверка доступа
  const hasAccess = user && ['branch_hr', 'hq_chief_economist', 'admin'].includes(user.role);
  
  const [staffing, setStaffing] = useState<StaffingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffingRecord | null>(null);

  // Состояние формы - простая версия
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [employmentType, setEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'>('FULL_TIME');
  const [baseSalary, setBaseSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [allowances, setAllowances] = useState(0);

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
    setEmployeeId('');
    setFullName('');
    setPosition('');
    setDepartment('');
    setEmploymentType('FULL_TIME');
    setBaseSalary(0);
    setBonus(0);
    setAllowances(0);
    setEditingRecord(null);
    setShowForm(true);
  };

  // Сохранение
  const handleSave = async () => {
    try {
      const formData: StaffingFormData = {
        org_unit_code: orgUnitCode || user?.org_unit_code || '',
        period_ym: selectedPeriod,
        employee_id: employeeId,
        full_name: fullName,
        position: position,
        department: department,
        employment_type: employmentType,
        base_salary: baseSalary,
        bonus: bonus,
        allowances: allowances,
        deductions: 0,
        social_tax: 0,
        pension_contribution: 0,
        hire_date: new Date(),
        is_active: true,
        employment_status: 'ACTIVE',
      };

      if (editingRecord) {
        await staffingRepo.update(editingRecord.id, formData);
      } else {
        await staffingRepo.create(formData);
      }
      
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  // Фильтрация данных
  const filteredStaffing = staffing.filter(record =>
    record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employee_id.includes(searchTerm) ||
    record.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div>Необходима авторизация</div>;
  }

  if (!hasAccess) {
    return <div>Нет доступа к модулю Payroll</div>;
  }

  return (
    <div className="space-y-6">
      {/* Управление */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Расчет заработной платы - {selectedPeriod}</CardTitle>
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
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить сотрудника
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
                  <TableHead>ID</TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Должность</TableHead>
                  <TableHead>Тип занятости</TableHead>
                  <TableHead className="text-right">Оклад</TableHead>
                  <TableHead className="text-right">Премия</TableHead>
                  <TableHead className="text-right">К доплате</TableHead>
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
                      <TableCell>
                        <Badge variant={record.employment_type === 'FULL_TIME' ? 'default' : 'secondary'}>
                          {record.employment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.base_salary.toLocaleString()} ₸
                      </TableCell>
                      <TableCell className="text-right">
                        {(record.bonus || 0).toLocaleString()} ₸
                      </TableCell>
                      <TableCell className="text-right">
                        {salary.netSalary.toLocaleString()} ₸
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            record.employment_status === 'ACTIVE' ? 'default' : 'secondary'
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
                            onClick={() => {
                              setEmployeeId(record.employee_id);
                              setFullName(record.full_name);
                              setPosition(record.position);
                              setDepartment(record.department);
                              setEmploymentType(record.employment_type);
                              setBaseSalary(record.base_salary);
                              setBonus(record.bonus || 0);
                              setAllowances(record.allowances || 0);
                              setEditingRecord(record);
                              setShowForm(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
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

      {/* Простая форма */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Редактировать зарплату' : 'Новый сотрудник'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID сотрудника</Label>
                <Input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP001"
                />
              </div>
              <div>
                <Label>ФИО</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов И.И."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Должность</Label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Преподаватель"
                />
              </div>
              <div>
                <Label>Департамент</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Академический"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Тип занятости</Label>
                <Select 
                  value={employmentType} 
                  onValueChange={(value: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN') => setEmploymentType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Полная ставка</SelectItem>
                    <SelectItem value="PART_TIME">Частичная</SelectItem>
                    <SelectItem value="CONTRACT">Контракт</SelectItem>
                    <SelectItem value="INTERN">Стажер</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Оклад</Label>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Премия</Label>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Надбавки</Label>
                <Input
                  type="number"
                  value={allowances}
                  onChange={(e) => setAllowances(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}