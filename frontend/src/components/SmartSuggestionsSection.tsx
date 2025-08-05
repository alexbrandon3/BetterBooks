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

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Smart Suggestions</h2>
        <div className="flex gap-2">
          <button
            onClick={handleInitializeDefaults}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Initialize Defaults
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Add Mapping
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingWeight) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">
            {editingWeight ? 'Edit Keyword Mapping' : 'Add New Keyword Mapping'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keyword *
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., sold, bought, rent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (0-100)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-gray-500 mt-1">{formData.weight}%</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type (Optional)
              </label>
              <select
                value={formData.transactionType || ''}
                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Any Type</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingWeight ? handleEditWeight : handleAddWeight}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingWeight ? 'Update' : 'Add Mapping'}
            </button>
            <button
              onClick={editingWeight ? cancelEdit : () => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Weights Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading smart suggestions...</div>
        </div>
      ) : weights.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Keyword</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Account</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Weight</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {weights.map((weight) => (
                <tr key={weight.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{weight.keyword}</span>
                    {weight.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">{weight.accountName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${weight.weight}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{weight.weight}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {getTransactionTypeLabel(weight.transactionType)}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {weight.usageCount} times
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(weight)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {!weight.isDefault && (
                        <button
                          onClick={() => handleDeleteWeight(weight.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
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
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">🎯</div>
          <p className="text-gray-600 font-medium">No keyword mappings yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add keyword mappings to improve smart suggestions for your transactions.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
    </div>
  );
};

export default SmartSuggestionsSection; 