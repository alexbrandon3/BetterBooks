import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Navigation from "./components/Navigation";
import { Settings } from "./components/PageStubs";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import SplitTransactions from "./pages/SplitTransactions";
import RecurringTransactions from "./pages/RecurringTransactions";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import { useAuth } from "./contexts/AuthContext";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  
  if (!isAuthenticated) {
    console.log("Redirecting to login...");
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  console.log("App component rendering");
  
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/split-transactions" element={
              <ProtectedRoute>
                <SplitTransactions />
              </ProtectedRoute>
            } />
            <Route path="/recurring-transactions" element={
              <ProtectedRoute>
                <RecurringTransactions />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
