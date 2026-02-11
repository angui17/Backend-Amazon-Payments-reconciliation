import { createConnection, executeStoredProcedure, closeConnection } from '../db/hana.js';
import { getStoredProcedureMapping } from '../mappings/sp-mappings.js';

/**
 * Process request from frontend (compatible with IDA Dynamics format)
 */
export async function processRequest(req) {
  // Get ID from header (case-insensitive)
  const id = req.headers.id || req.headers.Id || req.headers.ID;
  const body = req.body || {};
  
  // Extract all parameters from body
  const { type, types, engine, ...params } = body;
  
  // Merge all params including type and types
  const allParams = {
    type,
    types,
    ...params
  };

  if (!id) {
    return {
      id: -400,
      Message: 'Header "Id" is required'
    };
  }

  const spMapping = getStoredProcedureMapping(parseInt(id));
  
  if (!spMapping) {
    return {
      id: -404,
      Message: `No stored procedure mapping found for ID: ${id}`
    };
  }

  const { procedureName, buildParams } = spMapping;
  let connection = null;

  try {
    // Build parameters based on the mapping
    const spParams = buildParams(allParams);
    
    console.log(`Processing request ID ${id} -> ${procedureName}`);
    console.log('Built params:', spParams);
    
    // Create connection and execute stored procedure
    connection = createConnection();
    const resultJson = await executeStoredProcedure(connection, procedureName, spParams);

    if (!resultJson || (typeof resultJson === 'string' && resultJson.trim() === '')) {
      return {
        id: -500,
        Message: 'SP no devolvió datos.'
      };
    }

    // Parse JSON result
    try {
      const parsed = JSON.parse(resultJson);
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw result:', resultJson);
      return {
        id: -501,
        Message: 'SP devolvió un JSON inválido.'
      };
    }
  } catch (error) {
    console.error(`Error processing request for ID ${id}:`, error);
    return {
      id: -500,
      Message: error.message || 'Error executing stored procedure'
    };
  } finally {
    if (connection) {
      closeConnection(connection);
    }
  }
}

