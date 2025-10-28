'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Clock } from 'lucide-react';
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
import { StgCashSchedule } from '@/types/stg-entities';

// Заглушка для демонстрации
const mockSchedule: StgCashSchedule[] = [
  {
    id: '1',
    org_unit_code: 'ALM',
    period_ym: '2024-01',
    user_id: 'user1',
    status: 'draft',
    payment_date: new Date('2024-01-15'),
    doc_date: new Date('2024-01-10'),
    amount: 2500000,
    payment_method: 'Банковский перевод',
    funding_source: 'PU',
    article_code: '1.1.1',
    description: 'Поступления от платных услуг за январь',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    org_unit_code: 'ALM',
    period_ym: '2024-01',
    user_id: 'user1',
    status: 'submitted',
    payment_date: new Date('2024-01-31'),
    doc_date: new Date('2024-01-25'),
    amount: 1500000,
    payment_method: 'Казначейство',
    funding_source: 'RB',
    article_code: '2.1.1',
    description: 'Бюджетное финансирование',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    org_unit_code: 'ALM',
    period_ym: '2024-02',
    user_id: 'user1',
    status: 'approved',
    payment_date: new Date('2024-02-05'),
    doc_date: new Date('2024-02-01'),
    amount: 500000,
    payment_method: 'Дотация',
    funding_source: 'DOTA',
    article_code: '3.1.1',
    description: 'Целевая дотация на стипендии',
    created_at: new Date(),
    updated_at: new Date()
  }
];

export function CashScheduleManagement() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<StgCashSchedule[]>(mockSchedule);
  const [selectedPayment, setSelectedPayment] = useState<StgCashSchedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');

  const handleCreateNew = () => {
    setSelectedPayment(null);
    setViewMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (payment: StgCashSchedule) => {
    setSelectedPayment(payment);
    setViewMode('edit');
    setIsFormOpen(true);
  };

  const handleView = (payment: StgCashSchedule) => {
    setSelectedPayment(payment);
    setViewMode('view');
    setIsFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Черновик' },
      submitted: { variant: 'default' as const, label: 'Отправлено' },
      approved: { variant: 'default' as const, label: 'Получено' },
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

  const getPaymentStatus = (payment: StgCashSchedule) => {
    const today = new Date();
    const paymentDate = new Date(payment.payment_date);
    
    if (payment.status === 'approved') {
      return { icon: <Calendar className="h-4 w-4 text-green-600" />, text: 'Получено' };
    } else if (paymentDate < today) {
      return { icon: <Clock className="h-4 w-4 text-red-600" />, text: 'Просрочено' };
    } else {
      return { icon: <Clock className="h-4 w-4 text-blue-600" />, text: 'Ожидается' };
    }
  };

  const canEdit = (payment: StgCashSchedule) => {
    return user?.role === 'branch_economist' && payment.status === 'draft';
  };

  const canDelete = (payment: StgCashSchedule) => {
    return user?.role === 'branch_economist' && payment.status === 'draft';
  };

  const getTotalAmount = () => {
    return schedule.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getUpcomingAmount = () => {
    const today = new Date();
    return schedule
      .filter(p => new Date(p.payment_date) >= today && p.status !== 'approved')
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  const getReceivedAmount = () => {
    return schedule
      .filter(p => p.status === 'approved')
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">График поступлений</h1>
          <p className="text-muted-foreground">
            Управление графиком поступления денежных средств
          </p>
        </div>
        
        {user?.role === 'branch_economist' && (
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить поступление
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
            <div className="text-2xl font-bold">{schedule.length}</div>
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
            <CardTitle className="text-sm font-medium">Ожидается</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getUpcomingAmount().toLocaleString()} ₸
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Получено</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getReceivedAmount().toLocaleString()} ₸
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица данных */}
      <Card>
        <CardHeader>
          <CardTitle>График платежей</CardTitle>
          <CardDescription>
            Планируемые поступления средств по датам
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Нет данных о планируемых поступлениях</p>
              {user?.role === 'branch_economist' && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первое поступление
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead>Статья</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Состояние</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule
                  .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
                  .map((payment) => {
                    const statusInfo = getPaymentStatus(payment);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {new Date(payment.payment_date).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          {getFundingBadge(payment.funding_source)}
                        </TableCell>
                        <TableCell>
                          {payment.amount.toLocaleString()} ₸
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {payment.payment_method}
                        </TableCell>
                        <TableCell>
                          {payment.article_code}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {statusInfo.icon}
                            <span className="text-sm">{statusInfo.text}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {canEdit(payment) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(payment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {canDelete(payment) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить поступление?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Это действие нельзя отменить. Запись о поступлении 
                                      на сумму {payment.amount.toLocaleString()} ₸ будет удалена.
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
                    );
                  })}
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
              {viewMode === 'create' && 'Добавить поступление'}
              {viewMode === 'edit' && 'Редактировать поступление'}
              {viewMode === 'view' && 'Просмотр поступления'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'create' && 'Заполните информацию о планируемом поступлении'}
              {viewMode === 'edit' && 'Внесите изменения в данные поступления'}
              {viewMode === 'view' && 'Подробная информация о поступлении'}
            </DialogDescription>
          </DialogHeader>
          
          {viewMode === 'view' && selectedPayment ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Дата поступления</label>
                  <p>{new Date(selectedPayment.payment_date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Дата документа</label>
                  <p>{new Date(selectedPayment.doc_date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Сумма</label>
                  <p>{selectedPayment.amount.toLocaleString()} ₸</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Способ поступления</label>
                  <p>{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Источник финансирования</label>
                  <div>{getFundingBadge(selectedPayment.funding_source)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Статья бюджета</label>
                  <p>{selectedPayment.article_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Статус</label>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>
              
              {selectedPayment.description && (
                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <p>{selectedPayment.description}</p>
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
              <h3 className="text-lg font-medium">Форма графика поступлений</h3>
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