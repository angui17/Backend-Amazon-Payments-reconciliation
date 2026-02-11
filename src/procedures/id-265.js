/**
 * ID 265: Dashboard Header (CTS_RECON_DASHBOARD_HEADER)
 * Stored Procedure: CTS_RECON_DASHBOARD_HEADER
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_RECON_DASHBOARD_HEADER';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, status, limit, limit_records } = params;
  const defaults = getDefaultDates();
  
  const fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  const fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const pStatus = getStr(status) || 'ALL';
  const limitRecords = getInt(limit) || getInt(limit_records) || 50;

  return [fechaDesde, fechaHasta, pStatus.toUpperCase(), limitRecords];
}

