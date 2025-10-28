'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Building2, 
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  BarChart3
} from 'lucide-react';
import { ExcelExporter } from '@/lib/export/excel-exporter';
import { PDFExporter } from '@/lib/export/pdf-exporter';

interface ReportsSystemProps {
  orgUnitCode?: string;
  selectedPeriod: string;
}

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'financial' | 'operational' | 'consolidated';
  formats: ('excel' | 'pdf')[];
  modules: string[];
}

const AVAILABLE_REPORTS: ReportConfig[] = [
  {
    id: 'contingent',
    title: 'Отчет по контингенту',
    description: 'Численность учащихся, заполненность классов, анализ по профилям обучения',
    icon: <Users className="h-5 w-5" />,
    category: 'operational',
    formats: ['excel', 'pdf'],
    modules: ['contingent']
  },
  {
    id: 'revenue',
    title: 'Отчет по доходам',
    description: 'Начисления, кассовый план, источники финансирования',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'financial',
    formats: ['excel', 'pdf'],
    modules: ['accruals', 'schedule']
  },
  {
    id: 'staffing',
    title: 'Отчет по персоналу',
    description: 'Штатное расписание, фонд оплаты труда, структура персонала',
    icon: <Building2 className="h-5 w-5" />,
    category: 'operational',
    formats: ['excel', 'pdf'],
    modules: ['staffing']
  },
  {
    id: 'opex',
    title: 'Отчет по операционным расходам',
    description: 'Командировки, коммунальные услуги, прочие операционные затраты',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'financial',
    formats: ['excel', 'pdf'],
    modules: ['trips', 'calculations']
  },
  {
    id: 'financial-summary',
    title: 'Финансовая сводка',
    description: 'P&L отчет, основные финансовые KPI, структура доходов и расходов',
    icon: <PieChart className="h-5 w-5" />,
    category: 'consolidated',
    formats: ['excel', 'pdf'],
    modules: ['accruals', 'schedule', 'staffing', 'trips', 'calculations']
  },
  {
    id: 'consolidated',
    title: 'Консолидированный отчет',
    description: 'Полный отчет по всем модулям системы с аналитикой и KPI',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'consolidated',
    formats: ['excel', 'pdf'],
    modules: ['contingent', 'accruals', 'schedule', 'staffing', 'trips', 'calculations']
  }
];

