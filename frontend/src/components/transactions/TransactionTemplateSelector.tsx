import React, { useState, useEffect } from 'react';
import { TransactionTemplate } from '../../types/transaction';
import { Account } from '../../types/account';

interface TransactionTemplateSelectorProps {
  selectedTemplate: TransactionTemplate | null;
  onTemplateSelect: (template: TransactionTemplate) => void;
  onTemplateClear: () => void;
  accounts: Account[];
  onEntriesUpdate: (entries: any[]) => void;
}

export const TransactionTemplateSelector: React.FC<TransactionTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onTemplateClear,
  accounts,
  onEntriesUpdate
}) => {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/transactions/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateSelect = (template: TransactionTemplate) => {
    onTemplateSelect(template);
    
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

  const getTemplateDescription = (template: TransactionTemplate) => {
    const accountTypes = template.requiredAccounts.map(acc => acc.accountType).join(' + ');
    return `${template.description} (${accountTypes})`;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Transaction Template
        </label>
        {selectedTemplate && (
          <button
            type="button"
            onClick={onTemplateClear}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear Template
          </button>
        )}
      </div>

      {selectedTemplate ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">{selectedTemplate.name}</h4>
              <p className="text-sm text-blue-700">{selectedTemplate.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change Template
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? 'Loading templates...' : 'Select a transaction template (optional)'}
          </button>

          {showTemplates && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {templates.map((template, index) => (
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
    </div>
  );
}; 