import { z } from 'zod';

/**
 * Система валидации и бизнес-правил для ФИНКА
 * Обеспечивает целостность данных, проверку дубликатов и соблюдение бизнес-логики
 */

// Базовые валидаторы
export const businessRules = {
  // Контингент
  contingent: {
    // Максимальное количество учеников в классе
    maxStudentsPerClass: 30,
    
    // Минимальное количество учеников для открытия класса
    minStudentsPerClass: 15,
    
    // Валидация уникальности класса
    validateUniqueClass: (gradeLevel: string, profileCode: string, language: string, orgUnit: string, period: string, existingData: any[]) => {
      const duplicate = existingData.find(item => 
        item.grade_level === gradeLevel &&
        item.education_profile === profileCode &&
        item.language === language &&
        item.org_unit_code === orgUnit &&
        item.period_ym === period
      );
      
      if (duplicate) {
        return {
          isValid: false,
          error: `Класс ${gradeLevel} с профилем "${profileCode}" на ${language === 'KAZ' ? 'казахском' : 'русском'} языке уже существует`
        };
      }
      
      return { isValid: true };
    },
    
    // Проверка реалистичности количества учеников
    validateStudentCount: (studentCount: number, gradeLevel: string) => {
      if (studentCount > businessRules.contingent.maxStudentsPerClass) {
        return {
          isValid: false,
          error: `Количество учеников (${studentCount}) превышает максимально допустимое (${businessRules.contingent.maxStudentsPerClass})`
        };
      }
      
      if (studentCount < businessRules.contingent.minStudentsPerClass && gradeLevel !== '0') {
        return {
          isValid: false,
          error: `Количество учеников (${studentCount}) ниже минимально допустимого (${businessRules.contingent.minStudentsPerClass}) для открытия класса`
        };
      }
      
      return { isValid: true };
    }
  },

  // Доходы и начисления
  revenue: {
    // Максимальная сумма начисления (в тенге)
    maxAccrualAmount: 50000000, // 50 млн тенге
    
    // Минимальная сумма начисления
    minAccrualAmount: 1000,
    
    // Валидация начислений
    validateAccrual: (amount: number, fundingSource: string, date: string, orgUnit: string, existingData: any[]) => {
      // Проверка суммы
      if (amount > businessRules.revenue.maxAccrualAmount) {
        return {
          isValid: false,
          error: `Сумма начисления (${amount.toLocaleString('ru-KZ')} ₸) превышает максимально допустимую (${businessRules.revenue.maxAccrualAmount.toLocaleString('ru-KZ')} ₸)`
        };
      }
      
      if (amount < businessRules.revenue.minAccrualAmount) {
        return {
          isValid: false,
          error: `Сумма начисления (${amount.toLocaleString('ru-KZ')} ₸) ниже минимально допустимой (${businessRules.revenue.minAccrualAmount.toLocaleString('ru-KZ')} ₸)`
        };
      }
      
      // Проверка дубликатов (одинаковые начисления в один день)
      const duplicate = existingData.find(item =>
        item.funding_source === fundingSource &&
        item.accrual_date === date &&
        item.org_unit_code === orgUnit &&
        Math.abs(item.accrued_amount - amount) < 1
      );
      
      if (duplicate) {
        return {
          isValid: false,
          error: `Аналогичное начисление уже существует на ${new Date(date).toLocaleDateString('ru-KZ')}`
        };
      }
      
      return { isValid: true };
    },
    
    // Валидация кассового плана
    validateCashSchedule: (plannedAmount: number, expectedDate: string, fundingSource: string, orgUnit: string, existingData: any[]) => {
      // Проверка суммы
      if (plannedAmount > businessRules.revenue.maxAccrualAmount) {
        return {
          isValid: false,
          error: `Плановая сумма превышает максимально допустимую`
        };
      }
      
      // Проверка дубликатов
      const duplicate = existingData.find(item =>
        item.funding_source === fundingSource &&
        item.expected_date === expectedDate &&
        item.org_unit_code === orgUnit
      );
      
      if (duplicate) {
        return {
          isValid: false,
          error: `Запись в кассовом плане на эту дату уже существует`
        };
      }
      
      return { isValid: true };
    }
  },

  // Персонал и ФОТ
  staffing: {
    // Максимальная зарплата (в тенге)
    maxSalary: 2000000, // 2 млн тенге
    
    // Минимальная зарплата
    minSalary: 85000, // МРЗП в Казахстане
    
    // Максимальная премия в процентах от оклада
    maxBonusPercent: 100,
    
    // Социальный налог (процент)
    socialTaxRate: 0.095, // 9.5%
    
    // Пенсионные взносы (процент)
    pensionRate: 0.10, // 10%
    
    // Валидация сотрудника
    validateEmployee: (employeeId: string, fullName: string, position: string, baseSalary: number, bonus: number, orgUnit: string, period: string, existingData: any[]) => {
      // Проверка уникальности ID сотрудника в периоде
      const duplicate = existingData.find(item =>
        item.employee_id === employeeId &&
        item.org_unit_code === orgUnit &&
        item.period_ym === period
      );
      
      if (duplicate) {
        return {
          isValid: false,
          error: `Сотрудник с ID "${employeeId}" уже существует в текущем периоде`
        };
      }
      
      // Проверка зарплаты
      if (baseSalary > businessRules.staffing.maxSalary) {
        return {
          isValid: false,
          error: `Базовая зарплата (${baseSalary.toLocaleString('ru-KZ')} ₸) превышает максимально допустимую (${businessRules.staffing.maxSalary.toLocaleString('ru-KZ')} ₸)`
        };
      }
      
      if (baseSalary < businessRules.staffing.minSalary) {
        return {
          isValid: false,
          error: `Базовая зарплата (${baseSalary.toLocaleString('ru-KZ')} ₸) ниже МРЗП (${businessRules.staffing.minSalary.toLocaleString('ru-KZ')} ₸)`
        };
      }
      
      // Проверка премии
      if (bonus > baseSalary * (businessRules.staffing.maxBonusPercent / 100)) {
        return {
          isValid: false,
          error: `Премия (${bonus.toLocaleString('ru-KZ')} ₸) превышает ${businessRules.staffing.maxBonusPercent}% от базовой зарплаты`
        };
      }
      
      return { isValid: true };
    },
    
    // Автоматический расчет налогов и взносов
    calculateTaxes: (baseSalary: number, bonus: number, allowances: number) => {
      const grossSalary = baseSalary + bonus + allowances;
      const socialTax = Math.round(grossSalary * businessRules.staffing.socialTaxRate);
      const pensionContribution = Math.round(grossSalary * businessRules.staffing.pensionRate);
      
      return {
        socialTax,
        pensionContribution,
        totalDeductions: socialTax + pensionContribution,
        netSalary: grossSalary - socialTax - pensionContribution
      };
    }
  },

  // Операционные расходы (OPEX)
  opex: {
    // Максимальная сумма командировки
    maxTripAmount: 500000, // 500 тыс тенге
    
    // Минимальная продолжительность командировки (дни)
    minTripDays: 1,
    
    // Максимальная продолжительность командировки (дни)
    maxTripDays: 30,
    
    // Суточные нормы (тенге)
    dailyAllowanceRates: {
      domestic: 8000, // Внутренние командировки
      international: 25000 // Международные командировки
    },
    
    // Валидация командировки
    validateTrip: (employeeName: string, destination: string, startDate: string, endDate: string, totalAmount: number, existingData: any[]) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Проверка продолжительности
      if (days < businessRules.opex.minTripDays) {
        return {
          isValid: false,
          error: `Продолжительность командировки (${days} дн.) меньше минимальной (${businessRules.opex.minTripDays} дн.)`
        };
      }
      
      if (days > businessRules.opex.maxTripDays) {
        return {
          isValid: false,
          error: `Продолжительность командировки (${days} дн.) превышает максимальную (${businessRules.opex.maxTripDays} дн.)`
        };
      }
      
      // Проверка суммы
      if (totalAmount > businessRules.opex.maxTripAmount) {
        return {
          isValid: false,
          error: `Сумма командировки (${totalAmount.toLocaleString('ru-KZ')} ₸) превышает максимально допустимую (${businessRules.opex.maxTripAmount.toLocaleString('ru-KZ')} ₸)`
        };
      }
      
      // Проверка пересечения дат для одного сотрудника
      const overlap = existingData.find(item =>
        item.employee_name === employeeName &&
        ((new Date(item.start_date) <= start && new Date(item.end_date) >= start) ||
         (new Date(item.start_date) <= end && new Date(item.end_date) >= end) ||
         (new Date(item.start_date) >= start && new Date(item.end_date) <= end))
      );
      
      if (overlap) {
        return {
          isValid: false,
          error: `Командировка пересекается с существующей командировкой сотрудника в период с ${new Date(overlap.start_date).toLocaleDateString('ru-KZ')} по ${new Date(overlap.end_date).toLocaleDateString('ru-KZ')}`
        };
      }
      
      return { isValid: true };
    },
    
    // Расчет суточных
    calculateDailyAllowances: (startDate: string, endDate: string, isInternational: boolean = false) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const rate = isInternational ? 
        businessRules.opex.dailyAllowanceRates.international : 
        businessRules.opex.dailyAllowanceRates.domestic;
      
      return {
        days,
        dailyRate: rate,
        totalAllowance: days * rate
      };
    },
    
    // Валидация расчета коммунальных услуг
    validateUtilityCalculation: (serviceName: string, calculationMethod: string, calculatedAmount: number, calculationDate: string, existingData: any[]) => {
      // Проверка разумности суммы (от 10 тыс до 5 млн тенге)
      if (calculatedAmount < 10000 || calculatedAmount > 5000000) {
        return {
          isValid: false,
          error: `Неразумная сумма расчета коммунальных услуг: ${calculatedAmount.toLocaleString('ru-KZ')} ₸`
        };
      }
      
      // Проверка дубликатов за месяц
      const monthYear = calculationDate.substring(0, 7); // YYYY-MM
      const duplicate = existingData.find(item =>
        item.service_name === serviceName &&
        item.calculation_date.substring(0, 7) === monthYear
      );
      
      if (duplicate) {
        return {
          isValid: false,
          error: `Расчет для услуги "${serviceName}" за ${monthYear} уже существует`
        };
      }
      
      return { isValid: true };
    }
  }
};

