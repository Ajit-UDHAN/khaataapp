import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const { user } = useAuth();
  
  // Create user-specific key
  const userKey = user ? `${user.id}_${key}` : `guest_${key}`;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${userKey}":`, error);
      return initialValue;
    }
  });

  // Update stored value when user changes
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(userKey);
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
    } catch (error) {
      console.error(`Error reading localStorage key "${userKey}":`, error);
      setStoredValue(initialValue);
    }
  }, [userKey, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(userKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${userKey}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}