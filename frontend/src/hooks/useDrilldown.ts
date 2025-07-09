import { useState } from 'react';

interface DrilldownState {
  isOpen: boolean;
  reportSection: string;
  type: string;
  accountId?: number;
  subcategory?: string;
  startDate?: string;
  endDate?: string;
}

export const useDrilldown = () => {
  const [drilldownState, setDrilldownState] = useState<DrilldownState>({
    isOpen: false,
    reportSection: '',
    type: '',
    accountId: undefined,
    subcategory: undefined,
    startDate: undefined,
    endDate: undefined
  });

  const openDrilldown = (
    reportSection: string,
    type: string,
    accountId?: number,
    subcategory?: string,
    startDate?: string,
    endDate?: string
  ) => {
    setDrilldownState({
      isOpen: true,
      reportSection,
      type,
      accountId,
      subcategory,
      startDate,
      endDate
    });
  };

  const closeDrilldown = () => {
    setDrilldownState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return {
    ...drilldownState,
    openDrilldown,
    closeDrilldown
  };
}; 