import React, { useState, useEffect } from 'react';
import { NavigationContext } from './useNavigation';
import type { ViewType } from '../types';

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewType>(() => {
    const path = window.location.pathname;
    if (path === '/cockpit') return 'cockpit';
    if (path === '/department-cockpit') return 'dept_cockpit';
    return 'table';
  });

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(() => {
    return localStorage.getItem('selectedDepartmentId');
  });

  useEffect(() => {
    if (selectedDepartmentId) {
      localStorage.setItem('selectedDepartmentId', selectedDepartmentId);
    } else {
      localStorage.removeItem('selectedDepartmentId');
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    let path = '/';
    if (view === 'cockpit') path = '/cockpit';
    if (view === 'dept_cockpit') path = '/department-cockpit';
    
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [view]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/cockpit') setView('cockpit');
      else if (path === '/department-cockpit') setView('dept_cockpit');
      else setView('table');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <NavigationContext.Provider value={{ view, setView, selectedDepartmentId, setSelectedDepartmentId }}>
      {children}
    </NavigationContext.Provider>
  );
};
