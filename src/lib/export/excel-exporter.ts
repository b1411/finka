import { utils, writeFile } from 'xlsx';

export interface ExportData {
  title: string;
  headers: string[];
  data: any[][];
  filename: string;
  summary?: {
    title: string;
    data: Record<string, number | string>;
  };
}

export class ExcelExporter {
  /**
   * Экспорт данных в Excel файл
   */
  static exportToExcel(exportData: ExportData): void {
    const workbook = utils.book_new();
    
    // Главный лист с данными
    const worksheet = utils.aoa_to_sheet([
      [exportData.title, '', '', ''], // Заголовок
      [''], // Пустая строка
      exportData.headers, // Заголовки колонок
      ...exportData.data // Данные
    ]);

    // Настройки ширины колонок
    const columnWidths = exportData.headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = columnWidths;

    // Объединение ячеек для заголовка
    const titleRange = utils.encode_range({
      s: { c: 0, r: 0 }, 
      e: { c: exportData.headers.length - 1, r: 0 }
    });
    worksheet['!merges'] = [utils.decode_range(titleRange)];

    utils.book_append_sheet(workbook, worksheet, 'Данные');

    // Сводный лист, если есть данные
    if (exportData.summary) {
      const summaryData = Object.entries(exportData.summary.data).map(([key, value]) => [key, value]);
      const summarySheet = utils.aoa_to_sheet([
        [exportData.summary.title],
        [''],
        ['Показатель', 'Значение'],
        ...summaryData
      ]);

      utils.book_append_sheet(workbook, summarySheet, 'Сводка');
    }

    // Сохранение файла
    writeFile(workbook, `${exportData.filename}.xlsx`);
  }

  /**
   * Экспорт данных о контингенте в Excel
   */
  static exportContingentReport(data: any[], period: string, orgUnit: string): void {
    const headers = [
      'Класс',
      'Профиль',
      'Язык обучения', 
      'Количество учеников',
      'Плановая численность',
      'Отклонение',
      'Процент заполнения'
    ];

    const rows = data.map(item => [
      item.grade_level,
      item.education_profile || 'Общий',
      item.language === 'KAZ' ? 'Казахский' : 'Русский',
      item.student_count,
      item.planned_count || 0,
      (item.student_count - (item.planned_count || 0)),
      item.planned_count ? `${Math.round((item.student_count / item.planned_count) * 100)}%` : 'N/A'
    ]);

    const totalStudents = data.reduce((sum, item) => sum + item.student_count, 0);
    const totalPlanned = data.reduce((sum, item) => sum + (item.planned_count || 0), 0);

    this.exportToExcel({
      title: `Отчет по контингенту - ${period}`,
      headers,
      data: rows,
      filename: `contingent_report_${orgUnit}_${period}`,
      summary: {
        title: 'Сводка по контингенту',
        data: {
          'Общее количество учеников': totalStudents,
          'Плановая численность': totalPlanned,
          'Процент заполнения': totalPlanned ? `${Math.round((totalStudents / totalPlanned) * 100)}%` : 'N/A',
          'Период': period,
          'Учебное заведение': orgUnit
        }
      }
    });
  }

  /**
   * Экспорт данных о доходах в Excel
   */
  static exportRevenueReport(accruals: any[], schedule: any[], period: string, orgUnit: string): void {
    // Начисления
    const accrualsHeaders = [
      'Источник финансирования',
      'Сумма начислений',
      'Дата начисления',
      'Статус',
      'Комментарий'
    ];

    const accrualsRows = accruals.map(item => [
      item.funding_source_name || item.funding_source,
      item.accrued_amount?.toLocaleString('ru-KZ') + ' ₸',
      new Date(item.accrual_date).toLocaleDateString('ru-KZ'),
      item.status === 'CONFIRMED' ? 'Подтвержден' : 'Черновик',
      item.comment || ''
    ]);

    // Кассовый план
    const scheduleHeaders = [
      'Дата поступления',
      'Источник финансирования', 
      'Плановая сумма',
      'Фактическая сумма',
      'Отклонение',
      'Статус'
    ];

    const scheduleRows = schedule.map(item => [
      new Date(item.expected_date).toLocaleDateString('ru-KZ'),
      item.funding_source_name || item.funding_source,
      item.planned_amount?.toLocaleString('ru-KZ') + ' ₸',
      item.actual_amount?.toLocaleString('ru-KZ') + ' ₸' || 'Не поступило',
      item.actual_amount ? (item.actual_amount - item.planned_amount).toLocaleString('ru-KZ') + ' ₸' : 'N/A',
      item.status === 'RECEIVED' ? 'Получено' : (item.status === 'OVERDUE' ? 'Просрочено' : 'Ожидается')
    ]);

    // Объединенные данные
    const combinedData = [
      ['НАЧИСЛЕНИЯ ДОХОДОВ'],
      [''],
      ...accrualsHeaders.map((header, index) => index === 0 ? [header] : ['']),
      ...accrualsRows,
      [''],
      ['КАССОВЫЙ ПЛАН'],
      [''],
      ...scheduleHeaders.map((header, index) => index === 0 ? [header] : ['']),
      ...scheduleRows
    ];

    const totalAccruals = accruals.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    const totalScheduled = schedule.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
    const totalActual = schedule.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

    this.exportToExcel({
      title: `Отчет по доходам - ${period}`,
      headers: ['Раздел', 'Данные'],
      data: combinedData,
      filename: `revenue_report_${orgUnit}_${period}`,
      summary: {
        title: 'Сводка по доходам',
        data: {
          'Общая сумма начислений': totalAccruals.toLocaleString('ru-KZ') + ' ₸',
          'Плановые поступления': totalScheduled.toLocaleString('ru-KZ') + ' ₸',
          'Фактические поступления': totalActual.toLocaleString('ru-KZ') + ' ₸',
          'Отклонение от плана': (totalActual - totalScheduled).toLocaleString('ru-KZ') + ' ₸',
          'Процент исполнения': totalScheduled ? `${Math.round((totalActual / totalScheduled) * 100)}%` : 'N/A',
          'Период': period,
          'Учебное заведение': orgUnit
        }
      }
    });
  }

