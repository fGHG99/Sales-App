/**
 * Format number to Indonesian Rupiah (IDR) currency
 * @param {number} amount - Amount to format
 * @param {boolean} withDecimals - Include decimal places (default: false)
 * @returns {string} Formatted currency string
 *
 * @example
 * formatCurrency(150000) // "Rp 150.000"
 * formatCurrency(150000.50, true) // "Rp 150.000,50"
 */
export const formatCurrency = (amount, withDecimals = false) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(Number(amount));
};

/**
 * Format number to compact IDR format (K, M, B)
 * @param {number} amount - Amount to format
 * @returns {string} Compact currency string
 *
 * @example
 * formatCurrencyCompact(1500000) // "Rp 1,5 Jt"
 * formatCurrencyCompact(2500000000) // "Rp 2,5 M"
 */
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }

  const num = Number(amount);

  if (num >= 1000000000) {
    // Miliar
    return `Rp ${(num / 1000000000).toFixed(1)} M`;
  } else if (num >= 1000000) {
    // Juta
    return `Rp ${(num / 1000000).toFixed(1)} Jt`;
  } else if (num >= 1000) {
    // Ribu
    return `Rp ${(num / 1000).toFixed(1)} Rb`;
  } else {
    return `Rp ${num}`;
  }
};

/**
 * Format number without currency symbol
 * @param {number} amount - Amount to format
 * @returns {string} Formatted number string
 *
 * @example
 * formatNumber(150000) // "150.000"
 */
export const formatNumber = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0";
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

/**
 * Parse formatted currency string to number
 * @param {string} currencyString - Formatted currency string
 * @returns {number} Numeric value
 *
 * @example
 * parseCurrency("Rp 150.000") // 150000
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString || typeof currencyString !== "string") {
    return 0;
  }

  // Remove "Rp", spaces, and dots, replace comma with dot
  const cleaned = currencyString
    .replace(/Rp/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");

  return parseFloat(cleaned) || 0;
};

/**
 * Format date to Indonesian locale
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Include time (default: false)
 * @returns {string} Formatted date string
 *
 * @example
 * formatDate(new Date()) // "10 Oktober 2025"
 * formatDate(new Date(), true) // "10 Oktober 2025, 14:30"
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "-";

  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return new Intl.DateTimeFormat("id-ID", options).format(dateObj);
};

/**
 * Format date to short format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 *
 * @example
 * formatDateShort(new Date()) // "10/10/2025"
 */
export const formatDateShort = (date) => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
};

/**
 * Format time to HH:MM format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 *
 * @example
 * formatTime(new Date()) // "14:30"
 */
export const formatTime = (date) => {
  if (!date) return "-";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};
