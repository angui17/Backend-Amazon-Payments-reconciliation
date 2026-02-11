/**
 * ID 279: Exceptions Pareto Global (CTS_EXCEPTIONS_PARETO_GLOBAL)
 * Stored Procedure: CTS_EXCEPTIONS_PARETO_GLOBAL
 */
import { getDefaultDates, getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_EXCEPTIONS_PARETO_GLOBAL';

export function buildParams(params) {
  const { fecha_desde, fecha_hasta, status, only_exceptions, top_n, limit_settlements, limit_records } = params;
  const defaults = getDefaultDates();
  
  const fechaDesde = getStr(fecha_desde) || defaults.fecha_desde;
  const fechaHasta = getStr(fecha_hasta) || defaults.fecha_hasta;
  const pStatus = getStr(status) || 'ALL';
  const onlyExceptions = getInt(only_exceptions) !== null ? getInt(only_exceptions) : 1;
  const topN = getInt(top_n) || 20;
  const limitSettlements = getInt(limit_settlements) || 200;

  return [fechaDesde, fechaHasta, pStatus.toUpperCase(), onlyExceptions, topN, limitSettlements];
}

