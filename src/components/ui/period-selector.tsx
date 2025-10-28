'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  yearsRange?: number;
  className?: string;
}

export function PeriodSelector({ 
  value, 
  onChange, 
  yearsRange = 3,
  className 
}: PeriodSelectorProps) {
  
  // Генерация периодов (YYYY-MM)
  const generatePeriods = () => {
    const periods: { value: string; label: string }[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Создаем периоды от (текущий год - yearsRange) до (текущий год + 1)
    for (let year = currentYear - yearsRange; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const periodValue = `${year}-${month.toString().padStart(2, '0')}`;
        const date = new Date(year, month - 1, 1);
        const periodLabel = format(date, 'MMMM yyyy', { locale: undefined });
        
        periods.push({
          value: periodValue,
          label: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)
        });
      }
    }

    // Сортировка от новых к старым
    return periods.reverse();
  };

  const periods = generatePeriods();
  
  // Если значение не выбрано, используем текущий месяц
  const currentPeriod = value || format(new Date(), 'yyyy-MM');

  return (
    <Select value={currentPeriod} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Выберите период" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period) => (
          <SelectItem key={period.value} value={period.value}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Утилитарная функция для форматирования периода
export function formatPeriod(periodYm: string): string {
  try {
    const [year, month] = periodYm.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = format(date, 'MMMM yyyy', { locale: undefined });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return periodYm;
  }
}

// Валидация периода
export function isValidPeriod(periodYm: string): boolean {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return regex.test(periodYm);
}