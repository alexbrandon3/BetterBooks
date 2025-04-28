// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import axios from '@/utils/axios'; // adjust if your alias differs

interface IncomeStatement {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
}

const Dashboard = () => {
  const [data, setData] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/reports/income-statement', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setData(res.data);
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-500 font-medium">Error: {error}</div>;

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-xl mx-auto mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Income Statement</h2>
      <div className="space-y-2">
        <p><strong>Start Date:</strong> {data?.startDate || 'N/A'}</p>
        <p><strong>End Date:</strong> {data?.endDate || 'N/A'}</p>
        <p><strong>Total Income:</strong> ${data?.totalIncome?.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> ${data?.totalExpenses?.toFixed(2)}</p>
        <p className={`font-bold ${data?.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Net Income: ${data?.netIncome?.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
