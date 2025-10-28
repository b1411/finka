'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface GlobalProgressBarProps {
  show: boolean;
  progress?: number;
  message?: string;
}

export function GlobalProgressBar({ show, progress = 0, message = 'Загрузка...' }: GlobalProgressBarProps) {
  // Используем прямое значение progress вместо состояния
  const displayProgress = show ? progress : 0;

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{message}</span>
          <span className="text-sm text-gray-500">{Math.round(displayProgress)}%</span>
        </div>
        <Progress value={displayProgress} className="h-2" />
      </div>
    </div>
  );
}

// Компонент для отображения статистики системы
interface SystemStatsProps {
  className?: string;
}

export function SystemStats({ className = '' }: SystemStatsProps) {
  const stats = {
    totalUsers: 847,
    activeSchools: 12,
    totalRevenue: 5200000000,
    totalExpenses: 4680000000,
    profitMargin: 10.0,
    dataQuality: 94.5
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика системы</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString('ru-KZ')}</div>
          <div className="text-xs text-gray-600">Всего учащихся</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeSchools}</div>
          <div className="text-xs text-gray-600">Активных школ</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">{(stats.totalRevenue / 1000000).toFixed(1)}M ₸</div>
          <div className="text-xs text-gray-600">Общие доходы</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">{(stats.totalExpenses / 1000000).toFixed(1)}M ₸</div>
          <div className="text-xs text-gray-600">Общие расходы</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.profitMargin.toFixed(1)}%</div>
          <div className="text-xs text-gray-600">Рентабельность</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-600">{stats.dataQuality.toFixed(1)}%</div>
          <div className="text-xs text-gray-600">Качество данных</div>
        </div>
      </div>
    </div>
  );
}

// Быстрые действия в sidebar
interface QuickActionsProps {
  userRole: string;
  className?: string;
}

export function QuickActions({ userRole, className = '' }: QuickActionsProps) {
  const getQuickActions = () => {
    const baseActions = [
      { label: 'KPI Dashboard', icon: '📊', href: '/kpi', color: 'bg-blue-100 text-blue-700' },
      { label: 'Отчеты', icon: '📈', href: '/reports', color: 'bg-green-100 text-green-700' }
    ];

    const roleActions = {
      'branch_economist': [
        { label: 'Доходы', icon: '💰', href: '/branch/revenue', color: 'bg-emerald-100 text-emerald-700' },
        { label: 'Валидация', icon: '✅', href: '/validation', color: 'bg-purple-100 text-purple-700' }
      ],
      'branch_accountant': [
        { label: 'ФОТ', icon: '👥', href: '/branch/payroll', color: 'bg-indigo-100 text-indigo-700' },
        { label: 'OPEX', icon: '🏢', href: '/branch/opex', color: 'bg-orange-100 text-orange-700' }
      ],
      'hq_chief_economist': [
        { label: 'Планирование', icon: '📋', href: '/hq/planning', color: 'bg-pink-100 text-pink-700' },
        { label: 'Консолидация', icon: '🔄', href: '/hq/dashboard', color: 'bg-cyan-100 text-cyan-700' }
      ]
    };

    return [...baseActions, ...(roleActions[userRole as keyof typeof roleActions] || [])];
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
      <div className="space-y-2">
        {getQuickActions().map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors hover:shadow-md ${action.color}`}
          >
            <span className="text-lg">{action.icon}</span>
            <span className="font-medium">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// Уведомления в реальном времени
export function RealTimeNotifications() {
  const [notifications] = useState(() => {
    const now = Date.now();
    return [
      {
        id: 1,
        type: 'info' as const,
        message: 'Данные за декабрь 2024 обновлены',
        timestamp: new Date(now - 5 * 60 * 1000)
      },
      {
        id: 2,
        type: 'warning' as const,
        message: 'Обнаружены расхождения в отчете школы №7',
        timestamp: new Date(now - 15 * 60 * 1000)
      },
      {
        id: 3,
        type: 'success' as const,
        message: 'Валидация данных успешно завершена',
        timestamp: new Date(now - 30 * 60 * 1000)
      }
    ];
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      default: return 'border-l-blue-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'только что';
    if (diff < 60) return `${diff} мин. назад`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ч. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Уведомления</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border-l-4 bg-gray-50 p-3 rounded-r-lg ${getNotificationColor(notification.type)}`}
          >
            <div className="flex items-start space-x-2">
              <span className="shrink-0">{getNotificationIcon(notification.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Хелпер для форматирования чисел в различных локалях
export function formatNumber(value: number, type: 'currency' | 'number' | 'percentage' = 'number', locale = 'ru-KZ') {
  switch (type) {
    case 'currency':
      return `${Math.round(value).toLocaleString(locale)} ₸`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
      return Math.round(value).toLocaleString(locale);
    default:
      return value.toString();
  }
}

// Хук для автосохранения данных форм
export function useAutoSave<T>(data: T, onSave: (data: T) => Promise<void>, delay = 2000) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data) {
        setIsSaving(true);
        try {
          await onSave(data);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Ошибка автосохранения:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data, onSave, delay]);

  return { isSaving, lastSaved };
}

// Компонент индикатора автосохранения
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function AutoSaveIndicator({ isSaving, lastSaved }: AutoSaveIndicatorProps) {
  if (isSaving) {
    return (
      <div className="flex items-center text-xs text-blue-600">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
        Сохранение...
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="text-xs text-green-600">
        ✓ Сохранено в {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
      </div>
    );
  }

  return null;
}