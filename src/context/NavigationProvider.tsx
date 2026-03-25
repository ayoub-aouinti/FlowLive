import React, { useState } from 'react';
import { NavigationContext } from './useNavigation';
import type { ViewType } from '../types';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewType>('table');

  return (
    <NavigationContext.Provider value={{ view, setView }}>
      {children}
    </NavigationContext.Provider>
  );
};
