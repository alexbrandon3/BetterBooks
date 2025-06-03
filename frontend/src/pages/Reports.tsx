import React, { useEffect, useState } from "react";
import {
  fetchIncomeStatement,
  fetchBalanceSheet,
  fetchCashFlowStatement,
} from "../services/ReportService";

interface IncomeStatement {
  income: number;
  expenses: number;
  netIncome: number;
}

interface BalanceSheet {
  assets: number;
  liabilities: number;
  equity: number;
}

interface CashFlow {
  operating: number;
  investing: number;
  financing: number;
  netCashFlow: number;
}

const Reports = () => {
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [activeTab, setActiveTab] = useState("income");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const income = await fetchIncomeStatement();
        const balance = await fetchBalanceSheet();
        const cash = await fetchCashFlowStatement();

        console.log("Income statement response:", income);
        console.log("Balance sheet response:", balance);
        console.log("Cash flow response:", cash);

        setIncomeStatement(income);
        setBalanceSheet(balance);
        setCashFlow(cash);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  const renderBalanceSheet = () => {
    if (!balanceSheet) return <p className="text-gray-500">No data available.</p>;

    return (
      <table className="w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Category</th>
            <th className="border border-gray-300 p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(balanceSheet).map(([key, value]) => (
            <tr key={key}>
              <td className="border border-gray-300 p-2">{key}</td>
              <td className="border border-gray-300 p-2">${value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return <p className="text-gray-500">No data available.</p>;

    return (
      <table className="w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Category</th>
            <th className="border border-gray-300 p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(incomeStatement).map(([key, value]) => (
            <tr key={key}>
              <td className="border border-gray-300 p-2">{key}</td>
              <td className="border border-gray-300 p-2">${value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCashFlow = () => {
    if (!cashFlow) return <p className="text-gray-500">No data available.</p>;

    return (
      <table className="w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Category</th>
            <th className="border border-gray-300 p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cashFlow).map(([key, value]) => (
            <tr key={key}>
              <td className="border border-gray-300 p-2">{key}</td>
              <td className="border border-gray-300 p-2">${value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "income":
        return renderIncomeStatement();
      case "balance":
        return renderBalanceSheet();
      case "cash":
        return renderCashFlow();
      default:
        return <p>Select a report type</p>;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "income" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("income")}
        >
          Income Statement
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "balance" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("balance")}
        >
          Balance Sheet
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "cash" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("cash")}
        >
          Cash Flow
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default Reports;