/**
 * Валидатор целостности данных между модулями
 */
export const crossModuleValidator = {
  // Проверка соответствия доходов контингенту
  validateRevenueVsContingent: (contingentData: any[], revenueData: any[], period: string) => {
    const totalStudents = contingentData.reduce((sum, item) => sum + item.student_count, 0);
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    
    // Примерная норма дохода на ученика (500,000 тенге в год)
    const expectedRevenuePerStudent = 500000;
    const expectedTotalRevenue = totalStudents * expectedRevenuePerStudent;
    
    const deviation = Math.abs(totalRevenue - expectedTotalRevenue) / expectedTotalRevenue;
    
    if (deviation > 0.5) { // Отклонение более 50%
      return {
        isValid: false,
        warning: `Доходы значительно отклоняются от ожидаемых. Ожидается: ${expectedTotalRevenue.toLocaleString('ru-KZ')} ₸, факт: ${totalRevenue.toLocaleString('ru-KZ')} ₸`
      };
    }
    
    return { isValid: true };
  },
  
  // Проверка соответствия расходов на персонал контингенту
  validateStaffingVsContingent: (contingentData: any[], staffingData: any[]) => {
    const totalStudents = contingentData.reduce((sum, item) => sum + item.student_count, 0);
    const totalStaff = staffingData.filter(item => item.employment_status === 'ACTIVE').length;
    
    // Нормальное соотношение ученик:преподаватель (15:1)
    const idealRatio = 15;
    const actualRatio = totalStudents / totalStaff;
    
    if (actualRatio < 8) {
      return {
        isValid: false,
        warning: `Слишком высокая обеспеченность персоналом. Соотношение ученик:сотрудник = ${actualRatio.toFixed(1)}:1 (рекомендуется 15:1)`
      };
    }
    
    if (actualRatio > 25) {
      return {
        isValid: false,
        warning: `Недостаточная обеспеченность персоналом. Соотношение ученик:сотрудник = ${actualRatio.toFixed(1)}:1 (рекомендуется 15:1)`
      };
    }
    
    return { isValid: true };
  },
  
  // Проверка общего бюджетного баланса
  validateBudgetBalance: (revenueData: any[], staffingData: any[], opexTrips: any[], opexCalculations: any[]) => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    
    const totalSalaries = staffingData.reduce((sum, item) => sum + (item.total_salary || 0), 0);
    const totalOpex = [
      ...opexTrips.map(t => t.total_amount || 0),
      ...opexCalculations.map(c => c.calculated_amount || 0)
    ].reduce((sum, amount) => sum + amount, 0);
    
    const totalExpenses = totalSalaries + totalOpex;
    const balance = totalRevenue - totalExpenses;
    
    // Предупреждение если расходы превышают доходы
    if (balance < 0) {
      return {
        isValid: false,
        error: `Расходы (${totalExpenses.toLocaleString('ru-KZ')} ₸) превышают доходы (${totalRevenue.toLocaleString('ru-KZ')} ₸) на ${Math.abs(balance).toLocaleString('ru-KZ')} ₸`
      };
    }
    
    // Предупреждение если рентабельность слишком низкая (менее 5%)
    const profitMargin = (balance / totalRevenue) * 100;
    if (profitMargin < 5) {
      return {
        isValid: false,
        warning: `Низкая рентабельность: ${profitMargin.toFixed(1)}% (рекомендуется не менее 5%)`
      };
    }
    
    return { 
      isValid: true, 
      balance, 
      profitMargin: profitMargin.toFixed(1) + '%',
      message: `Бюджет сбалансирован. Прибыль: ${balance.toLocaleString('ru-KZ')} ₸ (${profitMargin.toFixed(1)}%)`
    };
  }
};

