import { db } from '@/lib/db/database';
import { OrgUnit, FundingSource, Article, BudgetArticle } from '@/types/finka-core';

// Справочник организационных единиц (филиалов)
export const seedOrgUnits: OrgUnit[] = [
  {
    org_unit_code: 'ALM',
    org_unit_name: 'РФМШ Алматы',
    city: 'Алматы',
    status: 'active'
  },
  {
    org_unit_code: 'AST',
    org_unit_name: 'РФМШ Астана',
    city: 'Астана',
    status: 'active'
  },
  {
    org_unit_code: 'URA',
    org_unit_name: 'РФМШ Уральск',
    city: 'Уральск',
    status: 'active'
  },
  {
    org_unit_code: 'SHY',
    org_unit_name: 'РФМШ Шымкент',
    city: 'Шымкент',
    status: 'active'
  },
  {
    org_unit_code: 'HQ',
    org_unit_name: 'Головной офис',
    city: 'Алматы',
    status: 'active'
  }
];

// Справочник источников финансирования
export const seedFundingSources: FundingSource[] = [
  {
    funding_code: 'PU',
    funding_name: 'Платные услуги',
    category: 'commercial',
    requires_tuition: true,
    bdr_article: 'Плата за обучение (ПУ)'
  },
  {
    funding_code: 'RB',
    funding_name: 'Республиканский бюджет',
    category: 'budget',
    requires_tuition: false,
    bdr_article: 'Бюджетные ассигнования (РБ)'
  },
  {
    funding_code: 'DOTA',
    funding_name: 'Дотации/субсидии',
    category: 'subsidy',
    requires_tuition: false,
    bdr_article: 'Дотации и субсидии'
  }
];

// Справочник статей бюджета
export const seedArticles: Article[] = [
  // Доходы
  {
    article_code: 'REV_001',
    article_group: 'revenue',
    article_name: 'Плата за обучение',
    subarticle_name: 'Основная программа'
  },
  {
    article_code: 'REV_002',
    article_group: 'revenue',
    article_name: 'Плата за обучение',
    subarticle_name: 'Дополнительные услуги'
  },
  {
    article_code: 'REV_003',
    article_group: 'revenue',
    article_name: 'Бюджетные ассигнования',
    subarticle_name: 'Содержание'
  },
  {
    article_code: 'REV_004',
    article_group: 'revenue',
    article_name: 'Дотации',
    subarticle_name: 'Республиканские'
  },
  {
    article_code: 'REV_005',
    article_group: 'revenue',
    article_name: 'Дотации',
    subarticle_name: 'Местные'
  },

  // Расходы - ФОТ
  {
    article_code: 'EXP_101',
    article_group: 'expenses',
    article_name: 'Фонд оплаты труда',
    subarticle_name: 'Заработная плата'
  },
  {
    article_code: 'EXP_102',
    article_group: 'expenses',
    article_name: 'Фонд оплаты труда',
    subarticle_name: 'Премии'
  },
  {
    article_code: 'EXP_103',
    article_group: 'expenses',
    article_name: 'Фонд оплаты труда',
    subarticle_name: 'Компенсации'
  },
  {
    article_code: 'EXP_104',
    article_group: 'expenses',
    article_name: 'Социальные взносы',
    subarticle_name: 'Социальный налог'
  },
  {
    article_code: 'EXP_105',
    article_group: 'expenses',
    article_name: 'Социальные взносы',
    subarticle_name: 'Пенсионные взносы'
  },
  {
    article_code: 'EXP_106',
    article_group: 'expenses',
    article_name: 'Социальные взносы',
    subarticle_name: 'Медицинское страхование'
  },

  // Расходы - OPEX
  {
    article_code: 'EXP_201',
    article_group: 'expenses',
    article_name: 'Командировки',
    subarticle_name: 'Проезд'
  },
  {
    article_code: 'EXP_202',
    article_group: 'expenses',
    article_name: 'Командировки',
    subarticle_name: 'Проживание'
  },
  {
    article_code: 'EXP_203',
    article_group: 'expenses',
    article_name: 'Командировки',
    subarticle_name: 'Суточные'
  },
  {
    article_code: 'EXP_301',
    article_group: 'expenses',
    article_name: 'Коммунальные услуги',
    subarticle_name: 'Отопление'
  },
  {
    article_code: 'EXP_302',
    article_group: 'expenses',
    article_name: 'Коммунальные услуги',
    subarticle_name: 'Электроэнергия'
  },
  {
    article_code: 'EXP_303',
    article_group: 'expenses',
    article_name: 'Коммунальные услуги',
    subarticle_name: 'Водоснабжение'
  },
  {
    article_code: 'EXP_304',
    article_group: 'expenses',
    article_name: 'Услуги связи',
    subarticle_name: 'Интернет и телефон'
  },
  {
    article_code: 'EXP_401',
    article_group: 'expenses',
    article_name: 'Охрана',
    subarticle_name: 'Услуги охраны'
  },
  {
    article_code: 'EXP_402',
    article_group: 'expenses',
    article_name: 'Уборка',
    subarticle_name: 'Клининговые услуги'
  },
  {
    article_code: 'EXP_501',
    article_group: 'expenses',
    article_name: 'Канцелярия',
    subarticle_name: 'Офисные принадлежности'
  },
  {
    article_code: 'EXP_502',
    article_group: 'expenses',
    article_name: 'Учебные материалы',
    subarticle_name: 'Пособия и оборудование'
  }
];

