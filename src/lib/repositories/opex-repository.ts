import { db } from '../db/database';
import { StgTrips, StgCalcPuRb, StgSchoolArea } from '@/types/stg-entities';
import { z } from 'zod';

// Валидация командировок
export const tripsSchema = z.object({
  id: z.string().optional(),
  org_unit_code: z.string().min(1, 'Код подразделения обязателен'),
  period_ym: z.string().regex(/^\d{6}$/, 'Формат: YYYYMM'),
  employee_name: z.string().min(1, 'Имя сотрудника обязательно'),
  destination: z.string().min(1, 'Место назначения обязательно'),
  purpose: z.string().min(1, 'Цель командировки обязательна'),
  start_date: z.date(),
  end_date: z.date(),
  transport_cost: z.number().min(0, 'Стоимость транспорта не может быть отрицательной'),
  accommodation_cost: z.number().min(0, 'Стоимость проживания не может быть отрицательной'),
  per_diem: z.number().min(0, 'Суточные не могут быть отрицательными'),
  other_expenses: z.number().min(0, 'Прочие расходы не могут быть отрицательными').optional().default(0),
  total_cost: z.number().min(0, 'Общая сумма не может быть отрицательной'),
  funding_source: z.string().min(1, 'Источник финансирования обязателен'),
  article_code: z.string().min(1, 'Код статьи обязателен'),
  plan_amount: z.number().min(0).optional(),
  fact_amount: z.number().min(0).optional(),
  status: z.enum(['draft', 'submitted', 'approved']).default('draft'),
});

// Валидация расчетов ПУ/РБ
export const calcPuRbSchema = z.object({
  id: z.string().optional(),
  org_unit_code: z.string().min(1, 'Код подразделения обязателен'),
  period_ym: z.string().regex(/^\d{6}$/, 'Формат: YYYYMM'),
  expense_type: z.string().min(1, 'Тип расхода обязателен'),
  article_code: z.string().min(1, 'Код статьи обязателен'),
  calculation_method: z.string().min(1, 'Метод расчета обязателен'),
  base_value: z.number().min(0, 'Базовое значение не может быть отрицательным'),
  rate: z.number().min(0, 'Ставка не может быть отрицательной'),
  calculated_amount: z.number().min(0, 'Расчетная сумма не может быть отрицательной'),
  plan_amount: z.number().min(0).optional(),
  fact_amount: z.number().min(0).optional(),
  funding_source: z.string().min(1, 'Источник финансирования обязателен'),
  description: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'approved']).default('draft'),
});

// Валидация площадей
export const schoolAreaSchema = z.object({
  id: z.string().optional(),
  org_unit_code: z.string().min(1, 'Код подразделения обязателен'),
  period_ym: z.string().regex(/^\d{6}$/, 'Формат: YYYYMM'),
  area_type: z.enum(['total', 'educational', 'administrative', 'auxiliary']),
  area_sqm: z.number().min(0, 'Площадь не может быть отрицательной'),
  normative_cost_per_sqm: z.number().min(0).optional(),
  heating_cost: z.number().min(0).optional(),
  electricity_cost: z.number().min(0).optional(),
  security_cost: z.number().min(0).optional(),
  cleaning_cost: z.number().min(0).optional(),
  maintenance_cost: z.number().min(0).optional(),
  status: z.enum(['draft', 'submitted', 'approved']).default('draft'),
});

export type TripsFormData = z.infer<typeof tripsSchema>;
export type CalcPuRbFormData = z.infer<typeof calcPuRbSchema>;
export type SchoolAreaFormData = z.infer<typeof schoolAreaSchema>;

export class OpexRepository {
  // ===== КОМАНДИРОВКИ =====
  
  async getTrips(orgUnitCode: string, periodYm: string): Promise<StgTrips[]> {
    try {
      return await db.stgTrips
        .where(['org_unit_code', 'period_ym'])
        .equals([orgUnitCode, periodYm])
        .toArray();
    } catch (error) {
      console.error('Ошибка получения командировок:', error);
      return [];
    }
  }

  async createTrip(data: TripsFormData): Promise<string> {
    try {
      const validatedData = tripsSchema.parse(data);
      const id = crypto.randomUUID();
      
      const tripRecord: StgTrips = {
        ...validatedData,
        id,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'current_user', // TODO: получить из контекста
      };

      await db.stgTrips.add(tripRecord);
      console.log('Создана командировка:', tripRecord);
      return id;
    } catch (error) {
      console.error('Ошибка создания командировки:', error);
      throw error;
    }
  }

