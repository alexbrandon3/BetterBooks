import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BusinessState {
  id: string | null;
  name: string;
  entityType: string;
  industry: string;
  fiscalYearStart: string;
  isSetupComplete: boolean;
}

const initialState: BusinessState = {
  id: null,
  name: '',
  entityType: '',
  industry: '',
  fiscalYearStart: '',
  isSetupComplete: false,
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusiness: (state, action: PayloadAction<Partial<BusinessState>>) => {
      return { ...state, ...action.payload };
    },
    completeSetup: (state) => {
      state.isSetupComplete = true;
    },
  },
});

export const { setBusiness, completeSetup } = businessSlice.actions;
export default businessSlice.reducer; 