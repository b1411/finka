import { DataStatus } from '@/types/finka-core';

// Базовый интерфейс для всех репозиториев
export interface BaseRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  findByOrgUnit(orgUnitCode: string): Promise<T[]>;
  findByPeriod(periodYm: string): Promise<T[]>;
  findByOrgUnitAndPeriod(orgUnitCode: string, periodYm: string): Promise<T[]>;
  findByStatus(status: DataStatus): Promise<T[]>;
}

// Интерфейс для репозиториев с ETL функциональностью
export interface EtlRepository<T> extends BaseRepository<T> {
  aggregate(fromTables: string[], targetTable: string): Promise<void>;
  validateData(data: T[]): Promise<{ isValid: boolean; errors: string[] }>;
  runChecks(data: T[]): Promise<{ passed: boolean; warnings: string[] }>;
}

// Генерация уникального ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Генерация базовых полей для новых записей
export function createBaseFields(userId: string, orgUnitCode: string, periodYm: string, status: DataStatus = 'draft') {
  return {
    id: generateId(),
    org_unit_code: orgUnitCode,
    period_ym: periodYm,
    status,
    created_at: new Date(),
    updated_at: new Date(),
    user_id: userId
  };
}

// Обновление полей при изменении
export function updateBaseFields() {
  return {
    updated_at: new Date()
  };
}

// Валидация периода (YYYY-MM)
export function validatePeriodYm(periodYm: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(periodYm);
}

// Валидация статуса перехода
export function canChangeStatus(from: DataStatus, to: DataStatus): boolean {
  const transitions: Record<DataStatus, DataStatus[]> = {
    'draft': ['submitted'],
    'submitted': ['draft', 'approved'],
    'approved': [] // только HQ может изменять approved записи
  };
  
  return transitions[from]?.includes(to) || false;
}