import { db } from '../db/database';
import { StaffingRecord } from '@/types/core-entities';
import { z } from 'zod';

// Валидация данных персонала
export const staffingSchema = z.object({
  id: z.string().optional(),
  org_unit_code: z.string().min(1, 'Код подразделения обязателен'),
  period_ym: z.string().regex(/^\d{6}$/, 'Формат: YYYYMM'),
  employee_id: z.string().min(1, 'ID сотрудника обязателен'),
  full_name: z.string().min(1, 'ФИО обязательно'),
  position: z.string().min(1, 'Должность обязательна'),
  department: z.string().min(1, 'Департамент обязателен'),
  employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
  base_salary: z.number().min(0, 'Оклад не может быть отрицательным'),
  bonus: z.number().min(0, 'Премия не может быть отрицательной').optional().default(0),
  allowances: z.number().min(0, 'Надбавки не могут быть отрицательными').optional().default(0),
  deductions: z.number().min(0, 'Удержания не могут быть отрицательными').optional().default(0),
  social_tax: z.number().min(0, 'Соцналог не может быть отрицательным').optional().default(0),
  pension_contribution: z.number().min(0, 'Пенсионные взносы не могут быть отрицательными').optional().default(0),
  hire_date: z.date(),
  termination_date: z.date().optional(),
  is_active: z.boolean().default(true),
  employment_status: z.enum(['ACTIVE', 'TERMINATED', 'ON_LEAVE', 'SUSPENDED']).default('ACTIVE'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type StaffingFormData = z.infer<typeof staffingSchema>;

export class StaffingRepository {
  // Получить всех сотрудников по подразделению
  async findByOrgUnit(orgUnitCode: string): Promise<StaffingRecord[]> {
    try {
      return await db.staffing
        .where('org_unit_code')
        .equals(orgUnitCode)
        .toArray();
    } catch (error) {
      console.error('Ошибка получения штатного расписания:', error);
      return [];
    }
  }

  // Получить всех сотрудников за период
  async findByPeriod(periodYm: string): Promise<StaffingRecord[]> {
    try {
      return await db.staffing
        .where('period_ym')
        .equals(periodYm)
        .toArray();
    } catch (error) {
      console.error('Ошибка получения штатного расписания по периоду:', error);
      return [];
    }
  }

  // Получить активных сотрудников по подразделению
  async findActiveByOrgUnit(orgUnitCode: string): Promise<StaffingRecord[]> {
    try {
      return await db.staffing
        .where('org_unit_code')
        .equals(orgUnitCode)
        .and(record => record.is_active === true)
        .toArray();
    } catch (error) {
      console.error('Ошибка получения активного штатного расписания:', error);
      return [];
    }
  }

  // Получить сотрудника по ID
  async findById(id: string): Promise<StaffingRecord | null> {
    try {
      const record = await db.staffing.get(id);
      return record || null;
    } catch (error) {
      console.error('Ошибка получения сотрудника:', error);
      return null;
    }
  }

  // Найти сотрудника по employee_id и периоду
  async findByEmployeeId(employeeId: string, periodYm: string): Promise<StaffingRecord | null> {
    try {
      const records = await db.staffing
        .where(['employee_id', 'period_ym'])
        .equals([employeeId, periodYm])
        .toArray();
      return records[0] || null;
    } catch (error) {
      console.error('Ошибка поиска сотрудника по employee_id:', error);
      return null;
    }
  }

  // Создать сотрудника
  async create(data: StaffingFormData): Promise<string> {
    try {
      // Валидация данных
      const validatedData = staffingSchema.parse(data);
      
      // Проверка на дублирование
      const existing = await this.findByEmployeeId(
        validatedData.employee_id, 
        validatedData.period_ym
      );
      
      if (existing) {
        throw new Error(`Сотрудник ${validatedData.employee_id} уже существует в периоде ${validatedData.period_ym}`);
      }

      // Генерация ID
      const id = crypto.randomUUID();
      
      // Подготовка записи
      const staffingRecord: StaffingRecord = {
        ...validatedData,
        id,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Сохранение
      await db.staffing.add(staffingRecord);
      
      console.log('Создан новый сотрудник:', staffingRecord);
      return id;
    } catch (error) {
      console.error('Ошибка создания сотрудника:', error);
      throw error;
    }
  }

  // Обновить сотрудника
  async update(id: string, data: Partial<StaffingFormData>): Promise<void> {
    try {
      // Валидация только переданных полей
      const updateData = {
        ...data,
        updated_at: new Date(),
      };

      await db.staffing.update(id, updateData);
      console.log('Обновлен сотрудник:', id);
    } catch (error) {
      console.error('Ошибка обновления сотрудника:', error);
      throw error;
    }
  }

  // Удалить сотрудника (мягкое удаление)
  async delete(id: string): Promise<void> {
    try {
      await db.staffing.update(id, {
        is_active: false,
        employment_status: 'TERMINATED',
        termination_date: new Date(),
        updated_at: new Date(),
      });
      console.log('Сотрудник деактивирован:', id);
    } catch (error) {
      console.error('Ошибка деактивации сотрудника:', error);
      throw error;
    }
  }

  // Получить всех сотрудников (для администраторов)
  async findAll(): Promise<StaffingRecord[]> {
    try {
      return await db.staffing.orderBy('full_name').toArray();
    } catch (error) {
      console.error('Ошибка получения всех сотрудников:', error);
      return [];
    }
  }

  // Поиск сотрудников по имени
  async searchByName(searchTerm: string): Promise<StaffingRecord[]> {
    try {
      return await db.staffing
        .filter((record: StaffingRecord) => 
          record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.employee_id.includes(searchTerm)
        )
        .toArray();
    } catch (error) {
      console.error('Ошибка поиска сотрудников:', error);
      return [];
    }
  }

  // Получить статистику по подразделению
  async getOrgUnitStats(orgUnitCode: string, periodYm: string) {
    try {
      const records = await db.staffing
        .where(['org_unit_code', 'period_ym'])
        .equals([orgUnitCode, periodYm])
        .toArray();

      const active = records.filter((r: StaffingRecord) => r.is_active);
      
      return {
        totalEmployees: records.length,
        activeEmployees: active.length,
        totalSalaryExpense: active.reduce((sum: number, r: StaffingRecord) => 
          sum + r.base_salary + (r.bonus || 0) + (r.allowances || 0), 0
        ),
        averageSalary: active.length ? 
          active.reduce((sum: number, r: StaffingRecord) => sum + r.base_salary, 0) / active.length : 0,
        byEmploymentType: {
          FULL_TIME: active.filter((r: StaffingRecord) => r.employment_type === 'FULL_TIME').length,
          PART_TIME: active.filter((r: StaffingRecord) => r.employment_type === 'PART_TIME').length,
          CONTRACT: active.filter((r: StaffingRecord) => r.employment_type === 'CONTRACT').length,
          INTERN: active.filter((r: StaffingRecord) => r.employment_type === 'INTERN').length,
        },
        byDepartment: active.reduce((acc: Record<string, number>, r: StaffingRecord) => {
          acc[r.department] = (acc[r.department] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Ошибка получения статистики штатного расписания:', error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalSalaryExpense: 0,
        averageSalary: 0,
        byEmploymentType: { FULL_TIME: 0, PART_TIME: 0, CONTRACT: 0, INTERN: 0 },
        byDepartment: {},
      };
    }
  }

  // Рассчитать зарплату сотрудника
  calculateSalary(record: StaffingRecord) {
    const grossSalary = record.base_salary + (record.bonus || 0) + (record.allowances || 0);
    const totalDeductions = (record.deductions || 0) + (record.social_tax || 0) + (record.pension_contribution || 0);
    const netSalary = grossSalary - totalDeductions;
    
    return {
      baseSalary: record.base_salary,
      bonus: record.bonus || 0,
      allowances: record.allowances || 0,
      grossSalary,
      deductions: record.deductions || 0,
      socialTax: record.social_tax || 0,
      pensionContribution: record.pension_contribution || 0,
      totalDeductions,
      netSalary,
    };
  }
}

// Экспорт экземпляра репозитория
export const staffingRepo = new StaffingRepository();