import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { calculateTotalAssets, calculateTotalLiabilities, calculateNetWorth } from '../utils/finance';
import { Account } from '../types/account';

interface NetWorthCardProps {
  accounts: Account[];
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({ accounts }) => {
  const totalAssets = calculateTotalAssets(accounts);
  const totalLiabilities = calculateTotalLiabilities(accounts);
  const netWorth = calculateNetWorth(accounts);

  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Net Worth Summary</h2>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-600">Assets</span>
            <div className="ml-2 group relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Total value of all your assets including cash, investments, and property
              </div>
            </div>
          </div>
          <span className="text-lg font-semibold text-green-600">
            {formatCurrency(totalAssets)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-600">Liabilities</span>
            <div className="ml-2 group relative">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Total amount of money you owe, including loans and credit card debt
              </div>
            </div>
          </div>
          <span className="text-lg font-semibold text-red-600">
            {formatCurrency(totalLiabilities)}
          </span>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-gray-800 font-semibold">Net Worth</span>
              <div className="ml-2 group relative">
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Your total wealth (Assets minus Liabilities)
                </div>
              </div>
            </div>
            <span className={`text-xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netWorth)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthCard; 