import axios from 'axios';
import { AppDataSource } from './config/data-source';
// import { RecurringTransaction } from './entities/RecurringTransaction';

async function testRecurringFetch() {
  console.log('🧪 Test Start');
  const email = "test@example.com";
  const password = "password";

  try {
    // Initialize database connection
    console.log('📡 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // LOGIN DEBUGGING
    console.log('\n🔑 Attempting login...');
    let loginResponse;
    try {
      loginResponse = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      console.log('🔐 Login Response:', loginResponse.data);
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
    console.log('✅ Login Successful');

    // AUTH HEADER SETUP & FETCH
    console.log('\n🌐 Fetching Recurring Transactions...');
    try {
      const response = await axios.get('http://localhost:5000/api/transactions/recurring', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // RESPONSE LOGGING
      console.group('📥 Response Headers');
      console.log(response.headers);
      console.groupEnd();
      console.group('📦 Response Data');
      const transactions = response.data;
      if (Array.isArray(transactions) && transactions.length > 0) {
        console.log(`✅ Found ${transactions.length} transactions`);
        transactions.forEach((t: any, i: number) => {
          console.log(`  [${i + 1}] Description: ${t.description}, Amount: ${t.amount}, NextRun: ${t.nextRun}, Account: ${t.account?.name || 'N/A'}`);
        });
      } else {
        console.log('⚠️ No valid transactions returned');
      }
      console.groupEnd();
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
      console.log('\n🔌 Database connection closed');
    }
    console.log('🧪 Test End');
  }
}

testRecurringFetch().catch(console.error); 