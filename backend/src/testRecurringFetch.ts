import axios from 'axios';
import { AppDataSource } from './config/data-source';
// import { RecurringTransaction } from './entities/RecurringTransaction';

async function testRecurringFetch() {
  const email = "test@example.com";
  const password = "password";

  try {
    // Initialize database connection
    await AppDataSource.initialize();

    // LOGIN DEBUGGING
    let loginResponse;
    try {
      loginResponse = await axios.post('http://localhost:5000/api/auth/login', { email, password });
    } catch (loginErr) {
      if (axios.isAxiosError(loginErr)) {
        console.error('❌ Login Failed');
        console.error('Status:', loginErr.response?.status);
        console.error('Response:', loginErr.response?.data);
      } else {
        console.error('❌ Login Failed:', loginErr);
      }
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      return;
    }
    const token = loginResponse.data.token;
    if (!token) {
      console.error('❌ No token returned in login response.');
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      return;
    }

    // AUTH HEADER SETUP & FETCH
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/recurring', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const transactions = response.data;
      if (Array.isArray(transactions) && transactions.length > 0) {
        transactions.forEach((t: any, i: number) => {
          console.log(`  [${i + 1}] Description: ${t.description}, Amount: ${t.amount}, NextRun: ${t.nextRun}, Account: ${t.account?.name || 'N/A'}`);
        });
      }
    } catch (fetchErr) {
      console.error('❌ Request failed');
      if (axios.isAxiosError(fetchErr)) {
        console.error('Status:', fetchErr.response?.status);
        console.error('Response:', fetchErr.response?.data);
        console.error('Message:', fetchErr.message);
      } else {
        console.error('Unexpected error:', fetchErr);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testRecurringFetch().catch(console.error); 