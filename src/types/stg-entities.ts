import { BaseEntity } from './finka-core';

// ======= МАРШРУТ 1: ДОХОДЫ =======

// Контингент
export interface StgContingent extends BaseEntity {
  program_name: string;
  class_level: number;
  student_count: number;
  tariff_amount?: number; // обязательно только для ПУ
  funding_source: string;
  calculation_note?: string;
}

// Начисления доходов
export interface StgIncomeAccruals extends BaseEntity {
  funding_source: string;
  article_code: string;
  accrual_amount: number;
  calculation_base?: string;
  contingent_source_id?: string; // связь с контингентом
}

// График платежей
export interface StgCashSchedule extends BaseEntity {
  payment_date: Date;
  doc_date: Date;
  amount: number;
  payment_method: string;
  funding_source: string;
  article_code: string;
  description?: string;
  income_accrual_id?: string; // связь с начислением
}

// ======= МАРШРУТ 2: ФОТ =======

// Штатное расписание
export interface StgStaffing extends BaseEntity {
  position_name: string;
  employee_name?: string;
  rate: number; // ставка (1.0 = полная)
  funding_source: string;
  hire_date: Date;
  fire_date?: Date;
  department?: string;
}

// Тарифы оплаты
export interface StgTariffs extends BaseEntity {
  position_name: string;
  tariff_type: 'salary' | 'hourly';
  base_amount: number;
  currency: 'KZT' | 'USD';
  effective_from: Date;
  effective_to?: Date;
}

// Тарификация (расписание уроков)
export interface StgTimetable extends BaseEntity {
  employee_name: string;
  position_name: string;
  subject: string;
  class_name: string;
  hours_per_week: number;
  weeks_count: number;
  rate_per_hour?: number;
  funding_source: string;
}

// Основной ФОТ
export interface StgFotMain extends BaseEntity {
  employee_name: string;
  position_name: string;
  base_salary: number;
  hours_worked: number;
  rate_per_hour: number;
  overtime_hours?: number;
  overtime_rate?: number;
  funding_source: string;
}

// Премии и компенсации
export interface StgPremiaComp extends BaseEntity {
  employee_name: string;
  bonus_type: 'premium' | 'compensation' | 'allowance';
  amount: number;
  reason: string;
  funding_source: string;
}

// Социальные налоги
export interface StgSocialTaxes extends BaseEntity {
  tax_type: 'social_tax' | 'pension_contribution' | 'medical_insurance';
  employee_name?: string; // null для общих ставок
  rate_percent: number;
  base_amount: number;
  calculated_amount: number;
  plan_amount?: number;
  fact_amount?: number;
}

// ======= МАРШРУТ 3: КОМАНДИРОВКИ И OPEX =======

// Командировки
export interface StgTrips extends BaseEntity {
  employee_name: string;
  destination: string;
  purpose: string;
  start_date: Date;
  end_date: Date;
  transport_cost: number;
  accommodation_cost: number;
  per_diem: number;
  other_expenses: number;
  total_cost: number;
  funding_source: string;
  article_code: string;
  plan_amount?: number;
  fact_amount?: number;
}

// Расчеты ПУ/РБ
export interface StgCalcPuRb extends BaseEntity {
  expense_type: string;
  article_code: string;
  calculation_method: string;
  base_value: number;
  rate: number;
  calculated_amount: number;
  plan_amount?: number;
  fact_amount?: number;
  funding_source: string;
  description?: string;
}

// Площадь школы
export interface StgSchoolArea extends BaseEntity {
  area_type: 'total' | 'educational' | 'administrative' | 'auxiliary';
  area_sqm: number;
  normative_cost_per_sqm?: number;
  heating_cost?: number;
  electricity_cost?: number;
  security_cost?: number;
  cleaning_cost?: number;
  maintenance_cost?: number;
}