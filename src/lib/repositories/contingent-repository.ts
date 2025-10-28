import { db } from '@/lib/db/database';
import { StgContingent } from '@/types/stg-entities';
import { BaseRepository, createBaseFields, updateBaseFields, generateId } from './base-repository';
import { DataStatus } from '@/types/finka-core';

export class ContingentRepository implements BaseRepository<StgContingent> {
  
  async getAll(): Promise<StgContingent[]> {
    return await db.stgContingent.orderBy('created_at').reverse().toArray();
  }

  async getById(id: string): Promise<StgContingent | undefined> {
    return await db.stgContingent.get(id);
  }

  async create(data: Omit<StgContingent, 'id' | 'created_at' | 'updated_at'>): Promise<StgContingent> {
    const newRecord: StgContingent = {
      ...data,
      id: generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.stgContingent.add(newRecord);
    return newRecord;
  }

  async update(id: string, data: Partial<StgContingent>): Promise<StgContingent> {
    await db.stgContingent.update(id, { 
      ...data, 
      ...updateBaseFields() 
    });
    
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Contingent record with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.stgContingent.delete(id);
  }

  async findByOrgUnit(orgUnitCode: string): Promise<StgContingent[]> {
    return await db.stgContingent
      .where('org_unit_code')
      .equals(orgUnitCode)
      .toArray();
  }

  async findByPeriod(periodYm: string): Promise<StgContingent[]> {
    return await db.stgContingent
      .where('period_ym')
      .equals(periodYm)
      .toArray();
  }

  async findByOrgUnitAndPeriod(orgUnitCode: string, periodYm: string): Promise<StgContingent[]> {
    return await db.stgContingent
      .where('[org_unit_code+period_ym]')
      .equals([orgUnitCode, periodYm])
      .toArray();
  }

  async findByStatus(status: DataStatus): Promise<StgContingent[]> {
    return await db.stgContingent
      .where('status')
      .equals(status)
      .toArray();
  }

  // Специфичные методы для контингента
  async findByFundingSource(fundingSource: string): Promise<StgContingent[]> {
    return await db.stgContingent
      .where('funding_source')
      .equals(fundingSource)
      .toArray();
  }

  async calculateTotalRevenue(orgUnitCode: string, periodYm: string): Promise<number> {
    const records = await this.findByOrgUnitAndPeriod(orgUnitCode, periodYm);
    return records.reduce((sum, record) => {
      const revenue = (record.tariff_amount || 0) * record.student_count;
      return sum + revenue;
    }, 0);
  }

  async getTotalStudents(orgUnitCode: string, periodYm: string): Promise<number> {
    const records = await this.findByOrgUnitAndPeriod(orgUnitCode, periodYm);
    return records.reduce((sum, record) => sum + record.student_count, 0);
  }

  // Валидация бизнес-правил
  async validateRecord(record: StgContingent): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Проверка обязательности тарифа для ПУ
    if (record.funding_source === 'PU' && (!record.tariff_amount || record.tariff_amount <= 0)) {
      errors.push('Для платных услуг (ПУ) обязательно указание тарифа > 0');
    }

    // Проверка количества студентов
    if (record.student_count <= 0) {
      errors.push('Количество учеников должно быть больше 0');
    }

    // Проверка класса
    if (record.class_level < 1 || record.class_level > 11) {
      errors.push('Класс должен быть от 1 до 11');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Проверка на дублирование
  async checkDuplicate(
    orgUnitCode: string, 
    periodYm: string, 
    programName: string, 
    classLevel: number,
    excludeId?: string
  ): Promise<boolean> {
    const existing = await db.stgContingent
      .where('[org_unit_code+period_ym+program_name+class_level]')
      .equals([orgUnitCode, periodYm, programName, classLevel])
      .toArray();
    
    return existing.some(record => record.id !== excludeId);
  }
}

export const contingentRepo = new ContingentRepository();