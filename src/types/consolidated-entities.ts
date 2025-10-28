// Типы для консолидированных данных в системе ФИНКА
import { BaseEntity, FundingSourceCode } from './finka-core';

// ===================== BDR (ДОХОДЫ) =====================

export interface BDRRevenue extends BaseEntity {
  revenue_type: 'tuition' | 'budget' | 'grants' | 'other';
  funding_source: FundingSourceCode;
  article_code: string;
  
  // Суммы
  planned_amount: number;
  actual_amount: number;
  variance_amount: number;
  
  // Трассировка источника
  calculation_base?: string;
  source_table: string;
  source_record_id: string;
}

// ===================== DDS (ДЕНЕЖНЫЕ ПОТОКИ) =====================

export interface DDSCashFlow extends BaseEntity {
  flow_type: 'inflow' | 'outflow';
  funding_source: FundingSourceCode;
  article_code: string;
  
  // Даты
  transaction_date: Date;
  document_date: Date;
  
  // Суммы
  planned_amount: number;
  actual_amount: number;
  variance_amount: number;
  
  // Детали
  payment_method?: string;
  description?: string;
  
  // Трассировка источника
  source_table: string;
  source_record_id: string;
}

// ===================== FOT (КОНСОЛИДАЦИЯ) =====================

export interface FOTConsolidated extends BaseEntity {
  funding_source: FundingSourceCode;
  article_code: string;
  
  // Доходы
  planned_revenue: number;
  actual_revenue: number;
  variance_revenue: number;
  
  // Расходы (для будущего расширения)
  planned_expenses: number;
  actual_expenses: number;
  variance_expenses: number;
  
  // Денежные потоки
  planned_cashflow: number;
  actual_cashflow: number;
  variance_cashflow: number;
  
  // Правила консолидации
  consolidation_rules: ConsolidationRule[];
}

// ===================== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ =====================

export interface ConsolidationRule {
  rule_type: 'mapping' | 'validation' | 'calculation';
  source_field: string;
  target_field: string;
  transformation: 'sum' | 'average' | 'max' | 'min' | 'validate_positive' | 'calculate_variance';
  conditions?: Record<string, string | number | boolean>;
}

// ===================== АНАЛИТИЧЕСКИЕ ПРЕДСТАВЛЕНИЯ =====================

export interface RevenueAnalytics {
  org_unit_code: string;
  period_ym: string;
  funding_source: FundingSourceCode;
  
  // Основные метрики
  total_planned: number;
  total_actual: number;
  total_variance: number;
  variance_percentage: number;
  
  // Разбивка по источникам
  breakdown_by_article: {
    article_code: string;
    planned: number;
    actual: number;
    variance: number;
  }[];
  
  // Тренды (для графиков)
  monthly_trend?: {
    month: string;
    planned: number;
    actual: number;
  }[];
}

export interface CashFlowAnalytics {
  org_unit_code: string;
  period_ym: string;
  
  // Притоки и оттоки
  total_inflows: number;
  total_outflows: number;
  net_cashflow: number;
  
  // По источникам финансирования
  by_funding_source: {
    funding_source: FundingSourceCode;
    inflows: number;
    outflows: number;
    net: number;
  }[];
  
  // По методам платежа
  by_payment_method: {
    method: string;
    amount: number;
    percentage: number;
  }[];
}

export interface ConsolidatedAnalytics {
  org_unit_code?: string; // undefined для общей консолидации
  period_ym: string;
  
  // Сводные показатели
  total_revenue: number;
  total_expenses: number;
  net_result: number;
  
  // Выполнение плана
  plan_execution_percentage: number;
  revenue_variance: number;
  expense_variance: number;
  
  // КПЭ
  revenue_per_student?: number;
  cost_per_student?: number;
  margin_percentage: number;
  
  // Сравнения
  previous_period_comparison?: {
    revenue_change: number;
    expense_change: number;
    margin_change: number;
  };
}