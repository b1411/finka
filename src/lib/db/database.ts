import Dexie, { Table } from 'dexie';
import { 
  OrgUnit, 
  FundingSource, 
  Article, 
  User 
} from '@/types/finka-core';
import {
  StgContingent,
  StgIncomeAccruals,
  StgCashSchedule,
  StgStaffing,
  StgTariffs,
  StgTimetable,
  StgFotMain,
  StgPremiaComp,
  StgSocialTaxes,
  StgTrips,
  StgCalcPuRb,
  StgSchoolArea
} from '@/types/stg-entities';
import {
  StgPlans23,
  StgPlanFact24,
  BdrItog,
  DdsItog,
  FotItog,
  ConsolidatedBudget,
  ConsolidatedCashFlow,
  ConsolidatedPayroll,
  BranchComparison,
  KpiMetrics,
  StaffingRecord
} from '@/types/core-entities';

export class FinkaDatabase extends Dexie {
  // Справочники
  orgUnits!: Table<OrgUnit>;
  fundingSources!: Table<FundingSource>;
  articles!: Table<Article>;
  users!: Table<User>;

  // Маршрут 1: Доходы
  stgContingent!: Table<StgContingent>;
  stgIncomeAccruals!: Table<StgIncomeAccruals>;
  stgCashSchedule!: Table<StgCashSchedule>;

  // Маршрут 2: ФОТ
  stgStaffing!: Table<StgStaffing>;
  stgTariffs!: Table<StgTariffs>;
  stgTimetable!: Table<StgTimetable>;
  stgFotMain!: Table<StgFotMain>;
  stgPremiaComp!: Table<StgPremiaComp>;
  stgSocialTaxes!: Table<StgSocialTaxes>;

  // Маршрут 3: OPEX
  stgTrips!: Table<StgTrips>;
  stgCalcPuRb!: Table<StgCalcPuRb>;
  stgSchoolArea!: Table<StgSchoolArea>;

  // Планы
  stgPlans23!: Table<StgPlans23>;
  stgPlanFact24!: Table<StgPlanFact24>;

  // Ядро
  bdrItog!: Table<BdrItog>;
  ddsItog!: Table<DdsItog>;
  fotItog!: Table<FotItog>;

  // Витрины
  consolidatedBudget!: Table<ConsolidatedBudget>;
  consolidatedCashFlow!: Table<ConsolidatedCashFlow>;
  consolidatedPayroll!: Table<ConsolidatedPayroll>;
  branchComparison!: Table<BranchComparison>;
  kpiMetrics!: Table<KpiMetrics>;

  // Управление персоналом (новая таблица)
  staffing!: Table<StaffingRecord>;

  constructor() {
    super('FinkaDatabase');
    
    this.version(1).stores({
      // Справочники
      orgUnits: 'org_unit_code, org_unit_name, city, status',
      fundingSources: 'funding_code, funding_name, category',
      articles: 'article_code, article_group, article_name',
      users: 'id, email, role, org_unit_code',

      // STG таблицы - составные ключи для уникальности
      stgContingent: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+program_name+class_level], status, user_id',
      stgIncomeAccruals: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+funding_source+article_code], status, user_id',
      stgCashSchedule: 'id, [org_unit_code+period_ym], payment_date, funding_source, status, user_id',
      
      stgStaffing: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+employee_name], position_name, status, user_id',
      stgTariffs: 'id, [org_unit_code+period_ym], position_name, effective_from, status, user_id',
      stgTimetable: 'id, [org_unit_code+period_ym], employee_name, subject, status, user_id',
      stgFotMain: 'id, [org_unit_code+period_ym], employee_name, funding_source, status, user_id',
      stgPremiaComp: 'id, [org_unit_code+period_ym], employee_name, bonus_type, status, user_id',
      stgSocialTaxes: 'id, [org_unit_code+period_ym], tax_type, employee_name, status, user_id',
      
      stgTrips: 'id, [org_unit_code+period_ym], employee_name, start_date, status, user_id',
      stgCalcPuRb: 'id, [org_unit_code+period_ym], expense_type, article_code, status, user_id',
      stgSchoolArea: 'id, [org_unit_code+period_ym], area_type, status, user_id',
      
      stgPlans23: 'id, [org_unit_code+period_ym], [org_unit_code+funding_source+article_code], status, user_id',
      stgPlanFact24: 'id, [org_unit_code+period_ym], [org_unit_code+funding_source+article_code], status, user_id',

      // Ядро - итоговые таблицы
      bdrItog: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+funding_source+article_code], article_group, status',
      ddsItog: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+funding_source+article_code], cash_flow_type, status',
      fotItog: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+employee_name], funding_source, status',

      // Витрины
      consolidatedBudget: 'period_ym, org_unit_code',
      consolidatedCashFlow: 'period_ym, org_unit_code',
      consolidatedPayroll: 'period_ym, org_unit_code',
      branchComparison: 'period_ym, org_unit_code, rank_by_execution, rank_by_margin',
      kpiMetrics: 'period_ym',

      // Управление персоналом
      staffing: 'id, [org_unit_code+period_ym], [org_unit_code+period_ym+employee_id], employee_id, full_name, employment_status, is_active'
    });
  }
}

export const db = new FinkaDatabase();