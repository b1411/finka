import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class PDFExporter {
  /**
   * Базовая настройка PDF документа
   */
  private static setupPDF(): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Настройка шрифта (поддержка кириллицы)
    doc.setFont('helvetica');
    
    return doc;
  }

  /**
   * Добавить заголовок к документу
   */
  private static addHeader(doc: jsPDF, title: string, period: string, orgUnit: string): number {
    let currentY = 20;

    // Заголовок
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, currentY, { align: 'center' });
    currentY += 10;

    // Информация об организации и периоде
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Учебное заведение: ${orgUnit}`, 20, currentY);
    currentY += 8;
    doc.text(`Отчетный период: ${period}`, 20, currentY);
    currentY += 8;
    doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, 20, currentY);
    currentY += 15;

    // Линия разделитель
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY, 190, currentY);
    currentY += 10;

    return currentY;
  }

  /**
   * Добавить сводную таблицу в PDF
   */
  private static addSummaryTable(doc: jsPDF, data: Record<string, string | number>, startY: number): number {
    const tableData = Object.entries(data).map(([key, value]) => [key, value.toString()]);

    doc.autoTable({
      startY: startY,
      head: [['Показатель', 'Значение']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });

    return (doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Экспорт отчета по контингенту в PDF
   */
  static exportContingentReportPDF(data: any[], period: string, orgUnit: string): void {
    const doc = this.setupPDF();
    let currentY = this.addHeader(doc, 'Отчет по контингенту учащихся', period, orgUnit);

    // Подготовка данных для таблицы
    const tableData = data.map(item => [
      item.grade_level,
      item.education_profile || 'Общий',
      item.language === 'KAZ' ? 'Казахский' : 'Русский',
      item.student_count.toString(),
      (item.planned_count || 0).toString(),
      (item.student_count - (item.planned_count || 0)).toString(),
      item.planned_count ? `${Math.round((item.student_count / item.planned_count) * 100)}%` : 'N/A'
    ]);

    // Основная таблица
    doc.autoTable({
      startY: currentY,
      head: [['Класс', 'Профиль', 'Язык', 'Учеников', 'План', 'Откл.', '%']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Сводная информация
    const totalStudents = data.reduce((sum, item) => sum + item.student_count, 0);
    const totalPlanned = data.reduce((sum, item) => sum + (item.planned_count || 0), 0);
    
    const summaryData = {
      'Общее количество учащихся': totalStudents,
      'Плановая численность': totalPlanned,
      'Процент заполнения': totalPlanned ? `${Math.round((totalStudents / totalPlanned) * 100)}%` : 'N/A',
      'Количество классов': data.length
    };

    this.addSummaryTable(doc, summaryData, currentY);

    // Сохранение файла
    doc.save(`contingent_report_${orgUnit}_${period}.pdf`);
  }

  /**
   * Экспорт отчета по доходам в PDF
   */
  static exportRevenueReportPDF(accruals: any[], schedule: any[], period: string, orgUnit: string): void {
    const doc = this.setupPDF();
    let currentY = this.addHeader(doc, 'Отчет по доходам', period, orgUnit);

    // Таблица начислений
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Начисления доходов', 20, currentY);
    currentY += 10;

    const accrualsData = accruals.map(item => [
      item.funding_source_name || item.funding_source,
      (item.accrued_amount || 0).toLocaleString('ru-KZ') + ' ₸',
      new Date(item.accrual_date).toLocaleDateString('ru-RU'),
      item.status === 'CONFIRMED' ? 'Подтвержден' : 'Черновик'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Источник финансирования', 'Сумма', 'Дата', 'Статус']],
      body: accrualsData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [40, 167, 69],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Таблица кассового плана
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Кассовый план', 20, currentY);
    currentY += 10;

    const scheduleData = schedule.map(item => [
      new Date(item.expected_date).toLocaleDateString('ru-RU'),
      item.funding_source_name || item.funding_source,
      (item.planned_amount || 0).toLocaleString('ru-KZ') + ' ₸',
      item.actual_amount ? (item.actual_amount.toLocaleString('ru-KZ') + ' ₸') : 'Не поступило',
      item.status === 'RECEIVED' ? 'Получено' : (item.status === 'OVERDUE' ? 'Просрочено' : 'Ожидается')
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Дата', 'Источник', 'План', 'Факт', 'Статус']],
      body: scheduleData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [255, 193, 7],
        textColor: 0,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Сводка
    const totalAccruals = accruals.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    const totalScheduled = schedule.reduce((sum, item) => sum + (item.planned_amount || 0), 0);
    const totalActual = schedule.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

    const summaryData = {
      'Общая сумма начислений': totalAccruals.toLocaleString('ru-KZ') + ' ₸',
      'Плановые поступления': totalScheduled.toLocaleString('ru-KZ') + ' ₸',
      'Фактические поступления': totalActual.toLocaleString('ru-KZ') + ' ₸',
      'Процент исполнения': totalScheduled ? `${Math.round((totalActual / totalScheduled) * 100)}%` : 'N/A'
    };

    this.addSummaryTable(doc, summaryData, currentY);

    doc.save(`revenue_report_${orgUnit}_${period}.pdf`);
  }

  /**
   * Экспорт отчета по персоналу в PDF
   */
  static exportStaffingReportPDF(staff: any[], period: string, orgUnit: string): void {
    const doc = this.setupPDF();
    let currentY = this.addHeader(doc, 'Отчет по персоналу', period, orgUnit);

    // Основная таблица персонала
    const staffData = staff.map(item => [
      item.employee_id,
      item.full_name.length > 20 ? item.full_name.substring(0, 17) + '...' : item.full_name,
      item.position.length > 15 ? item.position.substring(0, 12) + '...' : item.position,
      item.department,
      item.employment_type === 'FULL_TIME' ? 'Полная' : 
      item.employment_type === 'PART_TIME' ? 'Частичная' : 
      item.employment_type === 'CONTRACT' ? 'Договор' : 'Стажер',
      (item.total_salary || 0).toLocaleString('ru-KZ'),
      item.employment_status === 'ACTIVE' ? 'Активен' : 'Неактивен'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['ID', 'ФИО', 'Должность', 'Отдел', 'Тип', 'Зарплата ₸', 'Статус']],
      body: staffData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        5: { halign: 'right' },
        6: { halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Сводка по персоналу
    const totalSalaryExpense = staff.reduce((sum, item) => sum + (item.total_salary || 0), 0);
    const activeCount = staff.filter(item => item.employment_status === 'ACTIVE').length;
    const avgSalary = staff.length > 0 ? totalSalaryExpense / staff.length : 0;

    const summaryData = {
      'Общее количество сотрудников': staff.length,
      'Активные сотрудники': activeCount,
      'Общий фонд оплаты труда': totalSalaryExpense.toLocaleString('ru-KZ') + ' ₸',
      'Средняя зарплата': Math.round(avgSalary).toLocaleString('ru-KZ') + ' ₸'
    };

    this.addSummaryTable(doc, summaryData, currentY);

    doc.save(`staffing_report_${orgUnit}_${period}.pdf`);
  }

  /**
   * Экспорт отчета по OPEX в PDF
   */
  static exportOpexReportPDF(trips: any[], calculations: any[], period: string, orgUnit: string): void {
    const doc = this.setupPDF();
    let currentY = this.addHeader(doc, 'Отчет по операционным расходам (OPEX)', period, orgUnit);

    // Командировки
    if (trips.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Командировки', 20, currentY);
      currentY += 10;

      const tripsData = trips.map(item => [
        item.employee_name,
        item.destination,
        item.purpose.length > 25 ? item.purpose.substring(0, 22) + '...' : item.purpose,
        `${new Date(item.start_date).toLocaleDateString('ru-RU')} - ${new Date(item.end_date).toLocaleDateString('ru-RU')}`,
        (item.total_amount || 0).toLocaleString('ru-KZ') + ' ₸',
        item.status === 'APPROVED' ? 'Одобрено' : (item.status === 'COMPLETED' ? 'Завершено' : 'План')
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Сотрудник', 'Пункт назначения', 'Цель', 'Период', 'Сумма', 'Статус']],
        body: tripsData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [108, 117, 125],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          4: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Коммунальные расчеты
    if (calculations.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Коммунальные услуги', 20, currentY);
      currentY += 10;

      const calcData = calculations.map(item => [
        item.calculation_type === 'UTILITIES_PU' ? 'ПУ' : 'РБ',
        item.service_name,
        item.calculation_method,
        new Date(item.calculation_date).toLocaleDateString('ru-RU'),
        (item.calculated_amount || 0).toLocaleString('ru-KZ') + ' ₸',
        item.status === 'APPROVED' ? 'Утвержден' : 'Расчет'
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['Тип', 'Услуга', 'Метод расчета', 'Дата', 'Сумма', 'Статус']],
        body: calcData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [23, 162, 184],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          4: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Сводка OPEX
    const totalTrips = trips.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const totalCalc = calculations.reduce((sum, item) => sum + (item.calculated_amount || 0), 0);
    const totalOpex = totalTrips + totalCalc;

    const summaryData = {
      'Командировки': totalTrips.toLocaleString('ru-KZ') + ' ₸',
      'Коммунальные услуги': totalCalc.toLocaleString('ru-KZ') + ' ₸',
      'Общие операционные расходы': totalOpex.toLocaleString('ru-KZ') + ' ₸',
      'Количество командировок': trips.length,
      'Количество расчетов': calculations.length
    };

    this.addSummaryTable(doc, summaryData, currentY);

    doc.save(`opex_report_${orgUnit}_${period}.pdf`);
  }

  /**
   * Консолидированный отчет в PDF
   */
  static exportConsolidatedReportPDF(data: {
    contingent: any[];
    accruals: any[];
    schedule: any[];
    staffing: any[];
    trips: any[];
    calculations: any[];
  }, period: string, orgUnit: string): void {
    const doc = this.setupPDF();
    let currentY = this.addHeader(doc, 'Консолидированный финансовый отчет', period, orgUnit);

    // Рассчитать основные KPI
    const totalStudents = data.contingent.reduce((sum, item) => sum + item.student_count, 0);
    const totalRevenue = data.accruals.reduce((sum, item) => sum + (item.accrued_amount || 0), 0);
    const totalSalaries = data.staffing.reduce((sum, item) => sum + (item.total_salary || 0), 0);
    const totalOpex = [
      ...data.trips.map(t => t.total_amount || 0),
      ...data.calculations.map(c => c.calculated_amount || 0)
    ].reduce((sum, amount) => sum + amount, 0);

    const totalExpenses = totalSalaries + totalOpex;
    const netResult = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

    // Основные показатели
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Основные финансовые показатели', 20, currentY);
    currentY += 10;

    const mainKPIs = {
      'Общий контингент учащихся': totalStudents,
      'Общие доходы': totalRevenue.toLocaleString('ru-KZ') + ' ₸',
      'Расходы на персонал': totalSalaries.toLocaleString('ru-KZ') + ' ₸',
      'Операционные расходы': totalOpex.toLocaleString('ru-KZ') + ' ₸',
      'Общие расходы': totalExpenses.toLocaleString('ru-KZ') + ' ₸',
      'Чистый результат': netResult.toLocaleString('ru-KZ') + ' ₸',
      'Рентабельность': Math.round(profitMargin) + '%'
    };

    currentY = this.addSummaryTable(doc, mainKPIs, currentY);
    currentY += 10;

    // Структура расходов
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Структура расходов', 20, currentY);
    currentY += 10;

    const expenseStructure = [
      ['Тип расхода', 'Сумма (₸)', '% от доходов'],
      ['Зарплаты', totalSalaries.toLocaleString('ru-KZ'), totalRevenue ? `${Math.round((totalSalaries / totalRevenue) * 100)}%` : 'N/A'],
      ['Операционные', totalOpex.toLocaleString('ru-KZ'), totalRevenue ? `${Math.round((totalOpex / totalRevenue) * 100)}%` : 'N/A'],
      ['Итого расходы', totalExpenses.toLocaleString('ru-KZ'), totalRevenue ? `${Math.round((totalExpenses / totalRevenue) * 100)}%` : 'N/A']
    ];

    doc.autoTable({
      startY: currentY,
      head: [expenseStructure[0]],
      body: expenseStructure.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Эффективность
    const revenuePerStudent = totalStudents > 0 ? totalRevenue / totalStudents : 0;
    const expensePerStudent = totalStudents > 0 ? totalExpenses / totalStudents : 0;

    const efficiencyKPIs = {
      'Доход на ученика': Math.round(revenuePerStudent).toLocaleString('ru-KZ') + ' ₸/чел',
      'Расход на ученика': Math.round(expensePerStudent).toLocaleString('ru-KZ') + ' ₸/чел',
      'Доля затрат на персонал': totalRevenue ? `${Math.round((totalSalaries / totalRevenue) * 100)}%` : 'N/A',
      'Доля операционных затрат': totalRevenue ? `${Math.round((totalOpex / totalRevenue) * 100)}%` : 'N/A'
    };

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Показатели эффективности', 20, currentY);
    currentY += 10;

    this.addSummaryTable(doc, efficiencyKPIs, currentY);

    doc.save(`consolidated_report_${orgUnit}_${period}.pdf`);
  }
}