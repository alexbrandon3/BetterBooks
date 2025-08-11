import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AccountWeightService } from '../services/AccountWeightService';
import { AccountWeightWithAccount, AccountWeightData } from '../types/suggestion';
import { Account } from '../types/account';

interface SmartSuggestionsSectionProps {
  className?: string;
}

const SmartSuggestionsSection: React.FC<SmartSuggestionsSectionProps> = ({ className = '' }) => {
  const [weights, setWeights] = useState<AccountWeightWithAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWeight, setEditingWeight] = useState<AccountWeightWithAccount | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form state for adding/editing weights
  const [formData, setFormData] = useState<AccountWeightData>({
    keyword: '',
    accountId: 0,
    weight: 50,
    transactionType: undefined,
    isDefault: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [weightsData, accountsData] = await Promise.all([
        AccountWeightService.getUserWeights(),
        AccountWeightService.getAccounts()
      ]);
      setWeights(weightsData);
      setAccounts(accountsData);
    } catch (error) {
      toast.error('Failed to load smart suggestions data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    try {
      if (!formData.keyword.trim() || formData.accountId === 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      await AccountWeightService.createOrUpdateWeight(formData);
      toast.success('Keyword mapping added successfully!');
      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add keyword mapping');
      console.error('Error adding weight:', error);
    }
  };

  const handleEditWeight = async () => {
    try {
      if (!editingWeight || !formData.keyword.trim() || formData.accountId === 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      await AccountWeightService.createOrUpdateWeight({
        ...formData,
        accountId: formData.accountId
      });
      toast.success('Weight updated successfully!');
      setEditingWeight(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update weight');
      console.error('Error updating weight:', error);
    }
  };

  const handleDeleteWeight = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this keyword mapping?')) {
      return;
    }

    try {
      await AccountWeightService.deleteWeight(id);
      toast.success('Keyword mapping deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete keyword mapping');
      console.error('Error deleting weight:', error);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      await AccountWeightService.initializeDefaultWeights();
      toast.success('Default weights initialized successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to initialize default weights');
      console.error('Error initializing defaults:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      keyword: '',
      accountId: 0,
      weight: 50,
      transactionType: undefined,
      isDefault: false
    });
  };

  const startEdit = (weight: AccountWeightWithAccount) => {
    setEditingWeight(weight);
    setFormData({
      keyword: weight.keyword,
      accountId: weight.accountId,
      weight: weight.weight,
      transactionType: weight.transactionType,
      isDefault: weight.isDefault
    });
  };

  const cancelEdit = () => {
    setEditingWeight(null);
    resetForm();
  };

  const getAccountName = (accountId: number) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const getTransactionTypeLabel = (type?: string) => {
    if (!type) return 'Any';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  // Get top mappings for quick display
  const topMappings = weights
    .filter(w => w.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  const activeMappingsCount = weights.filter(w => w.usageCount > 0).length;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advanced: Smart Suggestions</h2>
          <p className="text-sm text-gray-600 mt-1">Customize account suggestions based on keywords</p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Collapsed View - Simple Status */}
      {!isExpanded && (
        <div className="text-center py-6">
          <div className="text-gray-500 mb-3 text-4xl">🎯</div>
          <p className="text-gray-600 font-medium text-lg">Keyword Mappings Active</p>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            {weights.length} keyword mappings configured • {activeMappingsCount} actively used
          </p>
          
          {/* Quick Actions */}
          <div className="flex gap-2 justify-center mb-4">
            <button 
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              ➕ Add Quick Mapping
            </button>
            <button 
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Manage All Mappings
            </button>
          </div>

          {/* Top Mappings Preview */}
          {topMappings.length > 0 && (
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">Most Used Mappings</h4>
              <div className="flex flex-wrap gap-2 justify-center">
                {topMappings.map(mapping => (
                  <span key={mapping.id} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    "{mapping.keyword}" → {mapping.accountName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Help */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md mx-auto">
            <p className="text-xs text-blue-700">
              💡 <strong>Keyword mappings</strong> help the system suggest accounts when you type descriptions. 
              For example, typing "rent" will suggest "Rent Expense" account.
            </p>
          </div>
        </div>
      )}

      {/* Expanded View - Full Management */}
      {isExpanded && (
        <>
          {/* Quick Actions Bar */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={handleInitializeDefaults}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initialize Defaults
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Add Mapping
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Hide Details
            </button>
          </div>

          {/* Simplified Add/Edit Form */}
          {(showAddForm || editingWeight) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">
                {editingWeight ? 'Edit Keyword Mapping' : 'Add New Keyword Mapping'}
              </h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">When I type...</label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., rent, sold, bought"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Suggest this account</label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>Select an account</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-600 mb-1">Confidence</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">{formData.weight}%</div>
                </div>
                <button
                  onClick={editingWeight ? handleEditWeight : handleAddWeight}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingWeight ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={editingWeight ? cancelEdit : () => setShowAddForm(false)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Mappings Display - Card Layout */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading smart suggestions...</div>
            </div>
          ) : weights.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">All Keyword Mappings ({weights.length})</h4>
              
              {/* Top Mappings Section */}
              {topMappings.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Most Used</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {topMappings.map(mapping => (
                      <div key={mapping.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm text-green-900">"{mapping.keyword}"</div>
                            <div className="text-xs text-green-700">→ {mapping.accountName}</div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => startEdit(mapping)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            {!mapping.isDefault && (
                              <button 
                                onClick={() => handleDeleteWeight(mapping.id)}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Used {mapping.usageCount} times • {mapping.weight}% confidence
                          {mapping.isDefault && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Default</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Mappings Table (Simplified) */}
              {weights.length > 6 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">All Mappings</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Keyword</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Account</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Confidence</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Usage</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weights.slice(6).map((weight) => (
                          <tr key={weight.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3">
                              <span className="font-medium text-gray-900">{weight.keyword}</span>
                              {weight.isDefault && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-700">{weight.accountName}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${weight.weight}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600">{weight.weight}%</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-700 text-xs">
                              {weight.usageCount} times
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(weight)}
                                  className="text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                  Edit
                                </button>
                                {!weight.isDefault && (
                                  <button
                                    onClick={() => handleDeleteWeight(weight.id)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">🎯</div>
              <p className="text-gray-600 font-medium">No keyword mappings yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Add keyword mappings to improve smart suggestions for your transactions.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Your First Mapping
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Smart Suggestions Work</h4>
            <p className="text-sm text-blue-700">
              Keyword mappings help the system suggest the right accounts when you type descriptions like "sold products" or "bought inventory". 
              Higher weights (0-100) make suggestions more likely to appear. You can also scope mappings to specific transaction types.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartSuggestionsSection; 