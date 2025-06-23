import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navigation from "./components/Navigation";
import { Settings } from "./components/PageStubs";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import RecurringTransactions from "./pages/RecurringTransactions";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log("Redirecting to login...");
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  console.log("App component rendering");
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      <div className={`overflow-auto ${isAuthenticated && !isLoading ? 'flex-1' : 'w-full'}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
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
          
          {/* Catch-all route - redirect to appropriate page */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </div>
    </div>
  );
};

// Component to handle default redirects
const DefaultRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;
