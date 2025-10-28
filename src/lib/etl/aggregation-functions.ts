import { db } from '@/lib/db/database';
import { 
  BDRRevenue, 
  DDSCashFlow, 
  FOTConsolidated,
  ConsolidationRule 
} from '@/types/consolidated-entities';

/**
 * ETL функции для агрегации данных из STG слоя в основные таблицы
 * Этот модуль отвечает за трансформацию данных согласно схеме ФИНКА
 */

// ================== ДОХОДЫ (BDR) ==================

export async function aggregateRevenuesToBDR(
  orgUnitCode: string, 
  periodYm: string
): Promise<BDRRevenue[]> {
  console.log(`Агрегация доходов для ${orgUnitCode} за ${periodYm}`);
  
  // Получаем данные контингента
  const contingent = await db.stgContingent
    .where('[org_unit_code+period_ym]')
    .equals([orgUnitCode, periodYm])
    .and(item => item.status === 'approved')
    .toArray();

  // Получаем начисления
  const accruals = await db.stgIncomeAccruals
    .where('[org_unit_code+period_ym]')
    .equals([orgUnitCode, periodYm])
    .and(item => item.status === 'approved')
    .toArray();

  const revenues: BDRRevenue[] = [];

  // Агрегация доходов от контингента (ПУ)
  for (const item of contingent) {
    if (item.funding_source === 'PU' && item.tariff_amount) {
      const monthlyRevenue = item.student_count * item.tariff_amount;
      
      revenues.push({
        id: `cont_${item.id}`,
        org_unit_code: orgUnitCode,
        period_ym: periodYm,
        user_id: item.user_id,
        status: 'approved',
        revenue_type: 'tuition',
        funding_source: 'PU',
        article_code: '1.1.1', // Статья для платных услуг
        planned_amount: monthlyRevenue,
        actual_amount: monthlyRevenue,
        variance_amount: 0,
        calculation_base: `Контингент: ${item.student_count} уч. × ${item.tariff_amount} тг`,
        source_table: 'stg_contingent',
        source_record_id: item.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // Агрегация прямых начислений
  for (const accrual of accruals) {
    revenues.push({
      id: `accr_${accrual.id}`,
      org_unit_code: orgUnitCode,
      period_ym: periodYm,
      user_id: accrual.user_id,
      status: 'approved',
      revenue_type: getRevenueType(accrual.funding_source),
      funding_source: accrual.funding_source,
      article_code: accrual.article_code,
      planned_amount: accrual.accrual_amount,
      actual_amount: accrual.accrual_amount,
      variance_amount: 0,
      calculation_base: accrual.calculation_base || 'Прямое начисление',
      source_table: 'stg_income_accruals',
      source_record_id: accrual.id,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  return revenues;
}

// ================== ДЕНЕЖНЫЕ ПОТОКИ (DDS) ==================

export async function aggregateCashFlowToDDS(
  orgUnitCode: string, 
  periodYm: string
): Promise<DDSCashFlow[]> {
  console.log(`Агрегация денежных потоков для ${orgUnitCode} за ${periodYm}`);
  
  // Получаем график поступлений
  const cashSchedule = await db.stgCashSchedule
    .where('[org_unit_code+period_ym]')
    .equals([orgUnitCode, periodYm])
    .and(item => item.status === 'approved')
    .toArray();

  const cashFlows: DDSCashFlow[] = [];

  for (const payment of cashSchedule) {
    cashFlows.push({
      id: `cash_${payment.id}`,
      org_unit_code: orgUnitCode,
      period_ym: periodYm,
      user_id: payment.user_id,
      status: 'approved',
      flow_type: 'inflow', // Все поступления - приток
      funding_source: payment.funding_source,
      article_code: payment.article_code,
      transaction_date: payment.payment_date,
      document_date: payment.doc_date,
      planned_amount: payment.amount,
      actual_amount: payment.amount, // В базовой версии план = факт
      variance_amount: 0,
      payment_method: payment.payment_method,
      description: payment.description || 'Поступление средств',
      source_table: 'stg_cash_schedule',
      source_record_id: payment.id,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  return cashFlows;
}

// ================== КОНСОЛИДАЦИЯ (FOT) ==================

export async function consolidateDataToFOT(
  orgUnitCode?: string,
  periodYm?: string
): Promise<FOTConsolidated[]> {
  console.log(`Консолидация данных для ${orgUnitCode || 'всех филиалов'} за ${periodYm || 'все периоды'}`);
  
  // Получаем агрегированные доходы
  let bdrData: BDRRevenue[] = [];
  if (orgUnitCode && periodYm) {
    bdrData = await aggregateRevenuesToBDR(orgUnitCode, periodYm);
  } else {
    // Для консолидации по всем филиалам нужно реализовать дополнительную логику
    console.warn('Консолидация по всем филиалам требует дополнительной реализации');
  }

  // Получаем денежные потоки
  let ddsData: DDSCashFlow[] = [];
  if (orgUnitCode && periodYm) {
    ddsData = await aggregateCashFlowToDDS(orgUnitCode, periodYm);
  }

  // Группируем по источникам финансирования и статьям
  const consolidatedMap = new Map<string, FOTConsolidated>();

  // Обрабатываем доходы
  for (const revenue of bdrData) {
    const key = `${revenue.org_unit_code}_${revenue.funding_source}_${revenue.article_code}`;
    
    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, {
        id: `fot_${key}_${periodYm}`,
        org_unit_code: revenue.org_unit_code,
        period_ym: revenue.period_ym,
        user_id: revenue.user_id,
        status: 'approved',
        funding_source: revenue.funding_source,
        article_code: revenue.article_code,
        planned_revenue: 0,
        actual_revenue: 0,
        planned_expenses: 0,
        actual_expenses: 0,
        planned_cashflow: 0,
        actual_cashflow: 0,
        variance_revenue: 0,
        variance_expenses: 0,
        variance_cashflow: 0,
        consolidation_rules: getConsolidationRules(revenue.funding_source),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    const consolidated = consolidatedMap.get(key)!;
    consolidated.planned_revenue += revenue.planned_amount;
    consolidated.actual_revenue += revenue.actual_amount;
    consolidated.variance_revenue = consolidated.actual_revenue - consolidated.planned_revenue;
  }

  // Обрабатываем денежные потоки
  for (const cashFlow of ddsData) {
    const key = `${cashFlow.org_unit_code}_${cashFlow.funding_source}_${cashFlow.article_code}`;
    
    const consolidated = consolidatedMap.get(key);
    if (consolidated) {
      if (cashFlow.flow_type === 'inflow') {
        consolidated.planned_cashflow += cashFlow.planned_amount;
        consolidated.actual_cashflow += cashFlow.actual_amount;
      } else {
        consolidated.planned_cashflow -= cashFlow.planned_amount;
        consolidated.actual_cashflow -= cashFlow.actual_amount;
      }
      consolidated.variance_cashflow = consolidated.actual_cashflow - consolidated.planned_cashflow;
    }
  }

  return Array.from(consolidatedMap.values());
}

// ================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==================

function getRevenueType(fundingSource: string): string {
  switch (fundingSource) {
    case 'PU': return 'tuition';
    case 'RB': return 'budget';
    case 'DOTA': return 'grants';
    default: return 'other';
  }
}

function getConsolidationRules(fundingSource: string): ConsolidationRule[] {
  const baseRules: ConsolidationRule[] = [
    {
      rule_type: 'mapping',
      source_field: 'planned_amount',
      target_field: 'planned_revenue',
      transformation: 'sum'
    },
    {
      rule_type: 'mapping',
      source_field: 'actual_amount', 
      target_field: 'actual_revenue',
      transformation: 'sum'
    }
  ];

  // Специфичные правила по источникам
  if (fundingSource === 'PU') {
    baseRules.push({
      rule_type: 'validation',
      source_field: 'tariff_amount',
      target_field: 'planned_revenue',
      transformation: 'validate_positive'
    });
  }

  return baseRules;
}

// ================== ГЛАВНАЯ ETL ФУНКЦИЯ ==================

export async function runFullETLProcess(
  orgUnitCode: string,
  periodYm: string
): Promise<{
  success: boolean;
  processedRecords: {
    revenues: number;
    cashFlows: number;
    consolidated: number;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const processedRecords = {
    revenues: 0,
    cashFlows: 0,
    consolidated: 0
  };

  try {
    console.log(`Запуск полного ETL процесса для ${orgUnitCode} за ${periodYm}`);

    // 1. Агрегация доходов в BDR
    const revenues = await aggregateRevenuesToBDR(orgUnitCode, periodYm);
    processedRecords.revenues = revenues.length;

    // 2. Агрегация денежных потоков в DDS  
    const cashFlows = await aggregateCashFlowToDDS(orgUnitCode, periodYm);
    processedRecords.cashFlows = cashFlows.length;

    // 3. Консолидация в FOT
    const consolidated = await consolidateDataToFOT(orgUnitCode, periodYm);
    processedRecords.consolidated = consolidated.length;

    // 4. Сохранение результатов (в реальном приложении здесь была бы запись в БД)
    console.log('ETL процесс завершен успешно:', processedRecords);

    return {
      success: true,
      processedRecords,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    errors.push(errorMessage);
    console.error('Ошибка в ETL процессе:', error);

    return {
      success: false,
      processedRecords,
      errors
    };
  }
}

// ================== СТАТИСТИЧЕСКИЕ ФУНКЦИИ ==================

export async function getETLStatistics(orgUnitCode?: string) {
  const stats = {
    stgRecords: {
      contingent: 0,
      accruals: 0,
      cashSchedule: 0
    },
    processedPeriods: [] as string[],
    lastProcessedDate: null as Date | null,
    validationErrors: [] as string[]
  };

  try {
    // Подсчет записей в STG таблицах
    if (orgUnitCode) {
      stats.stgRecords.contingent = await db.stgContingent
        .where('org_unit_code').equals(orgUnitCode).count();
      stats.stgRecords.accruals = await db.stgIncomeAccruals
        .where('org_unit_code').equals(orgUnitCode).count();
      stats.stgRecords.cashSchedule = await db.stgCashSchedule
        .where('org_unit_code').equals(orgUnitCode).count();
    } else {
      stats.stgRecords.contingent = await db.stgContingent.count();
      stats.stgRecords.accruals = await db.stgIncomeAccruals.count();
      stats.stgRecords.cashSchedule = await db.stgCashSchedule.count();
    }

    // Получение уникальных периодов
    const periods = new Set<string>();
    
    const contingentPeriods = await db.stgContingent
      .orderBy('period_ym')
      .uniqueKeys();
    contingentPeriods.forEach(p => periods.add(p as string));

    stats.processedPeriods = Array.from(periods).sort();
    
    // Последняя дата обработки
    const lastRecord = await db.stgContingent
      .orderBy('updated_at')
      .reverse()
      .first();
    
    stats.lastProcessedDate = lastRecord?.updated_at || null;

  } catch (error) {
    console.error('Ошибка получения ETL статистики:', error);
    stats.validationErrors.push(
      error instanceof Error ? error.message : 'Неизвестная ошибка'
    );
  }

  return stats;
}