import { db } from '@/lib/db/database';
import { StgContingent } from '@/types/stg-entities';
import { generateId } from '@/lib/repositories/base-repository';

// Создание демо данных по контингенту для трех филиалов
export async function createDemoContingentData() {
  const demoData: StgContingent[] = [];

  const orgUnits = ['ALM', 'AST', 'URA'];
  const periods = ['2024-08', '2024-09', '2024-10'];
  const programs = [
    { name: 'Физико-математическая', classes: [7, 8, 9, 10, 11] },
    { name: 'Естественно-научная', classes: [8, 9, 10, 11] },
    { name: 'Информационно-технологическая', classes: [9, 10, 11] }
  ];

  // Тарифы по филиалам для ПУ
  const tariffs = {
    ALM: 65000,
    AST: 60000,
    URA: 45000
  };

  orgUnits.forEach(orgUnit => {
    periods.forEach(period => {
      programs.forEach(program => {
        program.classes.forEach(classLevel => {
          // ПУ данные
          const studentCountPU = Math.floor(Math.random() * 15) + 8; // 8-22 ученика
          demoData.push({
            id: generateId(),
            org_unit_code: orgUnit,
            period_ym: period,
            program_name: program.name,
            class_level: classLevel,
            student_count: studentCountPU,
            tariff_amount: tariffs[orgUnit as keyof typeof tariffs],
            funding_source: 'PU',
            status: Math.random() > 0.3 ? 'approved' : 'submitted',
            created_at: new Date(),
            updated_at: new Date(),
            user_id: `economist-${orgUnit.toLowerCase()}`
          });

          // РБ данные (меньше классов)
          if (classLevel >= 9) {
            const studentCountRB = Math.floor(Math.random() * 12) + 5; // 5-16 учеников
            demoData.push({
              id: generateId(),
              org_unit_code: orgUnit,
              period_ym: period,
              program_name: program.name + ' (РБ)',
              class_level: classLevel,
              student_count: studentCountRB,
              funding_source: 'RB',
              status: Math.random() > 0.2 ? 'approved' : 'submitted',
              created_at: new Date(),
              updated_at: new Date(),
              user_id: `economist-${orgUnit.toLowerCase()}`
            });
          }
        });
      });
    });
  });

  try {
    // Очищаем существующие данные
    await db.stgContingent.clear();
    
    // Загружаем новые данные
    await db.stgContingent.bulkAdd(demoData);
    
    console.log(`Создано ${demoData.length} записей демо контингента`);
    return { success: true, count: demoData.length };
  } catch (error) {
    console.error('Ошибка создания демо данных:', error);
    return { success: false, error };
  }
}

// Расчет сводной статистики по контингенту
export async function calculateContingentStats() {
  try {
    const allData = await db.stgContingent.toArray();
    
    const stats = {
      totalStudents: allData.reduce((sum, record) => sum + record.student_count, 0),
      totalRevenuePlan: allData
        .filter(record => record.funding_source === 'PU' && record.tariff_amount)
        .reduce((sum, record) => sum + (record.student_count * (record.tariff_amount || 0)), 0),
      byOrgUnit: {} as Record<string, { students: number; revenue: number }>,
      byFundingSource: {} as Record<string, { students: number; revenue: number }>
    };

    // Группировка по филиалам
    allData.forEach(record => {
      if (!stats.byOrgUnit[record.org_unit_code]) {
        stats.byOrgUnit[record.org_unit_code] = { students: 0, revenue: 0 };
      }
      stats.byOrgUnit[record.org_unit_code].students += record.student_count;
      
      if (record.funding_source === 'PU' && record.tariff_amount) {
        stats.byOrgUnit[record.org_unit_code].revenue += 
          record.student_count * record.tariff_amount;
      }
    });

    // Группировка по источникам
    allData.forEach(record => {
      if (!stats.byFundingSource[record.funding_source]) {
        stats.byFundingSource[record.funding_source] = { students: 0, revenue: 0 };
      }
      stats.byFundingSource[record.funding_source].students += record.student_count;
      
      if (record.funding_source === 'PU' && record.tariff_amount) {
        stats.byFundingSource[record.funding_source].revenue += 
          record.student_count * record.tariff_amount;
      }
    });

    return stats;
  } catch (error) {
    console.error('Ошибка расчета статистики:', error);
    return null;
  }
}

// Инициализация всех демо данных
export async function initializeDemoData() {
  try {
    console.log('Создание демо данных...');
    
    const contingentResult = await createDemoContingentData();
    
    if (contingentResult.success) {
      const stats = await calculateContingentStats();
      console.log('Статистика демо данных:', stats);
    }
    
    return contingentResult;
  } catch (error) {
    console.error('Ошибка инициализации демо данных:', error);
    return { success: false, error };
  }
}