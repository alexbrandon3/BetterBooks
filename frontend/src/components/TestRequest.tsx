import React, { useEffect } from "react";
import axios from "@/utils/axios";

const TestRequest = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/reports/income-statement");
        console.log("✅ Response:", response.data);
      } catch (error: any) {
        console.error("❌ Error:", error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <p>Check the console for the API response.</p>
    </div>
  );
};

export default TestRequest;
