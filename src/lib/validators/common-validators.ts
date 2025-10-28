import { z } from 'zod';

// Базовые валидаторы
export const periodYmSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Период должен быть в формате YYYY-MM');

export const orgUnitCodeSchema = z.string().min(2, 'Код филиала обязателен').max(10);

export const dataStatusSchema = z.enum(['draft', 'submitted', 'approved']);

export const fundingSourceSchema = z.enum(['PU', 'RB', 'DOTA']);

export const userRoleSchema = z.enum([
  'branch_economist',
  'branch_accountant', 
  'branch_hr',
  'hq_chief_economist',
  'hq_board',
  'admin'
]);

// Базовая схема для всех stg-записей
export const baseEntitySchema = z.object({
  id: z.string().optional(),
  org_unit_code: orgUnitCodeSchema,
  period_ym: periodYmSchema,
  status: dataStatusSchema.optional().default('draft'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  user_id: z.string().min(1, 'ID пользователя обязателен')
});

// Схемы справочников
export const orgUnitSchema = z.object({
  org_unit_code: z.string().min(2).max(10),
  org_unit_name: z.string().min(1, 'Название филиала обязательно'),
  city: z.string().min(1, 'Город обязателен'),
  status: z.enum(['active', 'inactive']).default('active')
});

export const fundingSourceSchemaEntity = z.object({
  funding_code: fundingSourceSchema,
  funding_name: z.string().min(1),
  category: z.enum(['budget', 'commercial', 'subsidy']),
  requires_tuition: z.boolean().default(false),
  bdr_article: z.string().min(1)
});

export const articleSchema = z.object({
  article_code: z.string().min(1, 'Код статьи обязателен'),
  article_group: z.string().min(1, 'Группа статьи обязательна'),
  article_name: z.string().min(1, 'Название статьи обязательно'),
  subarticle_name: z.string().optional(),
  mapping_hint: z.string().optional()
});

export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Некорректный email'),
  name: z.string().min(1, 'Имя пользователя обязательно'),
  role: userRoleSchema,
  org_unit_code: z.string().optional()
});

// Валидация кастомных бизнес-правил
export function validateBusinessRules<T>(data: T, rules: ((item: T) => string | null)[]): string[] {
  const errors: string[] = [];
  
  rules.forEach(rule => {
    const error = rule(data);
    if (error) {
      errors.push(error);
    }
  });
  
  return errors;
}

// Валидация уникальности ключей
export function validateUniqueConstraint<T>(
  items: T[],
  keyExtractor: (item: T) => string,
  errorMessage: string = 'Дублирование записей'
): string[] {
  const keys = items.map(keyExtractor);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  
  return duplicates.length > 0 ? [errorMessage] : [];
}

// Валидация числовых диапазонов
export const positiveNumberSchema = z.number().positive('Значение должно быть положительным');
export const nonNegativeNumberSchema = z.number().min(0, 'Значение не может быть отрицательным');
export const percentSchema = z.number().min(0).max(100, 'Процент должен быть от 0 до 100');

// Валидация дат
export const futureDateSchema = z.date().refine(
  (date) => date > new Date(),
  'Дата должна быть в будущем'
);

export const pastOrCurrentDateSchema = z.date().refine(
  (date) => date <= new Date(),
  'Дата не может быть в будущем'
);