  async updateTrip(id: string, data: Partial<TripsFormData>): Promise<void> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date(),
      };

      await db.stgTrips.update(id, updateData);
      console.log('Обновлена командировка:', id);
    } catch (error) {
      console.error('Ошибка обновления командировки:', error);
      throw error;
    }
  }

  async deleteTrip(id: string): Promise<void> {
    try {
      await db.stgTrips.delete(id);
      console.log('Удалена командировка:', id);
    } catch (error) {
      console.error('Ошибка удаления командировки:', error);
      throw error;
    }
  }

  // ===== РАСЧЕТЫ ПУ/РБ =====

  async getCalcPuRb(orgUnitCode: string, periodYm: string): Promise<StgCalcPuRb[]> {
    try {
      return await db.stgCalcPuRb
        .where(['org_unit_code', 'period_ym'])
        .equals([orgUnitCode, periodYm])
        .toArray();
    } catch (error) {
      console.error('Ошибка получения расчетов ПУ/РБ:', error);
      return [];
    }
  }

  async createCalcPuRb(data: CalcPuRbFormData): Promise<string> {
    try {
      const validatedData = calcPuRbSchema.parse(data);
      const id = crypto.randomUUID();
      
      const calcRecord: StgCalcPuRb = {
        ...validatedData,
        id,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'current_user',
      };

      await db.stgCalcPuRb.add(calcRecord);
      console.log('Создан расчет ПУ/РБ:', calcRecord);
      return id;
    } catch (error) {
      console.error('Ошибка создания расчета ПУ/РБ:', error);
      throw error;
    }
  }

  // Автоматический расчет суммы
  calculateAmount(method: string, baseValue: number, rate: number, adjustment = 0): number {
    let calculated = 0;
    
    switch (method) {
      case 'per_sqm':
      case 'per_student':
        calculated = baseValue * rate;
        break;
      case 'fixed_amount':
        calculated = rate;
        break;
      case 'percentage':
        calculated = baseValue * (rate / 100);
        break;
      default:
        calculated = 0;
    }
    
    return Math.max(0, calculated + adjustment);
  }

  // ===== ПЛОЩАДИ =====

  async getSchoolAreas(orgUnitCode: string, periodYm: string): Promise<StgSchoolArea[]> {
    try {
      return await db.stgSchoolArea
        .where(['org_unit_code', 'period_ym'])
        .equals([orgUnitCode, periodYm])
        .toArray();
    } catch (error) {
      console.error('Ошибка получения площадей:', error);
      return [];
    }
  }

  async createSchoolArea(data: SchoolAreaFormData): Promise<string> {
    try {
      const validatedData = schoolAreaSchema.parse(data);
      const id = crypto.randomUUID();
      
      const areaRecord: StgSchoolArea = {
        ...validatedData,
        id,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: 'current_user',
      };

      await db.stgSchoolArea.add(areaRecord);
      console.log('Создана запись о площади:', areaRecord);
      return id;
    } catch (error) {
      console.error('Ошибка создания записи о площади:', error);
      throw error;
    }
  }

  // ===== АНАЛИТИКА OPEX =====

  async getOpexSummary(orgUnitCode: string, periodYm: string) {
    try {
      const [trips, calcPuRb, areas] = await Promise.all([
        this.getTrips(orgUnitCode, periodYm),
        this.getCalcPuRb(orgUnitCode, periodYm),
        this.getSchoolAreas(orgUnitCode, periodYm)
      ]);

      // Суммы по командировкам
      const tripsTotal = trips.reduce((sum, trip) => sum + trip.total_cost, 0);
      
      // Суммы по расчетам ПУ/РБ
      const calcTotal = calcPuRb.reduce((sum, calc) => sum + calc.calculated_amount, 0);
      
      // Суммы по площадям (все типы расходов)
      const rentTotal = areas.reduce((sum, area) => {
        const costs = (area.heating_cost || 0) + (area.electricity_cost || 0) + 
                     (area.security_cost || 0) + (area.cleaning_cost || 0) + 
                     (area.maintenance_cost || 0);
        return sum + costs;
      }, 0);
      
      // Общая площадь
      const totalArea = areas.reduce((sum, area) => sum + area.area_sqm, 0);
      
      return {
        trips: {
          count: trips.length,
          total: tripsTotal,
          avgPerTrip: trips.length > 0 ? tripsTotal / trips.length : 0,
        },
        calculations: {
          count: calcPuRb.length,
          total: calcTotal,
          byType: calcPuRb.reduce((acc, calc) => {
            acc[calc.expense_type] = (acc[calc.expense_type] || 0) + calc.calculated_amount;
            return acc;
          }, {} as Record<string, number>),
        },
        areas: {
          count: areas.length,
          totalArea: totalArea,
          rentTotal: rentTotal,
          avgRatePerSqm: totalArea > 0 ? rentTotal / totalArea : 0,
          byType: areas.reduce((acc, area) => {
            acc[area.area_type] = (acc[area.area_type] || 0) + area.area_sqm;
            return acc;
          }, {} as Record<string, number>),
        },
        grandTotal: tripsTotal + calcTotal + rentTotal,
      };
    } catch (error) {
      console.error('Ошибка получения сводки OPEX:', error);
      return {
        trips: { count: 0, total: 0, avgPerTrip: 0 },
        calculations: { count: 0, total: 0, byType: {} },
        areas: { count: 0, totalArea: 0, rentTotal: 0, avgRatePerSqm: 0, byType: {} },
        grandTotal: 0,
      };
    }
  }
}

// Экспорт экземпляра репозитория
export const opexRepo = new OpexRepository();