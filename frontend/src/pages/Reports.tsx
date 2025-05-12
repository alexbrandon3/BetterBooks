import React, { useState } from "react";
import {
  fetchIncomeStatement,
  fetchBalanceSheet,
  fetchCashFlowStatement,
} from "../services/ReportService";
import { CSVLink } from "react-csv";

const Reports: React.FC = () => {
  const [incomeStatement, setIncomeStatement] = useState<any[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const transformToTableData = (obj: any) => {
    return Object.entries(obj).map(([key, value]) => ({
      Category: key,
      Amount: String(value),
    }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incomeData, balanceData, cashFlowData] = await Promise.all([
        fetchIncomeStatement(startDate, endDate),
        fetchBalanceSheet(startDate, endDate),
        fetchCashFlowStatement(startDate, endDate),
      ]);

      console.log("Income Statement:", incomeData);
      console.log("Balance Sheet:", balanceData);
      console.log("Cash Flow Statement:", cashFlowData);

      setIncomeStatement(transformToTableData(incomeData));
      setBalanceSheet(transformToTableData(balanceData));
      setCashFlow(transformToTableData(cashFlowData));

      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const paginate = (array: any) => {
    if (!Array.isArray(array)) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return array.slice(start, start + itemsPerPage);
  };

  const renderTable = (data: any[], title: string) => (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <CSVLink data={data} filename={`${title}.csv`}>
            <button className="bg-blue-500 text-white px-4 py-2 mb-2 rounded">
              Export CSV
            </button>
          </CSVLink>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                {Object.keys(data[0] || {}).map((key) => (
                  <th
                    key={key}
                    className="border border-gray-200 p-2 bg-gray-100"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginate(data).map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, idx) => (
                    <td key={idx} className="border border-gray-200 p-2">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={fetchData}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Fetch Reports
        </button>
      </div>

      {renderTable(incomeStatement, "Income Statement")}
      {renderTable(balanceSheet, "Balance Sheet")}
      {renderTable(cashFlow, "Cash Flow Statement")}
    </div>
  );
};

export default Reports;
