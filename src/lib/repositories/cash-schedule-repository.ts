import { db } from '@/lib/db/database';
import { StgCashSchedule } from '@/types/stg-entities';
import { BaseRepository, generateId } from './base-repository';
import { DataStatus } from '@/types/finka-core';

export class CashScheduleRepository implements BaseRepository<StgCashSchedule> {
  
  async getAll(): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule.orderBy('payment_date').toArray();
  }

  async getById(id: string): Promise<StgCashSchedule | undefined> {
    return await db.stgCashSchedule.get(id);
  }

  async create(data: Omit<StgCashSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<StgCashSchedule> {
    const newRecord: StgCashSchedule = {
      ...data,
      id: generateId(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.stgCashSchedule.add(newRecord);
    return newRecord;
  }

  async update(id: string, data: Partial<StgCashSchedule>): Promise<StgCashSchedule> {
    await db.stgCashSchedule.update(id, { 
      ...data, 
      updated_at: new Date()
    });
    
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Cash schedule record with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.stgCashSchedule.delete(id);
  }

  async findByOrgUnit(orgUnitCode: string): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('org_unit_code')
      .equals(orgUnitCode)
      .toArray();
  }

  async findByPeriod(periodYm: string): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('period_ym')
      .equals(periodYm)
      .toArray();
  }

  async findByOrgUnitAndPeriod(orgUnitCode: string, periodYm: string): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('[org_unit_code+period_ym]')
      .equals([orgUnitCode, periodYm])
      .toArray();
  }

  async findByStatus(status: DataStatus): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('status')
      .equals(status)
      .toArray();
  }

  // Специфичные методы для графика платежей
  async findByDateRange(
    orgUnitCode: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('org_unit_code')
      .equals(orgUnitCode)
      .and(item => {
        const paymentDate = new Date(item.payment_date);
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .toArray();
  }

  async findByFundingSource(
    orgUnitCode: string, 
    fundingSource: string
  ): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('[org_unit_code+funding_source]')
      .equals([orgUnitCode, fundingSource])
      .toArray();
  }

  async findByPaymentMethod(
    orgUnitCode: string, 
    paymentMethod: string
  ): Promise<StgCashSchedule[]> {
    return await db.stgCashSchedule
      .where('[org_unit_code+payment_method]')
      .equals([orgUnitCode, paymentMethod])
      .toArray();
  }

  async getTotalAmount(orgUnitCode: string, periodYm: string): Promise<number> {
    const records = await this.findByOrgUnitAndPeriod(orgUnitCode, periodYm);
    return records.reduce((sum, record) => sum + record.amount, 0);
  }

  async getTotalByFundingSource(
    orgUnitCode: string, 
    periodYm: string, 
    fundingSource: string
  ): Promise<number> {
    const records = await this.findByOrgUnitAndPeriod(orgUnitCode, periodYm);
    return records
      .filter(record => record.funding_source === fundingSource)
      .reduce((sum, record) => sum + record.amount, 0);
  }

  async getUpcomingPayments(
    orgUnitCode: string, 
    daysAhead: number = 30
  ): Promise<StgCashSchedule[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return this.findByDateRange(orgUnitCode, today, futureDate);
  }

  async getOverduePayments(orgUnitCode: string): Promise<StgCashSchedule[]> {
    const today = new Date();
    
    return await db.stgCashSchedule
      .where('org_unit_code')
      .equals(orgUnitCode)
      .and(item => {
        const paymentDate = new Date(item.payment_date);
        return paymentDate < today && item.status !== 'approved'; // не получены
      })
      .toArray();
  }

  // Валидация бизнес-правил
  async validateRecord(record: StgCashSchedule): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Проверка дат
    const docDate = new Date(record.doc_date);
    const paymentDate = new Date(record.payment_date);
    
    if (docDate > paymentDate) {
      errors.push('Дата документа не может быть позже даты платежа');
    }

    // Проверка суммы
    if (record.amount <= 0) {
      errors.push('Сумма платежа должна быть больше 0');
    }

    // Проверка метода платежа
    if (!record.payment_method || record.payment_method.trim().length === 0) {
      errors.push('Метод платежа обязателен');
    }

    // Проверка статьи
    if (!record.article_code || record.article_code.trim().length === 0) {
      errors.push('Код статьи бюджета обязателен');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Проверка на дублирование
  async checkDuplicate(
    orgUnitCode: string,
    paymentDate: Date,
    articleCode: string,
    amount: number,
    excludeId?: string
  ): Promise<boolean> {
    const dateStr = paymentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const existing = await db.stgCashSchedule
      .where('org_unit_code')
      .equals(orgUnitCode)
      .and(item => 
        new Date(item.payment_date).toISOString().split('T')[0] === dateStr &&
        item.article_code === articleCode &&
        Math.abs(item.amount - amount) < 0.01 // сравнение с точностью до копеек
      )
      .toArray();
    
    return existing.some(record => record.id !== excludeId);
  }
}

export const cashScheduleRepo = new CashScheduleRepository();