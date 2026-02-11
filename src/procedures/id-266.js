/**
 * ID 266: Settlement Detail (CTS_RECON_SETTLEMENT_DETAIL)
 * Stored Procedure: CTS_RECON_SETTLEMENT_DETAIL
 */
import { getStr, getInt } from '../utils/helpers.js';

export const procedureName = 'CTS_RECON_SETTLEMENT_DETAIL';

export function buildParams(params) {
  const { settlementId, limit, limit_rows } = params;
  
  if (!settlementId) {
    throw new Error('Parameter "settlementId" is required. Example: { "settlementId": "23405515541" }');
  }

  const pSettlementId = String(settlementId).trim();
  const limitRows = getInt(limit) || getInt(limit_rows) || 500;

  return [pSettlementId, limitRows];
}

