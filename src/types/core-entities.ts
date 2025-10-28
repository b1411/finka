import { BaseEntity } from './finka-core';

// ======= ПЛАНЫ И ПЛАН-ФАКТ =======

// Планы 2023
export interface StgPlans23 extends BaseEntity {
  funding_source: string;
  article_code: string;
  plan_amount_annual: number;
  plan_amount_q1: number;
  plan_amount_q2: number;
  plan_amount_q3: number;
  plan_amount_q4: number;
  plan_amount_monthly: number; // для текущего period_ym
  currency: 'KZT' | 'USD';
  notes?: string;
}

// План-факт 2024
export interface StgPlanFact24 extends BaseEntity {
  funding_source: string;
  article_code: string;
  plan_amount: number;
  fact_amount: number;
  variance_amount: number;
  variance_percent: number;
  execution_percent: number;
  currency: 'KZT' | 'USD';
  comments?: string;
}

// ======= ИТОГОВЫЕ ТАБЛИЦЫ ЯДРА =======

// БДР итоговый
export interface BdrItog {
  id: string;
  org_unit_code: string;
  period_ym: string;
  funding_source: string;
  article_code: string;
  article_group: 'revenue' | 'expenses';
  article_name: string;
  plan_amount: number;
  fact_amount: number;
  variance_amount: number;
  variance_percent: number;
  execution_percent: number;
  currency: 'KZT';
  status: 'draft' | 'approved';
  last_updated: Date;
  source_tables?: string; // какие stg-таблицы участвовали
}

// ДДС итоговый
export interface DdsItog {
  id: string;
  org_unit_code: string;
  period_ym: string;
  cash_flow_type: 'inflow' | 'outflow';
  funding_source: string;
  article_code: string;
  article_name: string;
  plan_cash: number;
  fact_cash: number;
  variance_cash: number;
  variance_percent: number;
  execution_percent: number;
  payment_date?: Date;
  doc_date?: Date;
  currency: 'KZT';
  status: 'draft' | 'approved';
  last_updated: Date;
  source_tables?: string;
}

// ФОТ итоговый
export interface FotItog {
  id: string;
  org_unit_code: string;
  period_ym: string;
  employee_name: string;
  position_name: string;
  funding_source: string;
  base_salary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  gross_total: number;
  social_tax: number;
  pension_contributions: number;
  medical_insurance: number;
  total_taxes: number;
  net_salary: number;
  employer_costs: number;
  hours_worked: number;
  fte: number; // full-time equivalent
  currency: 'KZT';
  status: 'draft' | 'approved';
  last_updated: Date;
}

// ======= ВИТРИНЫ ДЛЯ ДАШБОРДОВ =======

// Консолидированный бюджет (P&L)
export interface ConsolidatedBudget {
  period_ym: string;
  org_unit_code?: string; // null для общего свода
  total_revenue: number;
  total_expenses: number;
  ebitda: number;
  ebitda_margin_percent: number;
  revenue_plan: number;
  revenue_fact: number;
  revenue_execution_percent: number;
  expenses_plan: number;
  expenses_fact: number;
  expenses_execution_percent: number;
  by_funding_source: {
    funding_source: string;
    revenue: number;
    expenses: number;
    margin: number;
  }[];
}

// CashFlow свод
export interface ConsolidatedCashFlow {
  period_ym: string;
  org_unit_code?: string;
  opening_balance: number;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  inflows_plan: number;
  inflows_fact: number;
  inflows_execution_percent: number;
  outflows_plan: number;
  outflows_fact: number;
  outflows_execution_percent: number;
}

// Payroll свод
export interface ConsolidatedPayroll {
  period_ym: string;
  org_unit_code?: string;
  total_employees: number;
  total_fte: number;
  total_gross: number;
  total_taxes: number;
  total_net: number;
  total_employer_costs: number;
  payroll_share_in_expenses_percent: number;
  avg_salary_gross: number;
  avg_salary_net: number;
  by_funding_source: {
    funding_source: string;
    employees_count: number;
    fte: number;
    gross_total: number;
    employer_costs: number;
  }[];
}

// Сравнение филиалов
export interface BranchComparison {
  period_ym: string;
  org_unit_code: string;
  org_unit_name: string;
  revenue_plan: number;
  revenue_fact: number;
  revenue_execution_percent: number;
  expenses_plan: number;
  expenses_fact: number;
  expenses_execution_percent: number;
  ebitda: number;
  ebitda_margin_percent: number;
  payroll_share_percent: number;
  students_count: number;
  revenue_per_student: number;
  rank_by_execution: number;
  rank_by_margin: number;
}

// KPI метрики
export interface KpiMetrics {
  period_ym: string;
  total_students: number;
  total_revenue: number;
  total_expenses: number;
  total_ebitda: number;
  avg_revenue_per_student: number;
  payroll_efficiency: number;
  cash_collection_rate: number;
  budget_discipline_score: number;
  growth_rate_mom: number; // month-over-month
  growth_rate_yoy: number; // year-over-year
}

// ======= ШТАТНОЕ РАСПИСАНИЕ И PAYROLL =======

export interface StaffingRecord {
  id: string;
  org_unit_code: string;
  period_ym: string;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  base_salary: number;
  bonus?: number;
  allowances?: number;
  deductions?: number;
  social_tax?: number;
  pension_contribution?: number;
  hire_date: Date;
  termination_date?: Date;
  is_active: boolean;
  employment_status: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE' | 'SUSPENDED';
  created_at?: Date;
  updated_at?: Date;
}