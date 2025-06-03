import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Navigation from "./components/Navigation";
import { Settings } from "./components/PageStubs";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import SplitTransactions from "./pages/SplitTransactions";
import RecurringTransactions from "./pages/RecurringTransactions";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";


const App = () => {
  return (
    <Router>
      <div className="flex">
        <Navigation />
        <div className="w-full p-4">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/split-transactions" element={<SplitTransactions />} />
            <Route
              path="recurring-transactions"
              element={<RecurringTransactions />}
            />
            <Route path="/reports" element={<Reports />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