export function ReportsSystem({ orgUnitCode = '', selectedPeriod }: ReportsSystemProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf'>('excel');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([selectedPeriod]);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  // Фильтры отчетов
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredReports = AVAILABLE_REPORTS.filter(report => 
    categoryFilter === 'all' || report.category === categoryFilter
  );

  // Генерация отчета
  const generateReport = async (report: ReportConfig, format: 'excel' | 'pdf', periods: string[]) => {
    setIsLoading(report.id);

    try {
      // Здесь будет загрузка данных из репозиториев
      // Для демонстрации используем моковые данные
      const mockData = await generateMockData(report, periods);

      // Генерация отчета в зависимости от типа
      switch (report.id) {
        case 'contingent':
          if (format === 'excel') {
            ExcelExporter.exportContingentReport(mockData.contingent, periods[0], orgUnitCode);
          } else {
            PDFExporter.exportContingentReportPDF(mockData.contingent, periods[0], orgUnitCode);
          }
          break;

        case 'revenue':
          if (format === 'excel') {
            ExcelExporter.exportRevenueReport(mockData.accruals, mockData.schedule, periods[0], orgUnitCode);
          } else {
            PDFExporter.exportRevenueReportPDF(mockData.accruals, mockData.schedule, periods[0], orgUnitCode);
          }
          break;

        case 'staffing':
          if (format === 'excel') {
            ExcelExporter.exportStaffingReport(mockData.staffing, periods[0], orgUnitCode);
          } else {
            PDFExporter.exportStaffingReportPDF(mockData.staffing, periods[0], orgUnitCode);
          }
          break;

        case 'opex':
          if (format === 'excel') {
            ExcelExporter.exportOpexReport(mockData.trips, mockData.calculations, [], periods[0], orgUnitCode);
          } else {
            PDFExporter.exportOpexReportPDF(mockData.trips, mockData.calculations, periods[0], orgUnitCode);
          }
          break;

        case 'consolidated':
          if (format === 'excel') {
            ExcelExporter.exportConsolidatedReport(mockData, periods[0], orgUnitCode);
          } else {
            PDFExporter.exportConsolidatedReportPDF(mockData, periods[0], orgUnitCode);
          }
          break;

        default:
          throw new Error('Неизвестный тип отчета');
      }

      console.log(`Отчет ${report.title} успешно сгенерирован в формате ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
      alert('Ошибка при генерации отчета. Проверьте консоль для деталей.');
    } finally {
      setIsLoading(null);
    }
  };

  // Генерация моковых данных для демонстрации
  const generateMockData = async (report: ReportConfig, periods: string[]) => {
    // Имитация задержки загрузки
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      contingent: [
        { grade_level: '1', education_profile: 'Общий', language: 'KAZ', student_count: 28, planned_count: 30 },
        { grade_level: '2', education_profile: 'Общий', language: 'RUS', student_count: 25, planned_count: 30 },
        { grade_level: '3', education_profile: 'Углубленный', language: 'KAZ', student_count: 22, planned_count: 25 }
      ],
      accruals: [
        { funding_source: 'STATE_BUDGET', funding_source_name: 'Государственный бюджет', accrued_amount: 2500000, accrual_date: '2024-12-01', status: 'CONFIRMED' },
        { funding_source: 'PAID_SERVICES', funding_source_name: 'Платные услуги', accrued_amount: 850000, accrual_date: '2024-12-05', status: 'CONFIRMED' }
      ],
      schedule: [
        { expected_date: '2024-12-10', funding_source: 'STATE_BUDGET', funding_source_name: 'Государственный бюджет', planned_amount: 2500000, actual_amount: 2500000, status: 'RECEIVED' },
        { expected_date: '2024-12-15', funding_source: 'PAID_SERVICES', funding_source_name: 'Платные услуги', planned_amount: 850000, actual_amount: 0, status: 'PENDING' }
      ],
      staffing: [
        { employee_id: 'EMP001', full_name: 'Иванов Иван Иванович', position: 'Учитель математики', department: 'Учебная часть', employment_type: 'FULL_TIME', base_salary: 350000, bonus: 50000, allowances: 25000, deductions: 15000, total_salary: 410000, employment_status: 'ACTIVE' },
        { employee_id: 'EMP002', full_name: 'Петрова Мария Сергеевна', position: 'Директор', department: 'Администрация', employment_type: 'FULL_TIME', base_salary: 500000, bonus: 100000, allowances: 50000, deductions: 25000, total_salary: 625000, employment_status: 'ACTIVE' }
      ],
      trips: [
        { employee_name: 'Иванов И.И.', destination: 'Алматы', purpose: 'Повышение квалификации', start_date: '2024-12-10', end_date: '2024-12-12', total_amount: 85000, status: 'APPROVED' }
      ],
      calculations: [
        { calculation_type: 'UTILITIES_PU', service_name: 'Электроэнергия', calculation_method: 'По показаниям ПУ', calculation_date: '2024-12-01', calculated_amount: 125000, status: 'APPROVED', responsible_person: 'Сидоров П.П.' }
      ]
    };
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'consolidated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'financial': return 'Финансовые';
      case 'operational': return 'Операционные';
      case 'consolidated': return 'Сводные';
      default: return 'Все';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Система отчетности</h2>
          <p className="text-gray-600 mt-1">
            Генерация аналитических отчетов и экспорт данных
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Период: {selectedPeriod}</span>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="category-filter" className="text-sm font-medium">
              Категория отчетов:
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="financial">Финансовые</SelectItem>
                <SelectItem value="operational">Операционные</SelectItem>
                <SelectItem value="consolidated">Сводные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список отчетов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {report.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge className={`mt-1 ${getCategoryBadgeColor(report.category)}`}>
                      {getCategoryName(report.category)}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-2">
                {report.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Форматы:</span>
                  {report.formats.includes('excel') && (
                    <Badge variant="outline" className="text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Badge>
                  )}
                  {report.formats.includes('pdf') && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Badge>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedReport(report)}
                      disabled={isLoading === report.id}
                    >
                      {isLoading === report.id ? (
                        <>Генерация...</>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Сгенерировать
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Генерация отчета</DialogTitle>
                      <DialogDescription>
                        Настройте параметры для генерации отчета "{report.title}"
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="format">Формат файла</Label>
                        <Select value={selectedFormat} onValueChange={(value: 'excel' | 'pdf') => setSelectedFormat(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {report.formats.includes('excel') && (
                              <SelectItem value="excel">
                                <div className="flex items-center">
                                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                                  Excel (.xlsx)
                                </div>
                              </SelectItem>
                            )}
                            {report.formats.includes('pdf') && (
                              <SelectItem value="pdf">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  PDF (.pdf)
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="include-summary" 
                            checked={includeSummary}
                            onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                          />
                          <Label htmlFor="include-summary" className="text-sm">
                            Включить сводную информацию
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="include-charts" 
                            checked={includeCharts}
                            onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                          />
                          <Label htmlFor="include-charts" className="text-sm">
                            Включить диаграммы (только PDF)
                          </Label>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <DialogTrigger asChild>
                          <Button variant="outline">Отмена</Button>
                        </DialogTrigger>
                        <Button 
                          onClick={() => {
                            if (selectedReport) {
                              generateReport(selectedReport, selectedFormat, selectedPeriods);
                            }
                          }}
                          disabled={isLoading !== null}
                        >
                          {isLoading ? 'Генерация...' : 'Создать отчет'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика генерации */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Статистика системы отчетности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{AVAILABLE_REPORTS.length}</div>
              <div className="text-sm text-gray-600">Доступно отчетов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-gray-600">Формата экспорта</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{AVAILABLE_REPORTS.reduce((sum, r) => sum + r.modules.length, 0)}</div>
              <div className="text-sm text-gray-600">Модулей данных</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-gray-600">Категории отчетов</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}