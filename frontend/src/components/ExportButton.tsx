import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { formatCurrency } from '../utils/formatters';
import { Account } from '../types/account';
import { FinancialGoal } from '../types/goal';

interface ExportButtonProps {
  accounts: Account[];
  goals: FinancialGoal[];
  netWorth: number;
  onExport?: (success: boolean) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ accounts, goals, netWorth, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Title
      doc.setFontSize(20);
      doc.text('BetterBooks Financial Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      // Date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;

      // Net Worth
      doc.setFontSize(16);
      doc.text('Net Worth Summary', margin, yPos);
      yPos += 10;
      doc.setFontSize(14);
      doc.text(`Total Net Worth: ${formatCurrency(netWorth)}`, margin, yPos);
      yPos += 20;

      // Accounts
      doc.setFontSize(16);
      doc.text('Accounts', margin, yPos);
      yPos += 10;
      doc.setFontSize(12);
      accounts.forEach(account => {
        const balance = typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance;
        const displayBalance = Math.abs(isNaN(balance) ? 0 : balance);
        
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPos = margin;
        }

        doc.text(`${account.name}: ${formatCurrency(displayBalance)}`, margin, yPos);
        yPos += 10;
      });
      yPos += 10;

      // Goals
      if (goals.length > 0) {
        doc.setFontSize(16);
        doc.text('Financial Goals', margin, yPos);
        yPos += 10;
        doc.setFontSize(12);
        goals.forEach(goal => {
          // Check if we need a new page
          if (yPos > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPos = margin;
          }

          doc.text(`${goal.type}: ${formatCurrency(goal.targetAmount)}`, margin, yPos);
          yPos += 10;
          doc.text(`Progress: ${goal.progress}%`, margin, yPos);
          yPos += 10;
          doc.text(`Target Date: ${new Date(goal.targetDate).toLocaleDateString()}`, margin, yPos);
          yPos += 15;
        });
      }

      // Save the PDF
      const filename = `betterbooks-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      onExport?.(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      onExport?.(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isExporting}
      className={`
        bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl
        transition-colors duration-200
        ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isExporting ? 'Exporting...' : 'Export Report'}
    </button>
  );
};

export default ExportButton; 