  /**
   * Экспорт данных о персонале в Excel
   */
  static exportStaffingReport(staff: any[], period: string, orgUnit: string): void {
    const headers = [
      'ID сотрудника',
      'ФИО',
      'Должность',
      'Отдел',
      'Тип занятости',
      'Базовая ставка',
      'Премия',
      'Надбавки',
      'Удержания',
      'Итого к выплате',
      'Статус'
    ];

    const rows = staff.map(item => [
      item.employee_id,
      item.full_name,
      item.position,
      item.department,
      item.employment_type === 'FULL_TIME' ? 'Полная' : 
      item.employment_type === 'PART_TIME' ? 'Частичная' : 
      item.employment_type === 'CONTRACT' ? 'Договор' : 'Стажер',
      item.base_salary?.toLocaleString('ru-KZ') + ' ₸',
      item.bonus?.toLocaleString('ru-KZ') + ' ₸',
      item.allowances?.toLocaleString('ru-KZ') + ' ₸',
      item.deductions?.toLocaleString('ru-KZ') + ' ₸',
      item.total_salary?.toLocaleString('ru-KZ') + ' ₸',
      item.employment_status === 'ACTIVE' ? 'Активен' : 'Неактивен'
    ]);

    const totalSalaryExpense = staff.reduce((sum, item) => sum + (item.total_salary || 0), 0);
    const activeCount = staff.filter(item => item.employment_status === 'ACTIVE').length;
    const avgSalary = staff.length > 0 ? totalSalaryExpense / staff.length : 0;

    this.exportToExcel({
      title: `Отчет по персоналу - ${period}`,
      headers,
      data: rows,
      filename: `staffing_report_${orgUnit}_${period}`,
      summary: {
        title: 'Сводка по персоналу',
        data: {
          'Общее количество сотрудников': staff.length,
          'Активные сотрудники': activeCount,
          'Общий фонд оплаты труда': totalSalaryExpense.toLocaleString('ru-KZ') + ' ₸',
          'Средняя зарплата': avgSalary.toLocaleString('ru-KZ') + ' ₸',
          'Период': period,
          'Учебное заведение': orgUnit
        }
      }
    });
  }

