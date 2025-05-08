interface CategorySuggestion {
    type: string;
    subtype?: string;
    confidence: number;
  }
  
  export const suggestCategory = (description: string): CategorySuggestion => {
    const desc = description.toLowerCase();
    
    if (desc.includes("uber") || desc.includes("lyft")) {
      return { type: "Expenses", subtype: "Travel", confidence: 0.95 };
    }
    if (desc.includes("walmart") || desc.includes("groceries")) {
      return { type: "Expenses", subtype: "Supplies", confidence: 0.9 };
    }
    if (desc.includes("stripe") || desc.includes("client payment")) {
      return { type: "Income", subtype: "Sales", confidence: 0.9 };
    }
    if (desc.includes("rent") || desc.includes("lease")) {
      return { type: "Expenses", subtype: "Rent", confidence: 0.92 };
    }
  
    return { type: "Uncategorized", confidence: 0.5 };
  };
  