import React, { useState, useEffect } from "react";
import axios from "../utils/axios";

const CashFlowDrilldown = () => {
  const [operatingData, setOperatingData] = useState([]);
  const [investingData, setInvestingData] = useState([]);
  const [financingData, setFinancingData] = useState([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await axios.get("reports/cash-flow-statement");
      const data = res.data || {};
      setOperatingData(data.operating || []);
      setInvestingData(data.investing || []);
      setFinancingData(data.financing || []);
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

  const renderSection = (title: string, data: any[]) => (
    <div className="mb-4">
      <button
        onClick={() => toggleExpand(title)}
        className="text-lg font-semibold underline mb-2"
      >
        {title}
      </button>
      {expanded === title && (
        <ul className="ml-4 text-sm space-y-1">
          {data.map((item, idx) => (
            <li key={idx}>
              {item.description} - ${Number(item.amount).toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="p-4">
      {renderSection("Operating Activities", operatingData)}
      {renderSection("Investing Activities", investingData)}
      {renderSection("Financing Activities", financingData)}
    </div>
  );
};

export default CashFlowDrilldown;