  /**
   * Экспорт данных о расходах OPEX в Excel
   */
  static exportOpexReport(trips: any[], calculations: any[], areas: any[], period: string, orgUnit: string): void {
    const headers = [
      'Тип расхода',
      'Описание',
      'Сумма',
      'Дата',
      'Ответственный',
      'Статус'
    ];

    // Командировки
    const tripRows = trips.map(item => [
      'Командировка',
      `${item.destination} - ${item.purpose}`,
      item.total_amount?.toLocaleString('ru-KZ') + ' ₸',
      `${new Date(item.start_date).toLocaleDateString('ru-KZ')} - ${new Date(item.end_date).toLocaleDateString('ru-KZ')}`,
      item.employee_name,
      item.status === 'APPROVED' ? 'Одобрено' : (item.status === 'COMPLETED' ? 'Завершено' : 'Планируется')
    ]);

    // Расчеты коммунальных
    const calcRows = calculations.map(item => [
      item.calculation_type === 'UTILITIES_PU' ? 'Коммунальные (ПУ)' : 'Коммунальные (РБ)',
      `${item.service_name} - ${item.calculation_method}`,
      item.calculated_amount?.toLocaleString('ru-KZ') + ' ₸',
      new Date(item.calculation_date).toLocaleDateString('ru-KZ'),
      item.responsible_person || 'Не указан',
      item.status === 'APPROVED' ? 'Утвержден' : 'Расчет'
    ]);

    // Все расходы
    const allRows = [...tripRows, ...calcRows];

    const totalTrips = trips.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const totalCalc = calculations.reduce((sum, item) => sum + (item.calculated_amount || 0), 0);
    const totalOpex = totalTrips + totalCalc;

    this.exportToExcel({
      title: `Отчет по операционным расходам - ${period}`,
      headers,
      data: allRows,
      filename: `opex_report_${orgUnit}_${period}`,
      summary: {
        title: 'Сводка по OPEX',
        data: {
          'Командировки': totalTrips.toLocaleString('ru-KZ') + ' ₸',
          'Коммунальные услуги': totalCalc.toLocaleString('ru-KZ') + ' ₸',
          'Общие операционные расходы': totalOpex.toLocaleString('ru-KZ') + ' ₸',
          'Количество командировок': trips.length,
          'Количество расчетов': calculations.length,
          'Период': period,
          'Учебное заведение': orgUnit
        }
      }
    });
  }

  /**
   * Консолидированный отчет по всем модулям
   */
  static exportConsolidatedReport(data: {
    contingent: any[];
    accruals: any[];
    schedule: any[];
    staffing: any[];
    trips: any[];
    calculations: any[];
  }, period: string, orgUnit: string): void {
    // Рассчитать основные KPI
    const totalStudents = data.contingent.reduce((sum, item) => sum + item.student_count, 0);
    const totalRevenue = data.accruals.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    const totalSalaries = data.staffing.reduce((sum, item) => sum + (item.total_salary || 0), 0);
    const totalOpex = [
      ...data.trips.map(t => t.total_amount || 0),
      ...data.calculations.map(c => c.calculated_amount || 0)
    ].reduce((sum, amount) => sum + amount, 0);

    const netResult = totalRevenue - totalSalaries - totalOpex;
    const revenuePerStudent = totalStudents > 0 ? totalRevenue / totalStudents : 0;

    const summaryData = [
      ['ОСНОВНЫЕ ПОКАЗАТЕЛИ'],
      [''],
      ['Показатель', 'Значение'],
      ['Общий контингент', totalStudents],
      ['Общие доходы', totalRevenue.toLocaleString('ru-KZ') + ' ₸'],
      ['Расходы на персонал', totalSalaries.toLocaleString('ru-KZ') + ' ₸'],
      ['Операционные расходы', totalOpex.toLocaleString('ru-KZ') + ' ₸'],
      ['Чистый результат', netResult.toLocaleString('ru-KZ') + ' ₸'],
      ['Доход на ученика', revenuePerStudent.toLocaleString('ru-KZ') + ' ₸'],
      [''],
      ['СТРУКТУРА РАСХОДОВ'],
      [''],
      ['Тип расхода', 'Сумма', '% от доходов'],
      ['Зарплаты', totalSalaries.toLocaleString('ru-KZ') + ' ₸', totalRevenue ? `${Math.round((totalSalaries / totalRevenue) * 100)}%` : 'N/A'],
      ['Операционные', totalOpex.toLocaleString('ru-KZ') + ' ₸', totalRevenue ? `${Math.round((totalOpex / totalRevenue) * 100)}%` : 'N/A'],
      ['Итого расходы', (totalSalaries + totalOpex).toLocaleString('ru-KZ') + ' ₸', totalRevenue ? `${Math.round(((totalSalaries + totalOpex) / totalRevenue) * 100)}%` : 'N/A']
    ];

    this.exportToExcel({
      title: `Консолидированный отчет - ${period}`,
      headers: ['Раздел', 'Показатель', 'Значение'],
      data: summaryData,
      filename: `consolidated_report_${orgUnit}_${period}`,
      summary: {
        title: 'Финансовые KPI',
        data: {
          'Рентабельность': totalRevenue ? `${Math.round((netResult / totalRevenue) * 100)}%` : 'N/A',
          'Доля затрат на персонал': totalRevenue ? `${Math.round((totalSalaries / totalRevenue) * 100)}%` : 'N/A',
          'Доля операционных затрат': totalRevenue ? `${Math.round((totalOpex / totalRevenue) * 100)}%` : 'N/A',
          'Средний доход на ученика': revenuePerStudent.toLocaleString('ru-KZ') + ' ₸/чел',
          'Учебное заведение': orgUnit,
          'Отчетный период': period
        }
      }
    });
  }
}