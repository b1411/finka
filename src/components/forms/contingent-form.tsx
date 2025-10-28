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
import { StgContingent } from '@/types/stg-entities';
import { contingentRepo } from '@/lib/repositories/contingent-repository';
import { getFundingSources } from '@/lib/seed-data';
import { FundingSource } from '@/types/finka-core';
import { stgContingentSchema } from '@/lib/validators/revenue-validators';

// Форма контингента - извлекаем типы из схемы валидации
const contingentFormSchema = z.object({
  org_unit_code: z.string().min(1),
  period_ym: z.string().min(1),
  user_id: z.string().min(1),
  program_name: z.string().min(1, 'Название программы обязательно'),
  class_level: z.number().int().min(1).max(11, 'Класс должен быть от 1 до 11'),
  student_count: z.number().int().positive('Количество учеников должно быть больше 0'),
  funding_source: z.enum(['PU', 'RB', 'DOTA']),
  tariff_amount: z.number().positive().optional(),
  calculation_note: z.string().optional()
}).refine(
  (data) => {
    if (data.funding_source === 'PU') {
      return data.tariff_amount && data.tariff_amount > 0;
    }
    return true;
  },
  {
    message: 'Для платных услуг (ПУ) тариф обязателен и должен быть больше 0',
    path: ['tariff_amount']
  }
);

type ContingentFormData = z.infer<typeof contingentFormSchema>;

interface ContingentFormProps {
  initialData?: StgContingent;
  onSave?: (data: StgContingent) => void;
  onSubmit?: (data: StgContingent) => void;
}

export function ContingentForm({ initialData, onSave, onSubmit }: ContingentFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ContingentFormData>({
    resolver: zodResolver(contingentFormSchema),
    defaultValues: {
      org_unit_code: initialData?.org_unit_code || user?.org_unit_code || '',
      period_ym: initialData?.period_ym || new Date().toISOString().substring(0, 7),
      user_id: initialData?.user_id || user?.id || '',
      program_name: initialData?.program_name || '',
      class_level: initialData?.class_level || 1,
      student_count: initialData?.student_count || 0,
      funding_source: (initialData?.funding_source as 'PU' | 'RB' | 'DOTA') || 'PU',
      tariff_amount: initialData?.tariff_amount,
      calculation_note: initialData?.calculation_note || ''
    }
  });

  const selectedFundingSource = watch('funding_source');

  // Загрузка справочников
  useEffect(() => {
    const loadFundingSources = async () => {
      try {
        const sources = await getFundingSources();
        setFundingSources(sources);
      } catch (err) {
        console.error('Ошибка загрузки источников финансирования:', err);
      }
    };

    loadFundingSources();
  }, []);

  const handleSave = async (data: ContingentFormData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result: StgContingent;
      
      if (initialData?.id) {
        // Обновление существующей записи
        result = await contingentRepo.update(initialData.id, {
          ...data,
          status: 'draft'
        });
        setSuccess('Данные успешно обновлены');
      } else {
        // Проверка на дублирование
        const isDuplicate = await contingentRepo.checkDuplicate(
          data.org_unit_code,
          data.period_ym,
          data.program_name,
          data.class_level
        );

        if (isDuplicate) {
          setError('Запись с такой программой и классом уже существует');
          return;
        }

        // Создание новой записи
        result = await contingentRepo.create({
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

  const handleFormSubmit = async (data: ContingentFormData) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Сначала сохраняем
      await handleSave(data);
      
      // Затем меняем статус на submitted
      if (initialData?.id) {
        const result = await contingentRepo.update(initialData.id, {
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

  // Валидация тарифа для ПУ
  const requiresTuition = selectedFundingSource === 'PU';

  return (
    <FormWrapper
      title="Контингент обучающихся"
      description="Ввод данных о количестве учеников и тарифах по программам"
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

          {/* Программа */}
          <div>
            <Label htmlFor="program_name">Название программы *</Label>
            <Input
              id="program_name"
              {...register('program_name')}
              placeholder="Физико-математическая программа"
            />
            {errors.program_name && (
              <p className="text-sm text-red-500 mt-1">{errors.program_name.message}</p>
            )}
          </div>

          {/* Класс */}
          <div>
            <Label htmlFor="class_level">Класс *</Label>
            <Select
              value={watch('class_level')?.toString()}
              onValueChange={(value) => setValue('class_level', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите класс" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(11)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1} класс
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class_level && (
              <p className="text-sm text-red-500 mt-1">{errors.class_level.message}</p>
            )}
          </div>

          {/* Количество учеников */}
          <div>
            <Label htmlFor="student_count">Количество учеников *</Label>
            <Input
              id="student_count"
              type="number"
              min="1"
              {...register('student_count', { valueAsNumber: true })}
              placeholder="25"
            />
            {errors.student_count && (
              <p className="text-sm text-red-500 mt-1">{errors.student_count.message}</p>
            )}
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

          {/* Тариф (только для ПУ) */}
          {requiresTuition && (
            <div className="md:col-span-2">
              <Label htmlFor="tariff_amount">Тариф за месяц (тенге) *</Label>
              <Input
                id="tariff_amount"
                type="number"
                min="0"
                step="0.01"
                {...register('tariff_amount', { valueAsNumber: true })}
                placeholder="50000"
              />
              {errors.tariff_amount && (
                <p className="text-sm text-red-500 mt-1">{errors.tariff_amount.message}</p>
              )}
            </div>
          )}

          {/* Примечание */}
          <div className="md:col-span-2">
            <Label htmlFor="calculation_note">Примечание к расчету</Label>
            <Input
              id="calculation_note"
              {...register('calculation_note')}
              placeholder="Дополнительная информация о расчете"
            />
          </div>
        </div>

        {/* Инфо-блок для РБ/Дотация */}
        {!requiresTuition && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800">
                Информация для {selectedFundingSource === 'RB' ? 'Республиканского бюджета' : 'Дотаций'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-blue-700">
                Для данного источника финансирования тариф не указывается. 
                Доходная часть будет рассчитана на основе планов и нормативов.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Расчет дохода (для ПУ) */}
        {requiresTuition && watch('tariff_amount') && watch('student_count') && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-800">Расчет дохода</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-green-700">
                <p>
                  Количество учеников: {watch('student_count')} чел.
                </p>
                <p>
                  Тариф: {watch('tariff_amount')?.toLocaleString()} тенге/мес.
                </p>
                <p className="font-semibold">
                  Итого доход: {((watch('tariff_amount') || 0) * (watch('student_count') || 0)).toLocaleString()} тенге/мес.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </FormWrapper>
  );
}