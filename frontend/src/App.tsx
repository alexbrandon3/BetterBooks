import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import IncomeStatement from '@/pages/IncomeStatement';
import AddTransaction from './pages/AddTransaction';
import CreateAccount from './pages/CreateAccount';
// src/index.ts



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income-statement" element={<IncomeStatement />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/create-account" element={<CreateAccount />} />
        {/* Add more routes here */}
      </Routes>
    </Router>
  );
}

export default App;
