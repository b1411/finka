'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  DollarSign,
  Calculator,
  PieChart,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  format: 'currency' | 'number' | 'percentage';
  category: 'financial' | 'operational' | 'performance';
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'good' | 'warning' | 'critical';
}

interface KPIDashboardProps {
  orgUnitCode?: string;
  selectedPeriod: string;
  onMetricClick?: (metric: KPIMetric) => void;
}

export function KPIDashboard({ orgUnitCode = '', selectedPeriod, onMetricClick }: KPIDashboardProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadKPIMetrics = async () => {
    setIsLoading(true);
    
    // Имитация загрузки данных
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Генерация демонстрационных KPI
    const mockMetrics: KPIMetric[] = [
      {
        id: 'total-students',
        name: 'Общий контингент',
        value: 847,
        previousValue: 825,
        target: 900,
        unit: 'чел.',
        format: 'number',
        category: 'operational',
        description: 'Общее количество учащихся в текущем периоде',
        trend: 'up',
        status: 'good'
      },
      {
        id: 'total-revenue',
        name: 'Общие доходы',
        value: 425600000,
        previousValue: 398500000,
        target: 450000000,
        unit: '₸',
        format: 'currency',
        category: 'financial',
        description: 'Общая сумма доходов за текущий период',
        trend: 'up',
        status: 'good'
      },
      {
        id: 'salary-expenses',
        name: 'Расходы на ФОТ',
        value: 285400000,
        previousValue: 278900000,
        target: 300000000,
        unit: '₸',
        format: 'currency',
        category: 'financial',
        description: 'Общий фонд оплаты труда',
        trend: 'up',
        status: 'warning'
      },
      {
        id: 'opex',
        name: 'Операционные расходы',
        value: 45200000,
        previousValue: 52800000,
        target: 40000000,
        unit: '₸',
        format: 'currency',
        category: 'financial',
        description: 'Общие операционные расходы (OPEX)',
        trend: 'down',
        status: 'critical'
      },
      {
        id: 'profit-margin',
        name: 'Рентабельность',
        value: 22.3,
        previousValue: 16.8,
        target: 25.0,
        unit: '%',
        format: 'percentage',
        category: 'performance',
        description: 'Чистая прибыль в процентах от доходов',
        trend: 'up',
        status: 'good'
      },
      {
        id: 'revenue-per-student',
        name: 'Доход на ученика',
        value: 502600,
        previousValue: 483000,
        target: 500000,
        unit: '₸',
        format: 'currency',
        category: 'performance',
        description: 'Средний доход в расчете на одного ученика',
        trend: 'up',
        status: 'good'
      },
      {
        id: 'staff-count',
        name: 'Количество сотрудников',
        value: 89,
        previousValue: 92,
        target: 85,
        unit: 'чел.',
        format: 'number',
        category: 'operational',
        description: 'Общее количество активных сотрудников',
        trend: 'down',
        status: 'good'
      },
      {
        id: 'student-teacher-ratio',
        name: 'Соотношение ученик/учитель',
        value: 14.2,
        previousValue: 13.8,
        target: 15.0,
        unit: ':1',
        format: 'number',
        category: 'operational',
        description: 'Количество учеников на одного преподавателя',
        trend: 'up',
        status: 'good'
      },
      {
        id: 'budget-execution',
        name: 'Исполнение бюджета',
        value: 94.5,
        previousValue: 87.2,
        target: 95.0,
        unit: '%',
        format: 'percentage',
        category: 'performance',
        description: 'Процент исполнения запланированного бюджета',
        trend: 'up',
        status: 'good'
      }
    ];
    
    setMetrics(mockMetrics);
    setIsLoading(false);
  };

  useEffect(() => {
    loadKPIMetrics();
  }, [selectedPeriod, orgUnitCode]);

  const formatValue = (value: number, format: KPIMetric['format'], unit: string) => {
    switch (format) {
      case 'currency':
        return `${Math.round(value).toLocaleString('ru-KZ')} ${unit}`;
      case 'percentage':
        return `${value.toFixed(1)}${unit}`;
      case 'number':
        return `${Math.round(value).toLocaleString('ru-KZ')} ${unit}`;
      default:
        return `${value} ${unit}`;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="h-5 w-5" />;
      case 'operational': return <Users className="h-5 w-5" />;
      case 'performance': return <BarChart3 className="h-5 w-5" />;
      default: return <Calculator className="h-5 w-5" />;
    }
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'Все KPI', icon: <PieChart className="h-4 w-4" /> },
    { value: 'financial', label: 'Финансовые', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'operational', label: 'Операционные', icon: <Users className="h-4 w-4" /> },
    { value: 'performance', label: 'Эффективность', icon: <BarChart3 className="h-4 w-4" /> }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            Загрузка KPI метрик...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPI Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Ключевые показатели эффективности за {selectedPeriod}
          </p>
        </div>
        
        <Button onClick={loadKPIMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Фильтры по категориям */}
      <div className="flex space-x-2 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            {category.icon}
            <span>{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Сетка KPI метрик */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <Card
            key={metric.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              onMetricClick ? 'hover:scale-105' : ''
            }`}
            onClick={() => onMetricClick?.(metric)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(metric.category)}
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(metric.trend)}
                  {getStatusIcon(metric.status)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Основное значение */}
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatValue(metric.value, metric.format, metric.unit)}
              </div>

              {/* Сравнение с предыдущим периодом */}
              {metric.previousValue !== undefined && (
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <span className="text-gray-500">Пред. период:</span>
                  <span>{formatValue(metric.previousValue, metric.format, metric.unit)}</span>
                  <Badge 
                    variant="outline" 
                    className={
                      metric.value > metric.previousValue 
                        ? 'text-green-600 border-green-200' 
                        : 'text-red-600 border-red-200'
                    }
                  >
                    {metric.value > metric.previousValue ? '+' : ''}
                    {(((metric.value - metric.previousValue) / metric.previousValue) * 100).toFixed(1)}%
                  </Badge>
                </div>
              )}

              {/* Целевое значение */}
              {metric.target !== undefined && (
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Цель:</span>
                  <span>{formatValue(metric.target, metric.format, metric.unit)}</span>
                </div>
              )}

              {/* Статус */}
              {metric.status && (
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status === 'good' && 'В норме'}
                  {metric.status === 'warning' && 'Требует внимания'}
                  {metric.status === 'critical' && 'Критично'}
                </Badge>
              )}

              {/* Описание */}
              <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Сводка по категориям */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['financial', 'operational', 'performance'].map((category) => {
          const categoryMetrics = metrics.filter(m => m.category === category);
          const goodCount = categoryMetrics.filter(m => m.status === 'good').length;
          const warningCount = categoryMetrics.filter(m => m.status === 'warning').length;
          const criticalCount = categoryMetrics.filter(m => m.status === 'critical').length;
          
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-sm">
                  {getCategoryIcon(category)}
                  <span className="ml-2">
                    {category === 'financial' && 'Финансовые'}
                    {category === 'operational' && 'Операционные'}
                    {category === 'performance' && 'Эффективность'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Всего KPI:</span>
                    <span className="font-semibold">{categoryMetrics.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">В норме:</span>
                    <span className="font-semibold text-green-600">{goodCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-600">Предупреждения:</span>
                    <span className="font-semibold text-yellow-600">{warningCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">Критичные:</span>
                    <span className="font-semibold text-red-600">{criticalCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}