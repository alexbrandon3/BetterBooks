import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  isActive: boolean;
}

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  accounts: [],
  isLoading: false,
  error: null,
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload;
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.push(action.payload);
    },
    updateAccount: (state, action: PayloadAction<Partial<Account> & { id: string }>) => {
      const index = state.accounts.findIndex(account => account.id === action.payload.id);
      if (index !== -1) {
        state.accounts[index] = { ...state.accounts[index], ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setAccounts, addAccount, updateAccount, setLoading, setError } = accountsSlice.actions;
export default accountsSlice.reducer; 