// Функция инициализации справочников
export async function seedReferenceData() {
  try {
    console.log('Инициализация справочных данных...');

    // Очистка существующих данных
    await db.orgUnits.clear();
    await db.fundingSources.clear();
    await db.articles.clear();

    // Загрузка новых данных
    await db.orgUnits.bulkAdd(seedOrgUnits);
    await db.fundingSources.bulkAdd(seedFundingSources);
    await db.articles.bulkAdd(seedArticles);

    console.log('Справочные данные успешно загружены');
    
    return {
      success: true,
      counts: {
        orgUnits: seedOrgUnits.length,
        fundingSources: seedFundingSources.length,
        articles: seedArticles.length
      }
    };
  } catch (error) {
    console.error('Ошибка при загрузке справочных данных:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Функция получения справочников
export async function getReferenceData() {
  try {
    const [orgUnits, fundingSources, articles] = await Promise.all([
      db.orgUnits.toArray(),
      db.fundingSources.toArray(),
      db.articles.toArray()
    ]);

    return {
      orgUnits,
      fundingSources,
      articles
    };
  } catch (error) {
    console.error('Ошибка при получении справочных данных:', error);
    throw error;
  }
}

// Функции для получения конкретных справочников
export async function getOrgUnits(): Promise<OrgUnit[]> {
  return db.orgUnits.where('status').equals('active').toArray();
}

export async function getFundingSources(): Promise<FundingSource[]> {
  return db.fundingSources.toArray();
}

export async function getArticles(): Promise<Article[]> {
  return db.articles.toArray();
}

// Справочник статей бюджета для доходов
const seedBudgetArticles = [
  {
    article_code: '1.1.1',
    article_name: 'Плата за обучение (ПУ)',
    funding_source: 'PU' as const,
    is_revenue: true,
    is_active: true
  },
  {
    article_code: '1.1.2',
    article_name: 'Дополнительные платные услуги (ПУ)',
    funding_source: 'PU' as const,
    is_revenue: true,
    is_active: true
  },
  {
    article_code: '2.1.1',
    article_name: 'Бюджетное финансирование основной деятельности (РБ)',
    funding_source: 'RB' as const,
    is_revenue: true,
    is_active: true
  },
  {
    article_code: '2.1.2',
    article_name: 'Компенсация стипендиального фонда (РБ)',
    funding_source: 'RB' as const,
    is_revenue: true,
    is_active: true
  },
  {
    article_code: '3.1.1',
    article_name: 'Целевые дотации из местного бюджета (DOTA)',
    funding_source: 'DOTA' as const,
    is_revenue: true,
    is_active: true
  },
  {
    article_code: '3.1.2',
    article_name: 'Гранты и субсидии (DOTA)',
    funding_source: 'DOTA' as const,
    is_revenue: true,
    is_active: true
  }
];

export async function getBudgetArticles(): Promise<BudgetArticle[]> {
  return seedBudgetArticles;
}

export async function getArticlesByGroup(group: 'revenue' | 'expenses'): Promise<Article[]> {
  return db.articles.where('article_group').equals(group).toArray();
}