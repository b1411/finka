'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContingentForm } from '@/components/forms/contingent-form';
import { useAuth } from '@/lib/auth';
import { StgContingent } from '@/types/stg-entities';
import { contingentRepo } from '@/lib/repositories/contingent-repository';
import { toast } from 'sonner';

export function ContingentManagement() {
  const { user } = useAuth();
  const [contingents, setContingents] = useState<StgContingent[]>([]);
  const [selectedContingent, setSelectedContingent] = useState<StgContingent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');

  const loadContingents = useCallback(async () => {
    if (!user?.org_unit_code) return;
    
    setIsLoading(true);
    try {
      const data = await contingentRepo.findByOrgUnit(user.org_unit_code);
      setContingents(data);
    } catch (error) {
      console.error('Ошибка загрузки контингента:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  }, [user?.org_unit_code]);

  // Загрузка данных
  useEffect(() => {
    if (user?.org_unit_code) {
      loadContingents();
    }
  }, [user?.org_unit_code, loadContingents]);

  const handleCreateNew = () => {
    setSelectedContingent(null);
    setViewMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (contingent: StgContingent) => {
    setSelectedContingent(contingent);
    setViewMode('edit');
    setIsFormOpen(true);
  };

  const handleView = (contingent: StgContingent) => {
    setSelectedContingent(contingent);
    setViewMode('view');
    setIsFormOpen(true);
  };

  const handleDelete = async (contingent: StgContingent) => {
    try {
      await contingentRepo.delete(contingent.id);
      await loadContingents();
      toast.success('Запись удалена');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка удаления записи');
    }
  };

  const handleFormSave = async () => {
    await loadContingents();
    setIsFormOpen(false);
    setSelectedContingent(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Черновик' },
      submitted: { variant: 'default' as const, label: 'Отправлено' },
      approved: { variant: 'default' as const, label: 'Утверждено' },
      rejected: { variant: 'destructive' as const, label: 'Отклонено' }
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canEdit = (contingent: StgContingent) => {
    return user?.role === 'branch_economist' && 
           contingent.status === 'draft';
  };

  const canDelete = (contingent: StgContingent) => {
    return user?.role === 'branch_economist' && contingent.status === 'draft';
  };

  const calculateMonthlyRevenue = (contingent: StgContingent) => {
    if (contingent.funding_source === 'PU' && contingent.tariff_amount) {
      return contingent.student_count * contingent.tariff_amount;
    }
    return 0;
  };

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Контингент обучающихся</h1>
          <p className="text-muted-foreground">
            Управление данными о количестве учеников и тарифах
          </p>
        </div>
        
        {user?.role === 'branch_economist' && (
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить запись
          </Button>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contingents.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общий контингент</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contingents.reduce((sum, c) => sum + c.student_count, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Платные услуги</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contingents.filter(c => c.funding_source === 'PU').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Месячный доход (ПУ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contingents
                .reduce((sum, c) => sum + calculateMonthlyRevenue(c), 0)
                .toLocaleString()} ₸
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица данных */}
      <Card>
        <CardHeader>
          <CardTitle>Список записей</CardTitle>
          <CardDescription>
            Все данные о контингенте для вашего подразделения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contingents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет данных о контингенте</p>
              {user?.role === 'branch_economist' && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первую запись
                </Button>
              )}
            </div>
          ) : (
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
                  <TableHead>Период</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contingents.map((contingent) => (
                  <TableRow key={contingent.id}>
                    <TableCell className="font-medium">
                      {contingent.program_name}
                    </TableCell>
                    <TableCell>{contingent.class_level}</TableCell>
                    <TableCell>{contingent.student_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contingent.funding_source}</Badge>
                    </TableCell>
                    <TableCell>
                      {contingent.tariff_amount 
                        ? `${contingent.tariff_amount.toLocaleString()} ₸`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {calculateMonthlyRevenue(contingent).toLocaleString()} ₸
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contingent.status)}
                    </TableCell>
                    <TableCell>{contingent.period_ym}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(contingent)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEdit(contingent) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(contingent)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canDelete(contingent) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Запись о контингенте 
                                  &quot;{contingent.program_name}&quot; класс {contingent.class_level} будет удалена.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(contingent)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог формы */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'create' && 'Добавить данные о контингенте'}
              {viewMode === 'edit' && 'Редактировать данные о контингенте'}
              {viewMode === 'view' && 'Просмотр данных о контингенте'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'create' && 'Заполните информацию о количестве учеников и тарифах'}
              {viewMode === 'edit' && 'Внесите изменения в данные о контингенте'}
              {viewMode === 'view' && 'Подробная информация о записи контингента'}
            </DialogDescription>
          </DialogHeader>
          
          {viewMode === 'view' && selectedContingent ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Программа</label>
                  <p>{selectedContingent.program_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Класс</label>
                  <p>{selectedContingent.class_level}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Количество учеников</label>
                  <p>{selectedContingent.student_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Источник финансирования</label>
                  <p>{selectedContingent.funding_source}</p>
                </div>
                {selectedContingent.tariff_amount && (
                  <div>
                    <label className="text-sm font-medium">Тариф</label>
                    <p>{selectedContingent.tariff_amount.toLocaleString()} ₸</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Статус</label>
                  <div>{getStatusBadge(selectedContingent.status)}</div>
                </div>
              </div>
              
              {selectedContingent.calculation_note && (
                <div>
                  <label className="text-sm font-medium">Примечание</label>
                  <p>{selectedContingent.calculation_note}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
          ) : (
            <ContingentForm
              initialData={selectedContingent || undefined}
              onSave={handleFormSave}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}