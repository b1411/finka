// Базовые типы для системы ФИНКА
export type UserRole = 
  | 'branch_economist' 
  | 'branch_accountant' 
  | 'branch_hr'
  | 'hq_chief_economist'
  | 'hq_board'
  | 'admin';

export type DataStatus = 'draft' | 'submitted' | 'approved';

export type FundingSourceCode = 'PU' | 'RB' | 'DOTA';

export interface BaseEntity {
  id: string;
  org_unit_code: string;
  period_ym: string; // YYYY-MM
  status: DataStatus;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

// Справочники
export interface OrgUnit {
  org_unit_code: string;
  org_unit_name: string;
  city: string;
  status: 'active' | 'inactive';
}

export interface FundingSource {
  funding_code: FundingSourceCode;
  funding_name: string;
  category: 'budget' | 'commercial' | 'subsidy';
  requires_tuition: boolean;
  bdr_article: string;
}

export interface Article {
  article_code: string;
  article_group: string;
  article_name: string;
  subarticle_name?: string;
  mapping_hint?: string;
}

export interface BudgetArticle {
  article_code: string;
  article_name: string;
  funding_source: FundingSourceCode;
  is_revenue: boolean;
  is_active: boolean;
}

// Пользователь
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  org_unit_code?: string; // для филиалов
}

// Контекст приложения
export interface AppContext {
  user: User | null;
  selectedPeriod: string;
  selectedOrgUnit: string | null;
}