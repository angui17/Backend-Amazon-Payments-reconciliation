/**
 * ID 277: Accounting Posting Status (CTS_ACCOUNTING_POSTING_STATUS)
 * Stored Procedure: CTS_ACCOUNTING_POSTING_STATUS
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_ACCOUNTING_POSTING_STATUS';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, status, limit_records } = params;
  const defaults = getDefaultDates();
  
  const fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  const fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const pStatus = getStr(status) || 'ALL';
  const limitRecords = getInt(limit_records) || 200;

  return [
    fechaDesde,
    fechaHasta,
    pStatus.toUpperCase(),
    limitRecords
  ];
}

