import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, BarChart2, FileText, Users, TrendingUp, Download, Plus, Calendar, Filter, Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  CustomerInsight, 
  MarketingCampaign, 
  CustomReport,
  ExportJob,
  ExportFormat,
  ReportExportOptions,
  ReportSchedule
} from '@/types/analytics';
import {
  getCustomerInsights,
  getMarketingCampaigns,
  getCustomReports,
  getExportJobs,
  createExportJob,
  scheduleReportExport
} from '@/services/analyticsService';
import AdminLayout from '@/components/layout/AdminLayout';
import { format } from 'date-fns';
import { toast } from "@/hooks/use-toast";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: CustomReport | null;
  onExport: (format: ExportFormat, options: ReportExportOptions) => void;
}

const ExportDialog = ({ isOpen, onClose, report, onExport }: ExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [exportOptions, setExportOptions] = useState<ReportExportOptions>({
    includeSummary: true,
    includeCharts: true,
    includeRawData: true,
    paperSize: 'a4',
    orientation: 'portrait',
    theme: 'default',
    includeTimestamp: true
  });

  const handleOptionChange = (key: keyof ReportExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    onExport(format, exportOptions);
    onClose();
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Report: {report.name}</DialogTitle>
          <DialogDescription>
            Customize your export options below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Content Options</Label>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeSummary" 
                  checked={exportOptions.includeSummary}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeSummary', checked)
                  }
                />
                <Label htmlFor="includeSummary">Include Summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCharts" 
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeCharts', checked)
                  }
                />
                <Label htmlFor="includeCharts">Include Charts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeRawData" 
                  checked={exportOptions.includeRawData}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeRawData', checked)
                  }
                />
                <Label htmlFor="includeRawData">Include Raw Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTimestamp" 
                  checked={exportOptions.includeTimestamp}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeTimestamp', checked)
                  }
                />
                <Label htmlFor="includeTimestamp">Include Timestamp</Label>
              </div>
            </div>
          </div>

          {format === 'pdf' && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paper Size</Label>
                  <Select
                    value={exportOptions.paperSize}
                    onValueChange={(value) => 
                      handleOptionChange('paperSize', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a4">A4</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={exportOptions.orientation}
                    onValueChange={(value) => 
                      handleOptionChange('orientation', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={exportOptions.theme}
              onValueChange={(value) => 
                handleOptionChange('theme', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="branded">Branded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: CustomReport | null;
  onSchedule: (schedule: ReportSchedule, format: ExportFormat, options: ReportExportOptions) => void;
}

const ScheduleDialog = ({ isOpen, onClose, report, onSchedule }: ScheduleDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [frequency, setFrequency] = useState<string>('weekly');
  const [recipients, setRecipients] = useState<string>('');
  const [exportOptions, setExportOptions] = useState<ReportExportOptions>({
    includeSummary: true,
    includeCharts: true,
    includeRawData: true,
    theme: 'default',
    includeTimestamp: true
  });

  const handleOptionChange = (key: keyof ReportExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Create schedule object
    const schedule: ReportSchedule = {
      frequency: frequency as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      recipients: recipients.split(',').map(email => email.trim()).filter(email => email),
      active: true
    };

    // Add specific schedule parameters based on frequency
    if (frequency === 'weekly') {
      schedule.dayOfWeek = 1; // Monday
    } else if (frequency === 'monthly') {
      schedule.dayOfMonth = 1; // 1st of month
    }

    onSchedule(schedule, format, exportOptions);
    onClose();
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Report: {report.name}</DialogTitle>
          <DialogDescription>
            Set up automatic exports of this report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup 
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="schedule-pdf" />
                <Label htmlFor="schedule-pdf">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="schedule-xlsx" />
                <Label htmlFor="schedule-xlsx">Excel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="schedule-csv" />
                <Label htmlFor="schedule-csv">CSV</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={setFrequency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (comma-separated)</Label>
              <Input
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email@example.com, person@company.com"
              />
              <p className="text-sm text-muted-foreground">Enter email addresses separated by commas</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Content Options</Label>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="schedule-includeSummary" 
                  checked={exportOptions.includeSummary}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeSummary', checked)
                  }
                />
                <Label htmlFor="schedule-includeSummary">Include Summary</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="schedule-includeCharts" 
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeCharts', checked)
                  }
                />
                <Label htmlFor="schedule-includeCharts">Include Charts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="schedule-includeRawData" 
                  checked={exportOptions.includeRawData}
                  onCheckedChange={(checked) => 
                    handleOptionChange('includeRawData', checked)
                  }
                />
                <Label htmlFor="schedule-includeRawData">Include Raw Data</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState('customer-insights');
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('last_30_days');
  const [campaignStatus, setCampaignStatus] = useState('');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [insightsData, campaignsData, reportsData, exportsData] = await Promise.all([
          getCustomerInsights(period),
          getMarketingCampaigns(campaignStatus),
          getCustomReports(),
          getExportJobs()
        ]);
        
        setCustomerInsights(insightsData);
        setCampaigns(campaignsData);
        setReports(reportsData);
        setExportJobs(exportsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, campaignStatus]);

  // Extract the fetchData function to component scope so it can be used elsewhere
  const fetchDataForComponent = async () => {
    setLoading(true);
    try {
      const [insightsData, campaignsData, reportsData, exportsData] = await Promise.all([
        getCustomerInsights(period),
        getMarketingCampaigns(campaignStatus),
        getCustomReports(),
        getExportJobs()
      ]);
      
      setCustomerInsights(insightsData);
      setCampaigns(campaignsData);
      setReports(reportsData);
      setExportJobs(exportsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    setSelectedReport(report);
    setExportDialogOpen(true);
  };

  const handleExport = async (format: ExportFormat, options: ReportExportOptions) => {
    if (!selectedReport) return;
    
    try {
      const newJob = await createExportJob({
        name: `${selectedReport.name} Export`,
        format,
        reportId: selectedReport.id,
        dataRange: selectedReport.dateRange,
        exportOptions: options
      });
      
      setExportJobs(prev => [newJob, ...prev]);
    } catch (error) {
      console.error('Error creating export job:', error);
    }
  };

  const handleScheduleExport = async (
    schedule: ReportSchedule, 
    format: ExportFormat, 
    options: ReportExportOptions
  ) => {
    if (!selectedReport) return;
    
    try {
      const success = await scheduleReportExport(
        selectedReport.id,
        schedule,
        format,
        options
      );
      
      if (success) {
        toast({
          title: "Report scheduled",
          description: `${selectedReport.name} will be exported ${schedule.frequency}`,
        });
        
        // Refresh data to show the updated schedule
        fetchDataForComponent();
      }
    } catch (error) {
      console.error('Error scheduling export:', error);
    }
  };

  const handleScheduleClick = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    
    setSelectedReport(report);
    setScheduleDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'MMM d, yyyy');
  };

  const renderTrendIndicator = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < 0) {
      return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-gray-500 mt-1">
              Comprehensive insights, campaign analysis, and custom reporting tools
            </p>
          </div>
          <div className="flex space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="customer-insights">
              <Users className="mr-2 h-4 w-4" />
              Customer Insights
            </TabsTrigger>
            <TabsTrigger value="marketing-campaigns">
              <BarChart className="mr-2 h-4 w-4" />
              Marketing Campaigns
            </TabsTrigger>
            <TabsTrigger value="custom-reports">
              <FileText className="mr-2 h-4 w-4" />
              Custom Reports
            </TabsTrigger>
          </TabsList>

          {/* Customer Insights Tab */}
          <TabsContent value="customer-insights">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{insight.customerSegment}</CardTitle>
                      <CardDescription>{insight.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-baseline mb-4">
                        <div className="text-3xl font-bold">
                          {typeof insight.value === 'number' && insight.value % 1 === 0
                            ? Math.round(insight.value).toLocaleString()
                            : insight.value.toLocaleString(undefined, { 
                                minimumFractionDigits: 1, 
                                maximumFractionDigits: 1 
                              })}
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          {renderTrendIndicator(insight.changePercentage)}
                          <span className={insight.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}>
                            {insight.changePercentage > 0 ? '+' : ''}{insight.changePercentage.toFixed(1)}%
                          </span>
                          <span className="text-gray-500">vs previous</span>
                        </div>
                      </div>
                      
                      <div className="h-24 flex items-end space-x-1">
                        {insight.trend.map((point, index) => (
                          <div 
                            key={index} 
                            className="flex-1 bg-primary/10 rounded-t"
                            style={{ 
                              height: `${Math.max(10, (point.value / Math.max(...insight.trend.map(p => p.value))) * 100)}%` 
                            }}
                          />
                        ))}
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatDate(insight.trend[0].date)}</span>
                        <span>{formatDate(insight.trend[insight.trend.length - 1].date)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Marketing Campaigns Tab */}
          <TabsContent value="marketing-campaigns">
            <div className="flex justify-between items-center mb-6">
              <Select value={campaignStatus} onValueChange={setCampaignStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Campaigns</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{campaign.name}</CardTitle>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Budget</div>
                          <div className="text-lg font-semibold">{formatCurrency(campaign.budget)}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(campaign.spent)} spent ({Math.round(campaign.spent / campaign.budget * 100)}%)
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                          <div className="text-sm text-gray-500">Impressions</div>
                          <div className="text-xl font-semibold">{campaign.impressions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Clicks</div>
                          <div className="text-xl font-semibold">{campaign.clicks.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">CTR: {formatPercent(campaign.ctr)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Conversions</div>
                          <div className="text-xl font-semibold">{campaign.conversions.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">CVR: {formatPercent(campaign.cvr)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Revenue</div>
                          <div className="text-xl font-semibold">{formatCurrency(campaign.revenue)}</div>
                          <div className="text-xs text-gray-500">ROAS: {campaign.roas.toFixed(2)}x</div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Budget Usage</span>
                          <span>{Math.round(campaign.spent / campaign.budget * 100)}%</span>
                        </div>
                        <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Custom Reports Tab */}
          <TabsContent value="custom-reports">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Input 
                  placeholder="Search reports" 
                  className="pl-8" 
                />
                <Filter className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{report.name}</CardTitle>
                          <CardDescription>{report.description}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleCreateExport(report.id)}>
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleScheduleClick(report.id)}>
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart2 className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 mr-1">Date Range:</span>
                          <span>
                            {report.dateRange.preset ? (
                              report.dateRange.preset.replace(/_/g, ' ')
                            ) : (
                              `${formatDate(report.dateRange.startDate)} - ${formatDate(report.dateRange.endDate)}`
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 mr-1">Visualization:</span>
                          <span className="capitalize">{report.visualizationType.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 mr-1">Last Updated:</span>
                          <span>{formatDate(report.updatedAt)}</span>
                        </div>
                        {report.schedule && (
                          <div>
                            <span className="text-gray-500 mr-1">Schedule:</span>
                            <span className="capitalize">{report.schedule.frequency}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-gray-500 text-sm">Metrics:</span>
                        {report.metrics.map((metric) => (
                          <Badge key={metric} variant="secondary" className="capitalize">
                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="text-gray-500 text-sm">Dimensions:</span>
                        {report.dimensions.map((dimension) => (
                          <Badge key={dimension} variant="outline" className="capitalize">
                            {dimension.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {reports.length === 0 && (
                  <div className="text-center py-12 border rounded-lg">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reports created yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Create your first custom report to analyze specific metrics and dimensions important to your business.
                    </p>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Report
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Recent Exports */}
            {exportJobs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Recent Exports</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Format</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportJobs.map((job) => (
                        <tr key={job.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">{job.name}</td>
                          <td className="p-3 uppercase">{job.format}</td>
                          <td className="p-3">{formatDate(job.createdAt)}</td>
                          <td className="p-3">
                            <Badge
                              className={
                                job.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : job.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : job.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {job.status === 'completed' && job.downloadUrl ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={job.downloadUrl} download>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" disabled>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        report={selectedReport}
        onExport={handleExport}
      />
      <ScheduleDialog
        isOpen={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        report={selectedReport}
        onSchedule={handleScheduleExport}
      />
    </AdminLayout>
  );
};

export default AdvancedAnalytics; 