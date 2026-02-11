/**
 * ID 278: Accounting GL Summary (CTS_ACCOUNTING_GL_SUMMARY)
 * Stored Procedure: CTS_ACCOUNTING_GL_SUMMARY
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_ACCOUNTING_GL_SUMMARY';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, status, settlementId, account_like, limit_accounts, limit_records } = params;
  const defaults = getDefaultDates();
  
  const fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  const fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const pStatus = getStr(status) || 'ALL';
  const pSettlementId = getStr(settlementId) || null;
  const pAccountLike = getStr(account_like) || null;
  const limitAccounts = getInt(limit_accounts) || getInt(limit_records) || 200;

  return [
    fechaDesde,
    fechaHasta,
    pStatus.toUpperCase(),
    pSettlementId,
    pAccountLike,
    limitAccounts
  ];
}

