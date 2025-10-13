import React from 'react';
import { Calendar, User, Package, ArrowLeft, ArrowRight, Plus, Minus, RefreshCw, Filter, Settings } from 'lucide-react';
import { reportService, type TransactionHistoryRow, type ReportFilters } from '../../services/reportService';
import { useLocationStore } from '../../stores/locationStore';
import { useUIStore } from '../../stores/uiStore';

interface TransactionHistoryProps {
  itemId: number;
  itemName: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ itemId, itemName }) => {
  const [transactions, setTransactions] = React.useState<TransactionHistoryRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ReportFilters>({});
  const [showFilters, setShowFilters] = React.useState(false);
  
  const { locations } = useLocationStore();
  const { addToast } = useUIStore();

  // Default date range (last 90 days)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  React.useEffect(() => {
    setFilters({
      startDate: defaultStartDate,
      endDate: defaultEndDate
    });
  }, [defaultStartDate, defaultEndDate]);

  const loadTransactionHistory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getTransactionHistory(itemId, filters);
      setTransactions(data);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Load History',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [itemId, filters, addToast]);

  React.useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadTransactionHistory();
    }
  }, [loadTransactionHistory]);

  const getTransactionIcon = (type: TransactionHistoryRow['transaction_type'], quantity: number = 0) => {
    switch (type) {
      case 'CHECKOUT':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'ADDITION':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'TRANSFER_OUT':
        return <ArrowRight className="h-4 w-4 text-orange-600" />;
      case 'TRANSFER_IN':
        return <ArrowLeft className="h-4 w-4 text-blue-600" />;
      case 'MANUAL_ADJUSTMENT':
        return quantity >= 0 
          ? <Settings className="h-4 w-4 text-purple-600" />
          : <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: TransactionHistoryRow['transaction_type'], quantity: number = 0) => {
    switch (type) {
      case 'CHECKOUT':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'ADDITION':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'TRANSFER_OUT':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'TRANSFER_IN':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'MANUAL_ADJUSTMENT':
        return quantity >= 0 
          ? 'text-purple-700 bg-purple-50 border-purple-200' 
          : 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatTransactionType = (type: TransactionHistoryRow['transaction_type'], quantity: number = 0) => {
    switch (type) {
      case 'CHECKOUT':
        return 'Checked Out';
      case 'ADDITION':
        return 'Added to Stock';
      case 'TRANSFER_OUT':
        return 'Transferred Out';
      case 'TRANSFER_IN':
        return 'Transferred In';
      case 'MANUAL_ADJUSTMENT':
        return quantity >= 0 ? 'Manual Addition' : 'Manual Subtraction';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
          <p className="text-sm text-gray-500">All inventory movements for {itemName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={loadTransactionHistory}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No transactions found for the selected period</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTransactionIcon(transaction.transaction_type, transaction.quantity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTransactionColor(transaction.transaction_type, transaction.quantity)}`}>
                          {formatTransactionType(transaction.transaction_type, transaction.quantity)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} units
                        </span>
                        {transaction.size_label && (
                          <span className="text-sm text-gray-500">({transaction.size_label})</span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {transaction.location_name}
                        </span>
                        
                        {transaction.volunteer_name && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {transaction.volunteer_name}
                          </span>
                        )}
                        
                        {transaction.case_worker && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {transaction.case_worker}
                          </span>
                        )}
                        
                        {transaction.admin_name && (
                          <span className="flex items-center">
                            <Settings className="h-4 w-4 mr-1" />
                            {transaction.admin_name}
                          </span>
                        )}
                      </div>
                      
                      {(transaction.source || transaction.reason || transaction.from_location || transaction.to_location) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {transaction.source && <span>Source: {transaction.source}</span>}
                          {transaction.reason && <span>Reason: {transaction.reason}</span>}
                          {transaction.from_location && <span>From: {transaction.from_location}</span>}
                          {transaction.to_location && <span>To: {transaction.to_location}</span>}
                        </div>
                      )}
                      
                      {transaction.notes && (
                        <div className="mt-1 text-xs text-gray-500">
                          {transaction.transaction_type === 'MANUAL_ADJUSTMENT' ? (
                            <div className="font-mono bg-gray-50 p-1 rounded text-xs">
                              {transaction.notes}
                            </div>
                          ) : (
                            <div>Notes: {transaction.notes}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {transactions.length} transactions
        </div>
      )}
    </div>
  );
};