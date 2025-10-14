import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "courier_awaiting_proof_orders";

/**
 * Custom hook to manage orders awaiting delivery proof upload
 * Uses localStorage for persistence and cross-component synchronization
 */
const useAwaitingProofOrders = () => {
  // Initialize state from localStorage
  const getStoredOrders = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (err) {
      console.error(
        "Error reading awaiting proof orders from localStorage:",
        err
      );
      return new Set();
    }
  };

  const [awaitingProofOrders, setAwaitingProofOrders] =
    useState(getStoredOrders);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const ordersArray = Array.from(awaitingProofOrders);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersArray));

      // Dispatch custom event for cross-component sync
      window.dispatchEvent(new Event("awaitingProofOrdersChanged"));
    } catch (err) {
      console.error("Error saving awaiting proof orders to localStorage:", err);
    }
  }, [awaitingProofOrders]);

  // Listen for changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setAwaitingProofOrders(getStoredOrders());
    };

    // Listen to storage events (from other tabs)
    window.addEventListener("storage", handleStorageChange);

    // Listen to custom events (from same tab, other components)
    window.addEventListener("awaitingProofOrdersChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "awaitingProofOrdersChanged",
        handleStorageChange
      );
    };
  }, []);

  // Add order to awaiting proof set
  const addAwaitingProofOrder = useCallback((orderId) => {
    setAwaitingProofOrders((prev) => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
  }, []);

  // Remove order from awaiting proof set
  const removeAwaitingProofOrder = useCallback((orderId) => {
    setAwaitingProofOrders((prev) => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  }, []);

  // Check if order is awaiting proof
  const isAwaitingProof = useCallback(
    (orderId) => {
      return awaitingProofOrders.has(orderId);
    },
    [awaitingProofOrders]
  );

  // Clear all awaiting proof orders
  const clearAwaitingProofOrders = useCallback(() => {
    setAwaitingProofOrders(new Set());
  }, []);

  return {
    awaitingProofOrders,
    addAwaitingProofOrder,
    removeAwaitingProofOrder,
    isAwaitingProof,
    clearAwaitingProofOrders,
  };
};

export default useAwaitingProofOrders;
