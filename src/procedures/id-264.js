/**
 * ID 264: Inpayments Fees (CTS_AMAZON_INPAYMENTS_FEES_RECONCILIATIONS)
 * Stored Procedure: CTS_AMAZON_INPAYMENTS_FEES_RECONCILIATIONS
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_AMAZON_INPAYMENTS_FEES_RECONCILIATIONS';

export function buildParams(params) {
  const { types, fecha_desde, fecha_hasta, last, limit } = params;
  const defaults = getDefaultDates();
  
  if (!types) {
    throw new Error('Parameter "types" (CSV) is required. Example: { "types": "AmazonFees,FBAFees", "last": 10 }');
  }

  let fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  let fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const limitRecords = getInt(last) || getInt(limit) || 10;

  // If last is requested, use wide date range
  if (last) {
    fechaDesde = '01-01-2000';
    fechaHasta = defaults.fecha_hasta;
  }

  return [String(types), fechaDesde, fechaHasta, limitRecords];
}

