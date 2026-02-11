/**
 * Utility functions shared across stored procedure mappings
 */

export function getDefaultDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    fecha_desde: '01-01-2000',
    fecha_hasta: `${month}-${day}-${year}`
  };
}

export function getStr(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  return str === '' || str.toLowerCase() === 'null' ? null : str;
}

export function getInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

