'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Shield, 
  Database, 
  FileSpreadsheet,
  Zap,
  Globe,
  Calendar,
  Award,
  Target,
  BarChart3
} from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const systemStats = {
    version: '1.0.0',
    buildDate: '2024-12-23',
    totalUsers: 847,
    activeSchools: 12,
    modules: 8,
    reports: 6,
    uptime: 99.9,
    dataPoints: 15420
  };

  const features = [
    {
      title: 'Управление контингентом',
      description: 'Учет учащихся, классов, начислений и платежей',
      icon: Users,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'Фонд оплаты труда (ФОТ)',
      description: 'Штатное расписание, тарификация, премии и налоги',
      icon: TrendingUp,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'Операционные расходы (OPEX)',
      description: 'Командировки, коммунальные услуги и прочие расходы',
      icon: BarChart3,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'Система отчетов',
      description: 'Excel/PDF экспорт с настраиваемыми параметрами',
      icon: FileSpreadsheet,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'KPI Dashboard',
      description: 'Ключевые показатели эффективности в реальном времени',
      icon: Target,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'Валидация данных',
      description: 'Комплексная проверка качества и бизнес-правил',
      icon: Shield,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'База данных',
      description: 'Структурированное хранение с IndexedDB',
      icon: Database,
      status: 'Реализовано',
      completion: 100
    },
    {
      title: 'Роли и доступы',
      description: 'Система ролей для разных уровней доступа',
      icon: Users,
      status: 'Реализовано',
      completion: 100
    }
  ];

  const architecture = [
    {
      layer: 'Frontend',
      technology: 'Next.js 16.0, TypeScript, Tailwind CSS',
      description: 'Современный React-фреймворк с серверными компонентами'
    },
    {
      layer: 'UI Components',
      technology: 'shadcn/ui + Radix UI',
      description: 'Доступные и настраиваемые UI компоненты'
    },
    {
      layer: 'Database',
      technology: 'Dexie.js + IndexedDB',
      description: 'Клиентская база данных с поддержкой сложных запросов'
    },
    {
      layer: 'Export System',
      technology: 'xlsx + jsPDF',
      description: 'Экспорт данных в Excel и PDF форматы'
    },
    {
      layer: 'Validation',
      technology: 'Zod + Custom Rules',
      description: 'Валидация данных и бизнес-логики'
    }
  ];

  const roadmap = [
    {
      phase: 'MVP (Текущий)',
      status: 'Завершен',
      date: 'Q4 2024',
      features: ['Базовые модули', 'Отчеты', 'Валидация', 'KPI']
    },
    {
      phase: 'Расширение функционала',
      status: 'Планируется',
      date: 'Q1 2025',
      features: ['Интеграция с внешними API', 'Расширенная аналитика', 'Мобильная версия']
    },
    {
      phase: 'Оптимизация',
      status: 'Планируется',
      date: 'Q2 2025',
      features: ['Производительность', 'Кэширование', 'Офлайн режим']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">О системе ФИНКА</h1>
          <p className="text-gray-600 mt-2">
            Информация о системе, архитектуре и функциональности
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'overview', label: 'Обзор' },
            { id: 'features', label: 'Функции' },
            { id: 'architecture', label: 'Архитектура' },
            { id: 'roadmap', label: 'Roadmap' }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className="mb-2"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Версия системы</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">{systemStats.version}</div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Дата сборки</CardTitle>
                  <div className="text-2xl font-bold text-green-600">{systemStats.buildDate}</div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Время работы</CardTitle>
                  <div className="text-2xl font-bold text-emerald-600">{systemStats.uptime}%</div>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Активных школ</CardTitle>
                  <div className="text-2xl font-bold text-purple-600">{systemStats.activeSchools}</div>
                </CardHeader>
              </Card>
            </div>

            {/* System Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  ФИНКА - Финансовый модуль РФМШ
                </CardTitle>
                <CardDescription>
                  Комплексная система управления финансами образовательных учреждений
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 mb-4">
                    ФИНКА представляет собой современную веб-платформу для управления финансовыми процессами 
                    в Республиканском физико-математическом лицее имени Ш. Есенова. Система обеспечивает 
                    полный цикл планирования, учета и контроля финансовых операций.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Основные возможности:</h4>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Управление контингентом и доходами</li>
                        <li>• Планирование и учет ФОТ</li>
                        <li>• Контроль операционных расходов</li>
                        <li>• Формирование отчетов и аналитики</li>
                        <li>• Валидация и контроль качества данных</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Технические преимущества:</h4>
                      <ul className="space-y-1 text-gray-700">
                        <li>• Современный веб-интерфейс</li>
                        <li>• Работа без подключения к интернету</li>
                        <li>• Экспорт в Excel и PDF</li>
                        <li>• Система ролей и доступов</li>
                        <li>• Валидация бизнес-правил</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <feature.icon className="w-5 h-5 mr-2 text-blue-500" />
                      {feature.title}
                    </div>
                    <Badge 
                      variant={feature.status === 'Реализовано' ? 'default' : 'secondary'}
                      className={feature.status === 'Реализовано' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {feature.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Готовность</span>
                      <span>{feature.completion}%</span>
                    </div>
                    <Progress value={feature.completion} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Architecture Tab */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-500" />
                  Технологический стек
                </CardTitle>
                <CardDescription>
                  Современные технологии для надежной и производительной работы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {architecture.map((layer, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-gray-900">{layer.layer}</h4>
                        <Badge variant="outline">{layer.technology}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{layer.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-green-500" />
                  Архитектурные принципы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">Модульность</h5>
                        <p className="text-sm text-gray-600">Независимые модули с четкими границами</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">Типизация</h5>
                        <p className="text-sm text-gray-600">Полная типизация с TypeScript</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">Валидация</h5>
                        <p className="text-sm text-gray-600">Многоуровневая система проверок</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">Производительность</h5>
                        <p className="text-sm text-gray-600">Оптимизация рендеринга и загрузки</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">Безопасность</h5>
                        <p className="text-sm text-gray-600">Контроль доступа и валидация данных</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-medium">UX/UI</h5>
                        <p className="text-sm text-gray-600">Интуитивный интерфейс и отзывчивость</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {roadmap.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                      {phase.phase}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={phase.status === 'Завершен' ? 'default' : 'secondary'}
                        className={phase.status === 'Завершен' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {phase.status}
                      </Badge>
                      <span className="text-sm text-gray-500">{phase.date}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        {phase.status === 'Завершен' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                        )}
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            ФИНКА v{systemStats.version} • Разработано для РФМШ им. Ш. Есенова • {systemStats.buildDate}
          </p>
        </div>
      </div>
    </div>
  );
}