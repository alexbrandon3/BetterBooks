import React, { useState } from "react";
import CashFlowDrilldown from "../components/CashFlowDrilldown";
import {
  fetchIncomeStatement,
  fetchBalanceSheet,
  fetchCashFlowStatement,
} from "../services/ReportService";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("Income Statement");
  const [incomeStatement, setIncomeStatement] = useState([]);
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);

  const tabs = ["Income Statement", "Balance Sheet", "Cash Flow Statement"];

  const fetchReports = async () => {
    try {
      const adjustedEndDate = new Date();
      adjustedEndDate.setHours(23, 59, 59, 999);

      const [incomeData, balanceData, cashFlowData] = await Promise.all([
        fetchIncomeStatement(
          adjustedEndDate.toISOString(),
          adjustedEndDate.toISOString()
        ),
        fetchBalanceSheet(
          adjustedEndDate.toISOString(),
          adjustedEndDate.toISOString()
        ),
        fetchCashFlowStatement(
          adjustedEndDate.toISOString(),
          adjustedEndDate.toISOString()
        ),
      ]);

      setIncomeStatement(incomeData);
      setBalanceSheet(balanceData);
      setCashFlow(cashFlowData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const renderTable = (data: any) => {
    if (!Array.isArray(data)) {
      console.error("Expected an array but got:", data);
      return <div>No data available</div>;
    }

    if (data.length === 0) {
      return <div>No records found for this report.</div>;
    }

    return (
      <table className="w-full mt-4 border">
        <thead>
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key} className="border p-2">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {Object.values(row).map((value, idx) => (
                <td key={idx} className="border p-2">
                  {String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const getActiveData = () => {
    if (activeTab === "Income Statement") return incomeStatement;
    if (activeTab === "Balance Sheet") return balanceSheet;
    if (activeTab === "Cash Flow Statement") return cashFlow;
    return [];
  };

  return (
    <div className="p-4">
      <div className="flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${
              activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">{activeTab}</h2>
        {activeTab === "Cash Flow Statement" ? (
          <CashFlowDrilldown />
        ) : (
          renderTable(getActiveData() || [])
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-green-500 text-white"
        >
          Fetch Reports
        </button>
      </div>
    </div>
  );
};

export default Reports;
