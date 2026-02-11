/**
 * ID 268: Exceptions Settlement Detail (CTS_EXCEPTIONS_SETTLEMENT_DETAIL)
 * Stored Procedure: CTS_EXCEPTIONS_SETTLEMENT_DETAIL
 */
import { getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_EXCEPTIONS_SETTLEMENT_DETAIL';

export function buildParams(params) {
  const { settlementId, limit, limit_rows, txn_types_csv, amount_desc_like } = params;
  
  if (!settlementId) {
    throw new Error('Parameter "settlementId" is required. Example: { "settlementId": "23405515541", "limit": 300 }');
  }

  const pSettlementId = String(settlementId).trim();
  const limitRows = getInt(limit) || getInt(limit_rows) || 300;
  const pTxnTypesCsv = getStr(txn_types_csv) || null;
  const pAmountDescLike = getStr(amount_desc_like) || null;

  return [
    pSettlementId,
    limitRows,
    pTxnTypesCsv,
    pAmountDescLike
  ];
}

