import React from 'react';
import { useDrilldown } from '../hooks/useDrilldown';
import DrilldownModal from './DrilldownModal';

// Example component showing how to integrate drill-down functionality
const DrilldownExample: React.FC = () => {
  const drilldown = useDrilldown();

  const handleDrilldownClick = (
    reportSection: string,
    type: string,
    accountId?: number,
    subcategory?: string
  ) => {
    drilldown.openDrilldown(
      reportSection,
      type,
      accountId,
      subcategory,
      '2024-01-01', // startDate
      '2024-12-31'  // endDate
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Financial Reports</h2>
      
      {/* Example Income Statement */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Income Statement</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Revenue</span>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-green-600">$50,000</span>
              <button
                onClick={() => handleDrilldownClick('Income Statement → Revenue', 'income', undefined, 'Sales')}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Drill Down
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Expenses</span>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-red-600">$30,000</span>
              <button
                onClick={() => handleDrilldownClick('Income Statement → Expenses', 'expense', undefined, 'Utilities')}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Drill Down
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Example Balance Sheet */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Balance Sheet</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Cash & Bank Accounts</span>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-green-600">$25,000</span>
              <button
                onClick={() => handleDrilldownClick('Balance Sheet → Cash & Bank Accounts', 'asset', undefined, 'Bank Accounts')}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Drill Down
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Accounts Payable</span>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-red-600">$5,000</span>
              <button
                onClick={() => handleDrilldownClick('Balance Sheet → Accounts Payable', 'liability', undefined, 'Accounts Payable')}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Drill Down
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DrilldownModal
        isOpen={drilldown.isOpen}
        onClose={drilldown.closeDrilldown}
        reportSection={drilldown.reportSection}
        type={drilldown.type}
        accountId={drilldown.accountId}
        subcategory={drilldown.subcategory}
        startDate={drilldown.startDate}
        endDate={drilldown.endDate}
      />
    </div>
  );
};

export default DrilldownExample; 