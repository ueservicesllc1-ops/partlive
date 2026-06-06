/**
 * Formats large numbers compactly.
 * 1200 -> 1.2K
 * 1500000 -> 1.5M
 */
export const formatCompactNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0';
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return value.toString();
};

/**
 * Formats currency/coins with commas.
 * 150000 -> 150,000
 */
export const formatCoins = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatViewers = formatCompactNumber;
export const formatScore = formatCompactNumber;
