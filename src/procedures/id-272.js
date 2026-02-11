/**
 * ID 272: Settlement Export Report (CTS_REPORT_SETTLEMENT_EXPORT)
 * Stored Procedure: CTS_REPORT_SETTLEMENT_EXPORT
 */
import { getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_REPORT_SETTLEMENT_EXPORT';

export function buildParams(params) {
  const { settlementId, limit_rows, txn_types_csv, amount_desc_like } = params;

  if (!settlementId) {
    throw new Error('Parameter "settlementId" is required. Example: { "settlementId": "23405515541", "limit_rows": 5000 }');
  }

  const pSettlementId = String(settlementId).trim();
  const limitRows = getInt(limit_rows) || 5000;
  const pTxnTypesCsv = getStr(txn_types_csv) || null;
  const pAmountDescLike = getStr(amount_desc_like) || null;

  return [
    pSettlementId,
    limitRows,
    pTxnTypesCsv,
    pAmountDescLike
  ];
}