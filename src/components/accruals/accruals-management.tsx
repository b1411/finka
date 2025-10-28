'use client';

import { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/auth';
import { StgIncomeAccruals } from '@/types/stg-entities';

// Заглушка для демонстрации
const mockAccruals: StgIncomeAccruals[] = [
  {
    id: '1',
    org_unit_code: 'ALM',
    period_ym: '2024-01',
    user_id: 'user1',
    status: 'draft',
    funding_source: 'PU',
    article_code: '1.1.1',
    accrual_amount: 5000000,
    calculation_base: 'Контингент 100 учеников * 50,000 тенге',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    org_unit_code: 'ALM',
    period_ym: '2024-01',
    user_id: 'user1',
    status: 'submitted',
    funding_source: 'RB',
    article_code: '2.1.1',
    accrual_amount: 2500000,
    calculation_base: 'Бюджетное финансирование по нормативам',
    created_at: new Date(),
    updated_at: new Date()
  }
];

export function AccrualsManagement() {
  const { user } = useAuth();
  const [accruals, setAccruals] = useState<StgIncomeAccruals[]>(mockAccruals);
  const [selectedAccrual, setSelectedAccrual] = useState<StgIncomeAccruals | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');

  const handleCreateNew = () => {
    setSelectedAccrual(null);
    setViewMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (accrual: StgIncomeAccruals) => {
    setSelectedAccrual(accrual);
    setViewMode('edit');
    setIsFormOpen(true);
  };

  const handleView = (accrual: StgIncomeAccruals) => {
    setSelectedAccrual(accrual);
    setViewMode('view');
    setIsFormOpen(true);
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

  const getFundingBadge = (funding: string) => {
    const variants = {
      'PU': { variant: 'default' as const, label: 'Платные услуги' },
      'RB': { variant: 'secondary' as const, label: 'Республиканский бюджет' },
      'DOTA': { variant: 'outline' as const, label: 'Дотации' }
    };
    const config = variants[funding as keyof typeof variants] || variants['PU'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canEdit = (accrual: StgIncomeAccruals) => {
    return user?.role === 'branch_economist' && accrual.status === 'draft';
  };

  const canDelete = (accrual: StgIncomeAccruals) => {
    return user?.role === 'branch_economist' && accrual.status === 'draft';
  };

  const getTotalAmount = () => {
    return accruals.reduce((sum, accrual) => sum + accrual.accrual_amount, 0);
  };

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Начисления доходов</h1>
          <p className="text-muted-foreground">
            Управление начисленными доходами по статьям бюджета
          </p>
        </div>
        
        {user?.role === 'branch_economist' && (
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить начисление
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
            <div className="text-2xl font-bold">{accruals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalAmount().toLocaleString()} ₸
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Платные услуги</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accruals.filter(a => a.funding_source === 'PU').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Бюджет</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accruals.filter(a => a.funding_source === 'RB').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица данных */}
      <Card>
        <CardHeader>
          <CardTitle>Список начислений</CardTitle>
          <CardDescription>
            Все начисления доходов для вашего подразделения
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accruals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет данных о начислениях</p>
              {user?.role === 'branch_economist' && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первое начисление
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Статья</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Основание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accruals.map((accrual) => (
                  <TableRow key={accrual.id}>
                    <TableCell className="font-medium">
                      {accrual.article_code}
                    </TableCell>
                    <TableCell>
                      {getFundingBadge(accrual.funding_source)}
                    </TableCell>
                    <TableCell>
                      {accrual.accrual_amount.toLocaleString()} ₸
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {accrual.calculation_base || '—'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(accrual.status)}
                    </TableCell>
                    <TableCell>{accrual.period_ym}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(accrual)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {canEdit(accrual) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(accrual)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canDelete(accrual) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить начисление?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Начисление по статье 
                                  &quot;{accrual.article_code}&quot; будет удалено.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction>
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

      {/* Диалог просмотра/редактирования */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'create' && 'Добавить начисление дохода'}
              {viewMode === 'edit' && 'Редактировать начисление'}
              {viewMode === 'view' && 'Просмотр начисления'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'create' && 'Заполните информацию о начисленном доходе'}
              {viewMode === 'edit' && 'Внесите изменения в данные начисления'}
              {viewMode === 'view' && 'Подробная информация о начислении'}
            </DialogDescription>
          </DialogHeader>
          
          {viewMode === 'view' && selectedAccrual ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Статья бюджета</label>
                  <p>{selectedAccrual.article_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Источник финансирования</label>
                  <div>{getFundingBadge(selectedAccrual.funding_source)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Сумма начисления</label>
                  <p>{selectedAccrual.accrual_amount.toLocaleString()} ₸</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Статус</label>
                  <div>{getStatusBadge(selectedAccrual.status)}</div>
                </div>
              </div>
              
              {selectedAccrual.calculation_base && (
                <div>
                  <label className="text-sm font-medium">Основание расчета</label>
                  <p>{selectedAccrual.calculation_base}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-medium">Форма начислений</h3>
              <p className="text-muted-foreground mt-2">В разработке...</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setIsFormOpen(false)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}