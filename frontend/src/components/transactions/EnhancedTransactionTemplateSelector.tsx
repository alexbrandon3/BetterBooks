import React, { useState, useEffect, useRef } from 'react';
import { TransactionTemplate } from '../../types/transaction';
import { Account } from '../../types/account';
import { fetchTransactionTemplates, createTransactionTemplate, deleteTransactionTemplate } from '../../services/TransactionTemplateService';
import { toast } from 'react-hot-toast';

interface EnhancedTransactionTemplateSelectorProps {
  selectedTemplate: TransactionTemplate | null;
  onTemplateSelect: (template: TransactionTemplate) => void;
  onTemplateClear: () => void;
  accounts: Account[];
  onEntriesUpdate: (entries: any[]) => void;
  onTransactionTypeUpdate?: (type: string) => void;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: (template: TransactionTemplate) => void;
  accounts: Account[];
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateCreated,
  accounts
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('INCOME');
  const [requiredAccounts, setRequiredAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

  const addRequiredAccount = () => {
    setRequiredAccounts([...requiredAccounts, {
      accountType: 'ASSET',
      entryType: 'DEBIT',
      description: '',
      isDebit: true
    }]);
  };

  const removeRequiredAccount = (index: number) => {
    setRequiredAccounts(requiredAccounts.filter((_, i) => i !== index));
  };

  const updateRequiredAccount = (index: number, field: string, value: any) => {
    const updated = [...requiredAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setRequiredAccounts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || requiredAccounts.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const template = await createTransactionTemplate({
        name,
        description,
        type,
        requiredAccounts
      });
      
      onTemplateCreated(template);
      onClose();
      toast.success('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Transaction Template</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="e.g., Monthly Rent Payment"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Describe what this template is for"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="LOAN_PAYMENT">Loan Payment</option>
              <option value="ASSET_PURCHASE">Asset Purchase</option>
              <option value="LIABILITY_SETTLEMENT">Liability Settlement</option>
              <option value="EQUITY_CONTRIBUTION">Equity Contribution</option>
              <option value="EQUITY_WITHDRAWAL">Equity Withdrawal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Accounts *
            </label>
            {requiredAccounts.map((account, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  value={account.accountType}
                  onChange={(e) => updateRequiredAccount(index, 'accountType', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  {accountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={account.entryType}
                  onChange={(e) => updateRequiredAccount(index, 'entryType', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
                <input
                  type="text"
                  value={account.description}
                  onChange={(e) => updateRequiredAccount(index, 'description', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Account description"
                />
                <button
                  type="button"
                  onClick={() => removeRequiredAccount(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRequiredAccount}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Required Account
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EnhancedTransactionTemplateSelector: React.FC<EnhancedTransactionTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onTemplateClear,
  accounts,
  onEntriesUpdate,
  onTransactionTypeUpdate
}) => {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTransactionTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
    };

    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplates]);

  const handleTemplateSelect = (template: TransactionTemplate) => {
    onTemplateSelect(template);
    
    // Update transaction type based on template
    if (onTransactionTypeUpdate) {
      onTransactionTypeUpdate(template.type);
    }
    
    // Auto-populate entries based on template
    const entries = template.requiredAccounts.map((account, index) => {
      // Find matching accounts by type
      const matchingAccounts = accounts.filter(acc => 
        acc.type.toLowerCase() === account.accountType.toLowerCase()
      );
      
      return {
        accountId: matchingAccounts.length > 0 ? matchingAccounts[0].id.toString() : '',
        amount: '',
        type: account.entryType,
        description: account.description
      };
    });

    // Add optional accounts if they exist
    if (template.optionalAccounts) {
      template.optionalAccounts.forEach((account, index) => {
        const matchingAccounts = accounts.filter(acc => 
          acc.type.toLowerCase() === account.accountType.toLowerCase()
        );
        
        entries.push({
          accountId: matchingAccounts.length > 0 ? matchingAccounts[0].id.toString() : '',
          amount: '',
          type: account.entryType,
          description: account.description
        });
      });
    }

    onEntriesUpdate(entries);
    setShowTemplates(false);
  };

  const handleTemplateCreated = (template: TransactionTemplate) => {
    setTemplates([...templates, template]);
    setShowCreateModal(false);
  };

  const getTemplateDescription = (template: TransactionTemplate) => {
    const accountTypes = template.requiredAccounts.map(acc => acc.accountType).join(' + ');
    return `${template.description} (${accountTypes})`;
  };

  const systemTemplates = templates.filter(t => !t.name.includes('Custom'));
  const userTemplates = templates.filter(t => t.name.includes('Custom'));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Transaction Template
        </label>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Create Custom Template
        </button>
      </div>

      {selectedTemplate && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div>
            <div className="font-medium text-blue-900">{selectedTemplate.name}</div>
            <div className="text-sm text-blue-700">{getTemplateDescription(selectedTemplate)}</div>
          </div>
          <button
            type="button"
            onClick={onTemplateClear}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
      )}

      {!selectedTemplate && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Loading templates...' : 'Select a transaction template (optional)'}
          </button>

          {showTemplates && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {systemTemplates.length > 0 && (
                <div className="p-2 bg-gray-50 border-b">
                  <div className="text-xs font-medium text-gray-500 uppercase">System Templates</div>
                </div>
              )}
              {systemTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{getTemplateDescription(template)}</div>
                </button>
              ))}

              {userTemplates.length > 0 && (
                <div className="p-2 bg-blue-50 border-b">
                  <div className="text-xs font-medium text-blue-500 uppercase">Your Templates</div>
                </div>
              )}
              {userTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{getTemplateDescription(template)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTemplateCreated={handleTemplateCreated}
        accounts={accounts}
      />
    </div>
  );
}; 