
import { useState, useEffect } from 'react';

export const useStorageQuota = () => {
  const [quota, setQuota] = useState({ used: 0, total: 5000000, percentage: 0 }); // Approx 5MB

  const checkQuota = () => {
    let totalUsed = 0;
    for (let x in localStorage) {
      if (!localStorage.hasOwnProperty(x)) continue;
      totalUsed += ((localStorage[x].length + x.length) * 2);
    }
    
    // Convert bytes to chars approx (JS strings are utf-16, roughly 2 bytes)
    // LocalStorage limit is usually 5MB characters ~ 10MB bytes, but safer to assume 5MB bytes for broad support.
    const percentage = (totalUsed / 5000000) * 100;
    
    setQuota({
      used: totalUsed,
      total: 5000000,
      percentage: Math.min(percentage, 100)
    });
  };

  useEffect(() => {
    checkQuota();
    const interval = setInterval(checkQuota, 5000); // Check every 5 seconds
    window.addEventListener('storage', checkQuota); // Listen for cross-tab changes
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkQuota);
    };
  }, []);

  return quota;
};
