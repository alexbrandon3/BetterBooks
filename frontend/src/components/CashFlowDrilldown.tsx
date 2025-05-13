import React, { useState, useEffect } from "react";
import axios from "../utils/axios";

const CashFlowDrilldown = () => {
  const [operatingData, setOperatingData] = useState([]);
  const [investingData, setInvestingData] = useState([]);
  const [financingData, setFinancingData] = useState([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [operating, investing, financing] = await Promise.all([
        axios.get("/api/reports/cash-flow-statement/operating"),
        axios.get("/api/reports/cash-flow-statement/investing"),
        axios.get("/api/reports/cash-flow-statement/financing"),
      ]);

      setOperatingData(operating.data);
      setInvestingData(investing.data);
      setFinancingData(financing.data);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (section: string) => {
    setExpanded(expanded === section ? null : section);
  };

  const renderRows = (data: any[]) =>
    data.map((item, index) => (
      <tr key={index} className="border-t">
        <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
        <td className="p-2">{item.description}</td>
        <td className="p-2">{item.amount}</td>
        <td className="p-2">{item.account.type}</td>
      </tr>
    ));

  return (
    <div className="space-y-4">
      <div>
        <h3
          className="text-lg font-bold cursor-pointer"
          onClick={() => toggleExpand("operating")}
        >
          Operating Activities {expanded === "operating" ? "▲" : "▼"}
        </h3>
        {expanded === "operating" && (
          <table className="w-full mt-2 border">
            <thead>
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Account Type</th>
              </tr>
            </thead>
            <tbody>{renderRows(operatingData)}</tbody>
          </table>
        )}
      </div>

      <div>
        <h3
          className="text-lg font-bold cursor-pointer"
          onClick={() => toggleExpand("investing")}
        >
          Investing Activities {expanded === "investing" ? "▲" : "▼"}
        </h3>
        {expanded === "investing" && (
          <table className="w-full mt-2 border">
            <thead>
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Account Type</th>
              </tr>
            </thead>
            <tbody>{renderRows(investingData)}</tbody>
          </table>
        )}
      </div>

      <div>
        <h3
          className="text-lg font-bold cursor-pointer"
          onClick={() => toggleExpand("financing")}
        >
          Financing Activities {expanded === "financing" ? "▲" : "▼"}
        </h3>
        {expanded === "financing" && (
          <table className="w-full mt-2 border">
            <thead>
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Account Type</th>
              </tr>
            </thead>
            <tbody>{renderRows(financingData)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CashFlowDrilldown;
