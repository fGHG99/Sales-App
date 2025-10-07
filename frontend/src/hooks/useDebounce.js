import { useState, useEffect } from "react";

/**
 * Custom hook untuk debouncing value
 * @param {any} value - Value yang akan di-debounce
 * @param {number} delay - Delay dalam milliseconds (default: 500ms)
 * @returns {any} - Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debounced value setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function untuk clear timeout jika value berubah sebelum delay selesai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
