import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    monthly: true
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="max-w-4xl space-y-8">
        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-500">Get instant alerts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Weekly Reports</div>
                <div className="text-sm text-gray-500">Summary of your finances</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.weekly}
                  onChange={(e) => setNotifications(prev => ({ ...prev, weekly: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
        {/* Account Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="text-gray-900">{user?.email || 'Not available'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Tolerance
              </label>
              <div className="text-gray-900 capitalize">
                {user?.riskTolerance || 'Not set'}
              </div>
            </div>
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About BetterBooks</h2>
          <div className="space-y-3 text-gray-600">
            <p>BetterBooks is your personal finance companion, helping you track expenses, set goals, and make smarter financial decisions.</p>
            <p className="text-sm">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 