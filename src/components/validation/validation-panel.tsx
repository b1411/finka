'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Shield,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { businessRules, crossModuleValidator, alertSystem } from '@/lib/validation/business-rules';

interface ValidationPanelProps {
  orgUnitCode?: string;
  selectedPeriod: string;
  onValidationComplete?: (results: ValidationResults) => void;
}

interface ValidationResults {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  infos: ValidationInfo[];
  summary: ValidationSummary;
}

interface ValidationError {
  module: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationWarning {
  module: string;
  message: string;
}

interface ValidationInfo {
  module: string;
  message: string;
}

interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export function ValidationPanel({ orgUnitCode = '', selectedPeriod, onValidationComplete }: ValidationPanelProps) {
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState('validation');

  // Запуск валидации при изменении периода
  useEffect(() => {
    runValidation();
  }, [selectedPeriod, orgUnitCode]);

  // Основная функция валидации
  const runValidation = async () => {
    setIsValidating(true);
    
    try {
      // Загрузка данных из всех модулей (здесь используем моковые данные для демонстрации)
      const mockData = await loadMockData();
      
      // Проведение валидации
      const results = await performValidation(mockData);
      
      setValidationResults(results);
      onValidationComplete?.(results);
    } catch (error) {
      console.error('Ошибка валидации:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Загрузка моковых данных
  const loadMockData = async () => {
    // Имитация загрузки из базы данных
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      contingent: [
        { grade_level: '10', education_profile: 'Естественно-математический', language: 'KAZ', student_count: 28, org_unit_code: orgUnitCode, period_ym: selectedPeriod },
        { grade_level: '11', education_profile: 'Гуманитарный', language: 'RUS', student_count: 12, org_unit_code: orgUnitCode, period_ym: selectedPeriod } // Низкая наполняемость
      ],
      accruals: [
        { funding_source: 'STATE_BUDGET', accrued_amount: 2500000, accrual_date: '2024-12-01', org_unit_code: orgUnitCode },
        { funding_source: 'STATE_BUDGET', accrued_amount: 2500000, accrual_date: '2024-12-01', org_unit_code: orgUnitCode } // Дубликат
      ],
      schedule: [
        { funding_source: 'STATE_BUDGET', planned_amount: 2500000, actual_amount: 2500000, expected_date: '2024-11-15', status: 'OVERDUE' } // Просроченный
      ],
      staffing: [
        { employee_id: 'EMP001', full_name: 'Иванов И.И.', position: 'Учитель', base_salary: 80000, bonus: 20000, total_salary: 100000, employment_status: 'ACTIVE', org_unit_code: orgUnitCode, period_ym: selectedPeriod }, // Зарплата ниже МРЗП
        { employee_id: 'EMP002', full_name: 'Петров П.П.', position: 'Директор', base_salary: 500000, bonus: 50000, total_salary: 550000, employment_status: 'INACTIVE', org_unit_code: orgUnitCode, period_ym: selectedPeriod } // Неактивный с зарплатой
      ],
      trips: [
        { employee_name: 'Иванов И.И.', destination: 'Алматы', start_date: '2024-12-01', end_date: '2024-12-05', total_amount: 85000 },
        { employee_name: 'Иванов И.И.', destination: 'Астана', start_date: '2024-12-03', end_date: '2024-12-07', total_amount: 95000 } // Пересечение дат
      ],
      calculations: [
        { service_name: 'Электроэнергия', calculated_amount: 125000, calculation_date: '2024-12-01' },
        { service_name: 'Электроэнергия', calculated_amount: 120000, calculation_date: '2024-12-15' } // Дубликат за месяц
      ]
    };
  };

  // Выполнение валидации
  const performValidation = async (data: any): Promise<ValidationResults> => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const infos: ValidationInfo[] = [];

    let totalRecords = 0;
    let errorCount = 0;

    // Валидация контингента
    data.contingent.forEach((item: any, index: number) => {
      totalRecords++;
      
      // Проверка количества учеников
      const studentValidation = businessRules.contingent.validateStudentCount(item.student_count, item.grade_level);
      if (!studentValidation.isValid) {
        errors.push({
          module: 'Контингент',
          field: `Класс ${item.grade_level} (строка ${index + 1})`,
          message: studentValidation.error!,
          severity: 'error'
        });
        errorCount++;
      }
      
      // Проверка уникальности (исключая текущую запись)
      const otherRecords = data.contingent.filter((_: any, i: number) => i !== index);
      const uniqueValidation = businessRules.contingent.validateUniqueClass(
        item.grade_level, item.education_profile, item.language, item.org_unit_code, item.period_ym, otherRecords
      );
      if (!uniqueValidation.isValid) {
        errors.push({
          module: 'Контингент',
          field: `Класс ${item.grade_level}`,
          message: uniqueValidation.error!,
          severity: 'error'
        });
        errorCount++;
      }
    });

    // Валидация начислений
    data.accruals.forEach((item: any, index: number) => {
      totalRecords++;
      
      const otherRecords = data.accruals.filter((_: any, i: number) => i !== index);
      const accrualValidation = businessRules.revenue.validateAccrual(
        item.accrued_amount, item.funding_source, item.accrual_date, item.org_unit_code, otherRecords
      );
      if (!accrualValidation.isValid) {
        errors.push({
          module: 'Доходы',
          field: `Начисление ${index + 1}`,
          message: accrualValidation.error!,
          severity: 'error'
        });
        errorCount++;
      }
    });

    // Валидация персонала
    data.staffing.forEach((item: any, index: number) => {
      totalRecords++;
      
      const otherRecords = data.staffing.filter((_: any, i: number) => i !== index);
      const staffValidation = businessRules.staffing.validateEmployee(
        item.employee_id, item.full_name, item.position, item.base_salary, item.bonus, item.org_unit_code, item.period_ym, otherRecords
      );
      if (!staffValidation.isValid) {
        errors.push({
          module: 'Персонал',
          field: `Сотрудник ${item.employee_id}`,
          message: staffValidation.error!,
          severity: 'error'
        });
        errorCount++;
      }
    });

    // Валидация командировок
    data.trips.forEach((item: any, index: number) => {
      totalRecords++;
      
      const otherRecords = data.trips.filter((_: any, i: number) => i !== index);
      const tripValidation = businessRules.opex.validateTrip(
        item.employee_name, item.destination, item.start_date, item.end_date, item.total_amount, otherRecords
      );
      if (!tripValidation.isValid) {
        errors.push({
          module: 'OPEX',
          field: `Командировка ${index + 1}`,
          message: tripValidation.error!,
          severity: 'error'
        });
        errorCount++;
      }
    });

    // Кросс-модульная валидация
    const revenueVsContingent = crossModuleValidator.validateRevenueVsContingent(data.contingent, data.accruals, selectedPeriod);
    if (!revenueVsContingent.isValid) {
      warnings.push({
        module: 'Кросс-проверка',
        message: revenueVsContingent.warning!
      });
    }

    const staffingVsContingent = crossModuleValidator.validateStaffingVsContingent(data.contingent, data.staffing);
    if (!staffingVsContingent.isValid) {
      warnings.push({
        module: 'Кросс-проверка',
        message: staffingVsContingent.warning!
      });
    }

    const budgetBalance = crossModuleValidator.validateBudgetBalance(data.accruals, data.staffing, data.trips, data.calculations);
    if (!budgetBalance.isValid) {
      if (budgetBalance.error) {
        errors.push({
          module: 'Бюджет',
          field: 'Баланс',
          message: budgetBalance.error,
          severity: 'error'
        });
        errorCount++;
      }
      if (budgetBalance.warning) {
        warnings.push({
          module: 'Бюджет',
          message: budgetBalance.warning
        });
      }
    } else if (budgetBalance.message) {
      infos.push({
        module: 'Бюджет',
        message: budgetBalance.message
      });
    }

    // Системные предупреждения
    const systemAlerts = alertSystem.checkCriticalAlerts(data);
    systemAlerts.forEach(alert => {
      if (alert.type === 'error') {
        errors.push({
          module: 'Система',
          field: 'Предупреждение',
          message: alert.message,
          severity: 'error'
        });
        errorCount++;
      } else if (alert.type === 'warning') {
        warnings.push({
          module: 'Система',
          message: alert.message
        });
      } else {
        infos.push({
          module: 'Система',
          message: alert.message
        });
      }
    });

    return {
      isValid: errorCount === 0,
      errors,
      warnings,
      infos,
      summary: {
        totalRecords,
        validRecords: totalRecords - errorCount,
        errorCount,
        warningCount: warnings.length,
        infoCount: infos.length
      }
    };
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Валидация и бизнес-правила</h2>
          <p className="text-gray-600 mt-1">
            Проверка целостности данных и соблюдения бизнес-логики
          </p>
        </div>
        
        <Button onClick={runValidation} disabled={isValidating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
          {isValidating ? 'Проверка...' : 'Обновить'}
        </Button>
      </div>

      {/* Сводка валидации */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {validationResults.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
              )}
              Результаты валидации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{validationResults.summary.totalRecords}</div>
                <div className="text-sm text-gray-600">Всего записей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validationResults.summary.validRecords}</div>
                <div className="text-sm text-gray-600">Валидных</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{validationResults.summary.errorCount}</div>
                <div className="text-sm text-gray-600">Ошибок</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{validationResults.summary.warningCount}</div>
                <div className="text-sm text-gray-600">Предупреждений</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{validationResults.summary.infoCount}</div>
                <div className="text-sm text-gray-600">Уведомлений</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Детали валидации */}
      {validationResults && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="validation">
              <AlertCircle className="h-4 w-4 mr-2" />
              Валидация
            </TabsTrigger>
            <TabsTrigger value="errors">
              Ошибки ({validationResults.summary.errorCount})
            </TabsTrigger>
            <TabsTrigger value="warnings">
              Предупреждения ({validationResults.summary.warningCount})
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Settings className="h-4 w-4 mr-2" />
              Правила
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="space-y-4">
            {/* Все проблемы в одном списке */}
            <Card>
              <CardHeader>
                <CardTitle>Детали проверки</CardTitle>
                <CardDescription>Все выявленные проблемы и уведомления</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResults.errors.map((error, index) => (
                    <Alert key={`error-${index}`} className={`border ${getSeverityColor(error.severity)}`}>
                      <AlertDescription className="flex items-center">
                        {getSeverityIcon(error.severity)}
                        <div className="ml-3">
                          <div className="font-medium">{error.module} - {error.field}</div>
                          <div className="text-sm">{error.message}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {validationResults.warnings.map((warning, index) => (
                    <Alert key={`warning-${index}`} className="border bg-yellow-50 border-yellow-200">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription>
                        <div className="font-medium">{warning.module}</div>
                        <div className="text-sm">{warning.message}</div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {validationResults.infos.map((info, index) => (
                    <Alert key={`info-${index}`} className="border bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertDescription>
                        <div className="font-medium">{info.module}</div>
                        <div className="text-sm">{info.message}</div>
                      </AlertDescription>
                    </Alert>
                  ))}
                  
                  {validationResults.errors.length === 0 && validationResults.warnings.length === 0 && validationResults.infos.length === 0 && (
                    <Alert className="border bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        Все данные прошли валидацию успешно. Нарушений бизнес-правил не обнаружено.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Критические ошибки</CardTitle>
                <CardDescription>Ошибки, требующие немедленного исправления</CardDescription>
              </CardHeader>
              <CardContent>
                {validationResults.errors.length > 0 ? (
                  <div className="space-y-3">
                    {validationResults.errors.map((error, index) => (
                      <div key={index} className="border-l-4 border-red-500 bg-red-50 p-4">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-500 mr-3" />
                          <div>
                            <Badge variant="destructive" className="mb-2">{error.module}</Badge>
                            <div className="font-medium">{error.field}</div>
                            <div className="text-sm text-red-700">{error.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Критических ошибок не найдено</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-700">Предупреждения</CardTitle>
                <CardDescription>Рекомендации по улучшению данных</CardDescription>
              </CardHeader>
              <CardContent>
                {validationResults.warnings.length > 0 ? (
                  <div className="space-y-3">
                    {validationResults.warnings.map((warning, index) => (
                      <div key={index} className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                          <div>
                            <Badge variant="secondary" className="mb-2 bg-yellow-100 text-yellow-800">{warning.module}</Badge>
                            <div className="text-sm text-yellow-700">{warning.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Предупреждений нет</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Действующие бизнес-правила
                </CardTitle>
                <CardDescription>Конфигурация системы валидации</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-700">Контингент</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Максимум учеников в классе: {businessRules.contingent.maxStudentsPerClass}</li>
                      <li>• Минимум для открытия класса: {businessRules.contingent.minStudentsPerClass}</li>
                      <li>• Уникальность: класс + профиль + язык</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-green-700">Доходы</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Максимум начисления: {businessRules.revenue.maxAccrualAmount.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Минимум начисления: {businessRules.revenue.minAccrualAmount.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Проверка дубликатов по дате и источнику</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-purple-700">Персонал</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Максимальная зарплата: {businessRules.staffing.maxSalary.toLocaleString('ru-KZ')} ₸</li>
                      <li>• МРЗП: {businessRules.staffing.minSalary.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Социальный налог: {(businessRules.staffing.socialTaxRate * 100).toFixed(1)}%</li>
                      <li>• Пенсионные взносы: {(businessRules.staffing.pensionRate * 100).toFixed(1)}%</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-700">OPEX</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Максимум командировки: {businessRules.opex.maxTripAmount.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Суточные внутри страны: {businessRules.opex.dailyAllowanceRates.domestic.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Суточные международные: {businessRules.opex.dailyAllowanceRates.international.toLocaleString('ru-KZ')} ₸</li>
                      <li>• Максимум дней: {businessRules.opex.maxTripDays}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}