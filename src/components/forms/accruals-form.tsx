'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PeriodSelector } from '@/components/ui/period-selector';
import { FormWrapper } from '@/components/ui/form-wrapper';
import { useAuth } from '@/lib/auth';
import { StgIncomeAccruals } from '@/types/stg-entities';
import { incomeAccrualsRepo } from '@/lib/repositories/income-accruals-repository';
import { getFundingSources, getBudgetArticles } from '@/lib/seed-data';
import { FundingSource, BudgetArticle } from '@/types/finka-core';

// Схема валидации формы начислений
const accrualsFormSchema = z.object({
  org_unit_code: z.string().min(1),
  period_ym: z.string().min(1),
  user_id: z.string().min(1),
  funding_source: z.enum(['PU', 'RB', 'DOTA']),
  article_code: z.string().min(1, 'Код статьи обязателен'),
  accrual_amount: z.number().positive('Сумма должна быть больше 0'),
  calculation_base: z.string().optional(),
  contingent_source_id: z.string().optional()
});

type AccrualsFormData = z.infer<typeof accrualsFormSchema>;

interface AccrualsFormProps {
  initialData?: StgIncomeAccruals;
  onSave?: (data: StgIncomeAccruals) => void;
  onSubmit?: (data: StgIncomeAccruals) => void;
}

export function AccrualsForm({ initialData, onSave, onSubmit }: AccrualsFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [budgetArticles, setBudgetArticles] = useState<BudgetArticle[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AccrualsFormData>({
    resolver: zodResolver(accrualsFormSchema),
    defaultValues: {
      org_unit_code: initialData?.org_unit_code || user?.org_unit_code || '',
      period_ym: initialData?.period_ym || new Date().toISOString().substring(0, 7),
      user_id: initialData?.user_id || user?.id || '',
      funding_source: (initialData?.funding_source as 'PU' | 'RB' | 'DOTA') || 'PU',
      article_code: initialData?.article_code || '',
      accrual_amount: initialData?.accrual_amount || 0,
      calculation_base: initialData?.calculation_base || '',
      contingent_source_id: initialData?.contingent_source_id || ''
    }
  });

  const selectedFundingSource = watch('funding_source');

  // Загрузка справочников
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sources, articles] = await Promise.all([
          getFundingSources(),
          getBudgetArticles()
        ]);
        setFundingSources(sources);
        setBudgetArticles(articles);
      } catch (err) {
        console.error('Ошибка загрузки справочников:', err);
      }
    };

    loadData();
  }, []);

  // Фильтрация статей по источнику финансирования
  const filteredArticles = budgetArticles.filter(
    article => article.funding_source === selectedFundingSource
  );

  const handleSave = async (data: AccrualsFormData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result: StgIncomeAccruals;
      
      if (initialData?.id) {
        // Обновление существующей записи
        result = await incomeAccrualsRepo.update(initialData.id, {
          ...data,
          status: 'draft'
        });
        setSuccess('Данные успешно обновлены');
      } else {
        // Создание новой записи
        result = await incomeAccrualsRepo.create({
          ...data,
          status: 'draft'
        });
        setSuccess('Запись успешно создана');
      }

      onSave?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: AccrualsFormData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Сначала сохраняем
      await handleSave(data);
      
      // Затем меняем статус на submitted
      if (initialData?.id) {
        const result = await incomeAccrualsRepo.update(initialData.id, {
          status: 'submitted'
        });
        setSuccess('Данные отправлены на проверку');
        onSubmit?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при отправке');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormWrapper
      title="Начисления доходов"
      description="Ввод данных о начисленных доходах по статьям бюджета"
      status={initialData?.status || 'draft'}
      isLoading={isLoading}
      error={error}
      success={success}
      onSave={handleSubmit(handleSave)}
      onSubmit={handleSubmit(handleFormSubmit)}
      canSave={user?.role === 'branch_economist'}
      canSubmit={user?.role === 'branch_economist'}
    >
      <form className="space-y-6">
        {/* Основные поля */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Филиал */}
          <div>
            <Label htmlFor="org_unit_code">Филиал</Label>
            <Input
              id="org_unit_code"
              {...register('org_unit_code')}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Период */}
          <div>
            <Label htmlFor="period_ym">Период</Label>
            <PeriodSelector
              value={watch('period_ym')}
              onChange={(value) => setValue('period_ym', value)}
            />
          </div>

          {/* Источник финансирования */}
          <div>
            <Label htmlFor="funding_source">Источник финансирования *</Label>
            <Select
              value={selectedFundingSource}
              onValueChange={(value) => setValue('funding_source', value as 'PU' | 'RB' | 'DOTA')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите источник" />
              </SelectTrigger>
              <SelectContent>
                {fundingSources.map((source) => (
                  <SelectItem key={source.funding_code} value={source.funding_code}>
                    {source.funding_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.funding_source && (
              <p className="text-sm text-red-500 mt-1">{errors.funding_source.message}</p>
            )}
          </div>

          {/* Статья бюджета */}
          <div>
            <Label htmlFor="article_code">Статья бюджета *</Label>
            <Select
              value={watch('article_code')}
              onValueChange={(value) => setValue('article_code', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите статью" />
              </SelectTrigger>
              <SelectContent>
                {filteredArticles.map((article) => (
                  <SelectItem key={article.article_code} value={article.article_code}>
                    {article.article_code} - {article.article_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.article_code && (
              <p className="text-sm text-red-500 mt-1">{errors.article_code.message}</p>
            )}
          </div>

          {/* Сумма начисления */}
          <div className="md:col-span-2">
            <Label htmlFor="accrual_amount">Сумма начисления (тенге) *</Label>
            <Input
              id="accrual_amount"
              type="number"
              min="0"
              step="0.01"
              {...register('accrual_amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.accrual_amount && (
              <p className="text-sm text-red-500 mt-1">{errors.accrual_amount.message}</p>
            )}
          </div>

          {/* Основание расчета */}
          <div className="md:col-span-2">
            <Label htmlFor="calculation_base">Основание для расчета</Label>
            <Input
              id="calculation_base"
              {...register('calculation_base')}
              placeholder="Основание или формула расчета..."
            />
          </div>

          {/* ID контингента (если связано) */}
          <div className="md:col-span-2">
            <Label htmlFor="contingent_source_id">ID связанного контингента</Label>
            <Input
              id="contingent_source_id"
              {...register('contingent_source_id')}
              placeholder="Оставьте пустым, если не связано с контингентом"
            />
          </div>
        </div>

        {/* Инфо-блок */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800">
              Информация о начислении
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>Источник:</strong> {
                  fundingSources.find(s => s.funding_code === selectedFundingSource)?.funding_name
                }
              </p>
              {watch('article_code') && (
                <p>
                  <strong>Статья:</strong> {
                    filteredArticles.find(a => a.article_code === watch('article_code'))?.article_name
                  }
                </p>
              )}
              {watch('accrual_amount') > 0 && (
                <p>
                  <strong>Сумма:</strong> {watch('accrual_amount').toLocaleString()} тенге
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </FormWrapper>
  );
}