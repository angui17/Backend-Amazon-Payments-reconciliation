/**
 * ID 257: Orders (get_orders_amazon)
 * Stored Procedure: CTS_ORDERS_RECONCILIATIONS
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_ORDERS_RECONCILIATIONS';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, last, limit } = params;
  const defaults = getDefaultDates();
  
  let fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  let fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const limitRecords = getInt(last) || getInt(limit) || 10;

  // If last is requested, use wide date range
  if (last) {
    fechaDesde = '01-01-2000';
    fechaHasta = defaults.fecha_hasta;
  }

  return [fechaDesde, fechaHasta, limitRecords];
}

