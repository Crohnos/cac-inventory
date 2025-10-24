import React from 'react';
import { Plus, Minus, ArrowRight, ArrowLeft, Settings, Package } from 'lucide-react';
import type { MonthlyInventoryMovementRow } from '../../stores/reportStore';

interface MonthlyMovementsTableProps {
  data: MonthlyInventoryMovementRow[];
}

export const MonthlyMovementsTable: React.FC<MonthlyMovementsTableProps> = ({ data }) => {
  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return num.toLocaleString();
  };
  
  const getNetChangeColor = (netChange: number | undefined | null) => {
    const change = netChange || 0;
    if (change > 0) return 'text-green-700 bg-green-50';
    if (change < 0) return 'text-red-700 bg-red-50';
    return 'text-gray-700 bg-gray-50';
  };

  const getNetChangeIcon = (netChange: number | undefined | null) => {
    const change = netChange || 0;
    if (change > 0) return <Plus className="h-4 w-4" />;
    if (change < 0) return <Minus className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <Plus className="h-3 w-3 text-green-600 mr-1" />
                Additions
              </div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <Minus className="h-3 w-3 text-red-600 mr-1" />
                Checkouts
              </div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <ArrowLeft className="h-3 w-3 text-blue-600 mr-1" />
                Transfer In
              </div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <ArrowRight className="h-3 w-3 text-orange-600 mr-1" />
                Transfer Out
              </div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center justify-center">
                <Settings className="h-3 w-3 text-purple-600 mr-1" />
                Manual Adj.
              </div>
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Net Change
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-3 py-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{row.item_name}</div>
                  <div className="text-gray-500">
                    {row.size_label} • {row.unit_type}
                  </div>
                </div>
              </td>
              
              <td className="px-3 py-4 text-sm text-gray-900">
                {row.location_name}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                {(row.additions_total ?? 0) > 0 ? (
                  <div>
                    <div className="font-semibold text-green-700">+{formatNumber(row.additions_total)}</div>
                    <div className="text-xs text-gray-500">({row.additions_count ?? 0} transactions)</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                {(row.checkouts_total ?? 0) > 0 ? (
                  <div>
                    <div className="font-semibold text-red-700">-{formatNumber(row.checkouts_total)}</div>
                    <div className="text-xs text-gray-500">({row.checkouts_count ?? 0} transactions)</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                {(row.transfers_in_total ?? 0) > 0 ? (
                  <div>
                    <div className="font-semibold text-blue-700">+{formatNumber(row.transfers_in_total)}</div>
                    <div className="text-xs text-gray-500">({row.transfers_in_count ?? 0} transactions)</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                {(row.transfers_out_total ?? 0) > 0 ? (
                  <div>
                    <div className="font-semibold text-orange-700">-{formatNumber(row.transfers_out_total)}</div>
                    <div className="text-xs text-gray-500">({row.transfers_out_count ?? 0} transactions)</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                {((row.manual_additions_total ?? 0) > 0 || (row.manual_subtractions_total ?? 0) > 0) ? (
                  <div>
                    {(row.manual_additions_total ?? 0) > 0 && (
                      <div className="text-purple-700">+{formatNumber(row.manual_additions_total)}</div>
                    )}
                    {(row.manual_subtractions_total ?? 0) > 0 && (
                      <div className="text-yellow-700">-{formatNumber(row.manual_subtractions_total)}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      ({(row.manual_additions_count ?? 0) + (row.manual_subtractions_count ?? 0)} adjustments)
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              
              <td className="px-3 py-4 text-sm text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getNetChangeColor(row.net_change)}`}>
                  {getNetChangeIcon(row.net_change)}
                  <span className="ml-1">
                    {(row.net_change ?? 0) > 0 ? '+' : ''}{formatNumber(row.net_change)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No inventory movements found for the selected period</p>
        </div>
      )}
    </div>
  );
};