/**
 * ID 271: Monthly Report Summary (CTS_REPORT_MONTHLY_RECON_SUMMARY)
 * Stored Procedure: CTS_REPORT_MONTHLY_RECON_SUMMARY
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_REPORT_MONTHLY_RECON_SUMMARY';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, status, limit_months, top_causes_n, limit_records } = params;
  const defaults = getDefaultDates();
  
  const fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  const fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const pStatus = getStr(status) || 'ALL';
  const limitMonths = getInt(limit_months) || 24;
  const topCausesN = getInt(top_causes_n) || 10;

  return [fechaDesde, fechaHasta, pStatus.toUpperCase(), limitMonths, topCausesN];
}

