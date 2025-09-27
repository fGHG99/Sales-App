import { useState, useEffect, useRef } from 'react';

const useThrottle = (value, delay) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() >= lastExecuted.current + delay) {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }
    }, delay - (Date.now() - lastExecuted.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

export default useThrottle;