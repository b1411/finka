import { db } from '@/lib/db/database';
import { StgIncomeAccruals } from '@/types/stg-entities';
import { BaseRepository, generateId } from './base-repository';
import { DataStatus } from '@/types/finka-core';

export class IncomeAccrualsRepository implements BaseRepository<StgIncomeAccruals> {
  
  async getAll(): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals.orderBy('created_at').reverse().toArray();
  }

  async getById(id: string): Promise<StgIncomeAccruals | undefined> {
    return await db.stgIncomeAccruals.get(id);
  }

  async create(data: Omit<StgIncomeAccruals, 'id' | 'created_at' | 'updated_at'>): Promise<StgIncomeAccruals> {
    const newRecord: StgIncomeAccruals = {
      ...data,
      id: generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.stgIncomeAccruals.add(newRecord);
    return newRecord;
  }

  async update(id: string, data: Partial<StgIncomeAccruals>): Promise<StgIncomeAccruals> {
    await db.stgIncomeAccruals.update(id, { 
      ...data, 
      updated_at: new Date()
    });
    
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Income accrual record with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.stgIncomeAccruals.delete(id);
  }

  async findByOrgUnit(orgUnitCode: string): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals
      .where('org_unit_code')
      .equals(orgUnitCode)
      .toArray();
  }

  async findByOrgUnitAndPeriod(orgUnitCode: string, period: string): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals
      .where('[org_unit_code+period_ym]')
      .equals([orgUnitCode, period])
      .toArray();
  }

  async findByPeriod(periodYm: string): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals
      .where('period_ym')
      .equals(periodYm)
      .toArray();
  }

  async findByFundingSource(
    orgUnitCode: string, 
    fundingSource: string
  ): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals
      .where('[org_unit_code+funding_source]')
      .equals([orgUnitCode, fundingSource])
      .toArray();
  }

  async getTotalByPeriod(orgUnitCode: string, period: string): Promise<number> {
    const accruals = await this.findByOrgUnitAndPeriod(orgUnitCode, period);
    return accruals.reduce((sum, accrual) => sum + accrual.accrual_amount, 0);
  }

  async checkDuplicate(
    orgUnitCode: string,
    period: string,
    fundingSource: string,
    articleCode: string
  ): Promise<boolean> {
    const existing = await db.stgIncomeAccruals
      .where('[org_unit_code+period_ym+funding_source+article_code]')
      .equals([orgUnitCode, period, fundingSource, articleCode])
      .toArray();
    return existing.length > 0;
  }

  async findByStatus(status: DataStatus): Promise<StgIncomeAccruals[]> {
    return await db.stgIncomeAccruals
      .where('status')
      .equals(status)
      .toArray();
  }
}

export const incomeAccrualsRepo = new IncomeAccrualsRepository();