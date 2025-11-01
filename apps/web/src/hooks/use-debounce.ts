 
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [value_, setValue_] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setValue_(value);
    }, delay);

    // Cleanup function to cancel the timeout if the value changes again
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return value_;
}