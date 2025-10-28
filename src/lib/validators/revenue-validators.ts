import { z } from 'zod';
import { baseEntitySchema, fundingSourceSchema, positiveNumberSchema } from './common-validators';

// ======= МАРШРУТ 1: ДОХОДЫ =======

// Валидатор контингента
export const stgContingentSchema = baseEntitySchema.extend({
  program_name: z.string().min(1, 'Название программы обязательно'),
  class_level: z.number().int().min(1).max(11, 'Класс должен быть от 1 до 11'),
  student_count: z.number().int().positive('Количество учеников должно быть больше 0'),
  tariff_amount: z.number().positive().optional(),
  funding_source: fundingSourceSchema,
  calculation_note: z.string().optional()
}).refine(
  // Бизнес-правило: для ПУ тариф обязателен
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

// Валидатор начислений доходов
export const stgIncomeAccrualsSchema = baseEntitySchema.extend({
  funding_source: fundingSourceSchema,
  article_code: z.string().min(1, 'Код статьи обязателен'),
  accrual_amount: positiveNumberSchema,
  calculation_base: z.string().optional(),
  contingent_source_id: z.string().optional()
});

// Валидатор графика платежей
export const stgCashScheduleSchema = baseEntitySchema.extend({
  payment_date: z.date(),
  doc_date: z.date(),
  amount: positiveNumberSchema,
  payment_method: z.string().min(1, 'Способ оплаты обязателен'),
  funding_source: fundingSourceSchema,
  article_code: z.string().min(1, 'Код статьи обязателен'),
  description: z.string().optional(),
  income_accrual_id: z.string().optional()
}).refine(
  // doc_date не может быть позже payment_date
  (data) => data.doc_date <= data.payment_date,
  {
    message: 'Дата документа не может быть позже даты платежа',
    path: ['doc_date']
  }
);

// Функция для валидации уникальности контингента
export function validateContingentUniqueness(
  items: z.infer<typeof stgContingentSchema>[]
): string[] {
  const keys = items.map(item => 
    `${item.org_unit_code}-${item.period_ym}-${item.program_name}-${item.class_level}`
  );
  
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  
  return duplicates.length > 0 
    ? ['Обнаружены дублирующие записи по программе и классу']
    : [];
}

// Функция для расчета дохода из контингента
export function calculateRevenueFromContingent(
  contingent: z.infer<typeof stgContingentSchema>
): number {
  if (contingent.funding_source === 'PU' && contingent.tariff_amount) {
    return contingent.student_count * contingent.tariff_amount;
  }
  return 0; // Для РБ и Дотации расчет из планов
}

// Функция сверки доходов и притоков
export function validateRevenueVsCashFlow(
  revenues: z.infer<typeof stgIncomeAccrualsSchema>[],
  cashFlows: z.infer<typeof stgCashScheduleSchema>[],
  tolerance: number = 0.01 // допустимое отклонение в %
): { isValid: boolean; variance: number; errors: string[] } {
  const totalRevenue = revenues.reduce((sum, r) => sum + r.accrual_amount, 0);
  const totalCash = cashFlows.reduce((sum, c) => sum + c.amount, 0);
  
  const variance = Math.abs(totalRevenue - totalCash);
  const variancePercent = totalRevenue > 0 ? (variance / totalRevenue) : 0;
  
  const errors: string[] = [];
  
  if (variancePercent > tolerance) {
    errors.push(
      `Существенное расхождение между доходами (${totalRevenue.toLocaleString()}) ` +
      `и притоками (${totalCash.toLocaleString()}): ${variance.toLocaleString()}`
    );
  }
  
  return {
    isValid: variancePercent <= tolerance,
    variance,
    errors
  };
}