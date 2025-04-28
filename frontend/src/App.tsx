import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import IncomeStatement from './components/IncomeStatement';
// src/index.ts



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income-statement" element={<IncomeStatement />} />
        {/* Add more routes here */}
      </Routes>
    </Router>
  );
}

export default App;
