/**
 * ID 270: Accounting Journal Lines (CTS_ACCOUNTING_JOURNAL_LINES)
 * Stored Procedure: CTS_ACCOUNTING_JOURNAL_LINES
 */
import { getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_ACCOUNTING_JOURNAL_LINES';

export function buildParams(params) {
  const { settlementId, limit_rows } = params;
  
  if (!settlementId) {
    throw new Error('Parameter "settlementId" is required. Example: { "settlementId": "23405515541", "limit_rows": 1000 }');
  }

  const pSettlementId = String(settlementId).trim();
  const limitRows = getInt(limit_rows) || 1000;

  return [pSettlementId, limitRows];
}

