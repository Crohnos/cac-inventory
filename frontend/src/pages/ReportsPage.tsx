import React from 'react';
import { FileText, Download, Filter, Calendar, MapPin, Users, Package, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { useLocationStore } from '../stores/locationStore';
import { useUIStore } from '../stores/uiStore';
import { useReportStore, type ReportFilters } from '../stores/reportStore';
import { MonthlyMovementsTable } from '../components/reports/MonthlyMovementsTable';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'inventory' | 'activity' | 'volunteer' | 'admin';
  hasLocationFilter: boolean;
  hasDateFilter: boolean;
  hasLimitFilter?: boolean;
  hasMonthFilter?: boolean;
}

const AVAILABLE_REPORTS: ReportConfig[] = [
  // Inventory Reports
  {
    id: 'current-inventory',
    name: 'Current Inventory',
    description: 'Complete inventory snapshot with stock levels and status',
    icon: Package,
    category: 'inventory',
    hasLocationFilter: true,
    hasDateFilter: false
  },
  {
    id: 'low-stock',
    name: 'Low Stock Alert',
    description: 'Items below minimum stock levels that need restocking',
    icon: TrendingUp,
    category: 'inventory',
    hasLocationFilter: true,
    hasDateFilter: false
  },
  {
    id: 'item-master',
    name: 'Item Master List',
    description: 'Complete catalog of all items with QR codes and details',
    icon: FileText,
    category: 'inventory',
    hasLocationFilter: false,
    hasDateFilter: false
  },
  {
    id: 'monthly-movements',
    name: 'Monthly Inventory Movements',
    description: 'Comprehensive monthly report of all inventory additions, checkouts, and transfers by item and location',
    icon: BarChart3,
    category: 'inventory',
    hasLocationFilter: true,
    hasDateFilter: false,
    hasMonthFilter: true
  },

  // Activity Reports
  {
    id: 'checkouts',
    name: 'Checkout History',
    description: 'Detailed checkout transactions and client services',
    icon: Download,
    category: 'activity',
    hasLocationFilter: true,
    hasDateFilter: true
  },
  {
    id: 'popular-items',
    name: 'Popular Items',
    description: 'Most frequently checked out items and trends',
    icon: TrendingUp,
    category: 'activity',
    hasLocationFilter: false,
    hasDateFilter: true,
    hasLimitFilter: true
  },

  // Volunteer Reports
  {
    id: 'volunteer-hours',
    name: 'Volunteer Hours Summary',
    description: 'Total volunteer contributions and statistics',
    icon: Users,
    category: 'volunteer',
    hasLocationFilter: true,
    hasDateFilter: true
  },
  {
    id: 'daily-volunteers',
    name: 'Daily Volunteer Report',
    description: 'Detailed volunteer session logs and activities',
    icon: Clock,
    category: 'volunteer',
    hasLocationFilter: true,
    hasDateFilter: true
  }
];