/**
 * Система предупреждений и уведомлений
 */
export const alertSystem = {
  // Критичные предупреждения
  checkCriticalAlerts: (allData: {
    contingent: any[];
    accruals: any[];
    schedule: any[];
    staffing: any[];
    trips: any[];
    calculations: any[];
  }) => {
    const alerts: Array<{type: 'error' | 'warning' | 'info', message: string}> = [];
    
    // Проверка просроченных платежей
    const overduePayments = allData.schedule.filter(item => 
      item.status === 'OVERDUE' || 
      (item.status === 'PENDING' && new Date(item.expected_date) < new Date())
    );
    
    if (overduePayments.length > 0) {
      alerts.push({
        type: 'error',
        message: `Просроченных платежей: ${overduePayments.length} на сумму ${overduePayments.reduce((sum, item) => sum + item.planned_amount, 0).toLocaleString('ru-KZ')} ₸`
      });
    }
    
    // Проверка неактивных сотрудников с зарплатой
    const inactiveWithSalary = allData.staffing.filter(item => 
      item.employment_status !== 'ACTIVE' && item.total_salary > 0
    );
    
    if (inactiveWithSalary.length > 0) {
      alerts.push({
        type: 'warning',
        message: `Неактивные сотрудники с начисленной зарплатой: ${inactiveWithSalary.length}`
      });
    }
    
    // Проверка классов с низкой наполняемостью
    const underfilledClasses = allData.contingent.filter(item => 
      item.student_count < businessRules.contingent.minStudentsPerClass && item.grade_level !== '0'
    );
    
    if (underfilledClasses.length > 0) {
      alerts.push({
        type: 'warning',
        message: `Классов с низкой наполняемостью: ${underfilledClasses.length}`
      });
    }
    
    return alerts;
  }
};