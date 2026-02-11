/**
 * ID 262: Payments/Inpayments (CTS_AMAZON_INPAYMENTS_RECONCILIATIONS)
 * Stored Procedure: CTS_AMAZON_INPAYMENTS_RECONCILIATIONS
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_AMAZON_INPAYMENTS_RECONCILIATIONS';

export function buildParams(params) {
  const { type, fecha_desde, fecha_hasta, last, limit } = params;
  const defaults = getDefaultDates();
  
  if (!type) {
    throw new Error('Parameter "type" is required. Example: { "type": "Order", "last": 10 }');
  }

  let fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  let fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const limitRecords = getInt(last) || getInt(limit) || 10;

  // Normalize type
  const pType = String(type).trim().toUpperCase();

  // If last is requested, use wide date range
  if (last) {
    fechaDesde = '01-01-2000';
    fechaHasta = defaults.fecha_hasta;
  }

  return [pType, fechaDesde, fechaHasta, limitRecords];
}

