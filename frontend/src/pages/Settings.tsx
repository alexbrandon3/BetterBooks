import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    monthly: true
  });
  
  // New state for smart suggestions
  const [suggestionSettings, setSuggestionSettings] = useState({
    autoSuggestions: true,
    learnFromChoices: true,
    showConfidence: true,
    businessFocus: true
  });
  
  const [userPreferences, setUserPreferences] = useState<any[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await api.get('/suggestions/preferences');
      setUserPreferences(response.data || []);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleSaveDisplayName = async () => {
    try {
      await api.put('/auth/profile', { displayName });
      toast.success('Display name updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update display name');
      console.error('Error updating display name:', error);
    }
  };

  const handleSuggestionSettingChange = async (setting: string, value: boolean) => {
    try {
      setSuggestionSettings(prev => ({ ...prev, [setting]: value }));
      await api.put('/suggestions/settings', { [setting]: value });
      toast.success('Suggestion settings updated!');
    } catch (error) {
      toast.error('Failed to update suggestion settings');
      console.error('Error updating suggestion settings:', error);
    }
  };

  const handleClearPreferences = async () => {
    if (window.confirm('Are you sure you want to clear all your learning preferences? This will reset the AI suggestions to default behavior.')) {
      try {
        await api.delete('/suggestions/preferences');
        setUserPreferences([]);
        toast.success('Learning preferences cleared successfully!');
      } catch (error) {
        toast.error('Failed to clear preferences');
        console.error('Error clearing preferences:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="max-w-4xl space-y-8">
        {/* Smart Suggestions Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Smart Suggestions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto-Suggestions</div>
                <div className="text-sm text-gray-500">Automatically suggest accounts for transactions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestionSettings.autoSuggestions}
                  onChange={(e) => handleSuggestionSettingChange('autoSuggestions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Learn from Your Choices</div>
                <div className="text-sm text-gray-500">Improve suggestions based on your selections</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestionSettings.learnFromChoices}
                  onChange={(e) => handleSuggestionSettingChange('learnFromChoices', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Confidence Levels</div>
                <div className="text-sm text-gray-500">Display how confident the AI is in suggestions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestionSettings.showConfidence}
                  onChange={(e) => handleSuggestionSettingChange('showConfidence', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Business-Focused Suggestions</div>
                <div className="text-sm text-gray-500">Prioritize business accounting categories</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestionSettings.businessFocus}
                  onChange={(e) => handleSuggestionSettingChange('businessFocus', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
          </div>
        </div>

        {/* Learning Preferences Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Learning Preferences</h2>
            {userPreferences.length > 0 && (
              <button
                onClick={handleClearPreferences}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-4">
            {loadingPreferences ? (
              <div className="text-gray-500 text-center py-4">Loading preferences...</div>
            ) : userPreferences.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  The system has learned {userPreferences.length} preferences from your transaction choices.
                </p>
                {userPreferences.slice(0, 5).map((pref, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{pref.description}</div>
                      <div className="text-sm text-gray-500">→ {pref.accountName}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Used {pref.usageCount} times
                    </div>
                  </div>
                ))}
                {userPreferences.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... and {userPreferences.length - 5} more preferences
                  </p>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                No learning preferences yet. Start categorizing transactions to help improve suggestions.
              </div>
            )}
          </div>
        </div>

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
                Display Name
              </label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter display name"
                  />
                  <button
                    onClick={handleSaveDisplayName}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(user?.displayName || '');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-gray-900">{displayName || 'Not set'}</div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Tolerance
              </label>
              <div className="text-gray-900 capitalize">
                {user?.riskTolerance || 'Not set'}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Dark Mode</div>
                <div className="text-sm text-gray-500">Toggle dark theme</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
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
            <p>BetterBooks is your business finance companion, helping you track expenses, set goals, and make smarter financial decisions for your small business.</p>
            <p className="text-sm">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 