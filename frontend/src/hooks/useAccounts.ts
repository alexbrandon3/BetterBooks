import { useEffect, useState } from 'react';

export interface Account {
  id: string;
  number: number;
  name: string;
  type: string;
  balance: number;
  isArchived?: boolean;
}

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:3004/api/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      setError('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { accounts, loading, error, refresh: fetchAccounts };
};