export const ReportsPage: React.FC = () => {
  const { locations, getCurrentLocation } = useLocationStore();
  const { addToast } = useUIStore();
  const { getCurrentInventory, getLowStock, getCheckouts, getPopularItems, getVolunteerHours, getDailyVolunteers, getItemMaster, getMonthlyInventoryMovements, exportReport } = useReportStore();
  const currentLocation = getCurrentLocation();

  const [selectedReport, setSelectedReport] = React.useState<ReportConfig | null>(null);
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());

  // Default date range (last 30 days)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  React.useEffect(() => {
    setFilters({
      locationId: currentLocation?.location_id,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      limit: 25
    });
  }, [currentLocation, defaultStartDate, defaultEndDate]);

  const handleRunReport = async () => {
    if (!selectedReport) return;

    setIsLoading(true);
    try {
      let data: any[] = [];

      switch (selectedReport.id) {
        case 'current-inventory':
          data = await getCurrentInventory(filters);
          break;
        case 'low-stock':
          data = await getLowStock(filters);
          break;
        case 'checkouts':
          data = await getCheckouts(filters);
          break;
        case 'popular-items':
          data = await getPopularItems(filters);
          break;
        case 'volunteer-hours':
          data = await getVolunteerHours(filters);
          break;
        case 'daily-volunteers':
          data = await getDailyVolunteers(filters);
          break;
        case 'item-master':
          data = await getItemMaster();
          break;
        case 'monthly-movements':
          data = await getMonthlyInventoryMovements(selectedMonth, selectedYear, filters.locationId);
          break;
      }

      setReportData(data);
      
      if (data.length === 0) {
        addToast({
          type: 'warning',
          title: 'No Data Found',
          message: 'No data matches the selected criteria. Try adjusting your filters.'
        });
      } else {
        addToast({
          type: 'success',
          title: 'Report Generated',
          message: `Found ${data.length} records`
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Report Failed',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'json' = 'csv') => {
    if (!selectedReport) return;

    try {
      await exportReport(selectedReport.id, filters, format);
      addToast({
        type: 'success',
        title: 'Export Started',
        message: `${selectedReport.name} is downloading...`
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: error.message
      });
    }
  };


  const categoryColors = {
    inventory: 'bg-blue-50 text-blue-700 border-blue-200',
    activity: 'bg-green-50 text-green-700 border-green-200',
    volunteer: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand">Reports & Analytics</h1>
        <p className="text-caccc-grey/70">Generate detailed reports about inventory, checkouts, and volunteer activities</p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Reports</h2>
            <div className="space-y-2">
              {AVAILABLE_REPORTS.map((report) => {
                const Icon = report.icon;
                const isSelected = selectedReport?.id === report.id;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? categoryColors[report.category]
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm opacity-75">{report.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Configuration & Results */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Report Filters
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.hasLocationFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Location
                      </label>
                      <select
                        value={filters.locationId || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          locationId: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                          <option key={location.location_id} value={location.location_id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {selectedReport.hasDateFilter && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.startDate || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            startDate: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.endDate || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            endDate: e.target.value
                          }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                    </>
                  )}
                  
                  {selectedReport.hasLimitFilter && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Limit Results
                      </label>
                      <select
                        value={filters.limit || 25}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          limit: parseInt(e.target.value)
                        }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value={10}>Top 10</option>
                        <option value={25}>Top 25</option>
                        <option value={50}>Top 50</option>
                        <option value={100}>Top 100</option>
                      </select>
                    </div>
                  )}
                  
                  {selectedReport.hasMonthFilter && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Month
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value={1}>January</option>
                          <option value={2}>February</option>
                          <option value={3}>March</option>
                          <option value={4}>April</option>
                          <option value={5}>May</option>
                          <option value={6}>June</option>
                          <option value={7}>July</option>
                          <option value={8}>August</option>
                          <option value={9}>September</option>
                          <option value={10}>October</option>
                          <option value={11}>November</option>
                          <option value={12}>December</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleRunReport}
                    disabled={isLoading}
                    className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating...' : 'Generate Report'}
                  </button>
                  
                  {reportData.length > 0 && (
                    <button
                      onClick={() => handleExportReport('csv')}
                      className="px-6 py-4 text-lg font-semibold rounded-lg transition-colors min-h-[48px] bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
                    >
                      <Download className="h-4 w-4 inline mr-2" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>
              
              {/* Report Results */}
              {reportData.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedReport.name} Results
                    </h3>
                    <span className="text-sm text-gray-500">
                      {reportData.length} records
                    </span>
                  </div>
                  
                  {selectedReport.id === 'monthly-movements' ? (
                    <MonthlyMovementsTable data={reportData} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {reportData.length > 0 && Object.keys(reportData[0]).map(key => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.slice(0, 10).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {value as string}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length > 10 && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                          Showing first 10 of {reportData.length} records. Export full report for all data.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
              <p className="text-gray-500">
                Choose a report from the list on the left to get started. 
                You can customize filters and export data in CSV format.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};