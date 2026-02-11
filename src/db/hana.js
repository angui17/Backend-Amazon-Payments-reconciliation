import hana from '@sap/hana-client';

let connectionPool = null;

/**
 * Get database name from environment (for use in SP calls, not connection)
 */
export function getDatabaseName() {
  const databaseName = process.env.HANA_DATABASE?.trim();
  return (databaseName && databaseName !== '') ? databaseName : null;
}

/**
 * Create HANA connection using environment variables
 * Note: databaseName is NOT included in connection params, but will be used when calling stored procedures
 */
export function createConnection() {
  // Build connection parameters (NO databaseName, NO schema, NO SSL)
  const connectionParams = {
    serverNode: process.env.HANA_SERVER || 'localhost:30015',
    uid: process.env.HANA_USER || '',
    pwd: process.env.HANA_PASSWORD || ''
  };

  const databaseName = getDatabaseName();

  console.log('Connecting to HANA:', {
    serverNode: connectionParams.serverNode,
    databaseName: databaseName || '(not specified - will be used in SP calls)',
    uid: connectionParams.uid
  });

  try {
    const conn = hana.createConnection();
    // HANA client uses synchronous connect
    conn.connect(connectionParams);
    console.log('✅ Connected to HANA successfully');
    return conn;
  } catch (error) {
    console.error('❌ Error creating HANA connection:', error);
    console.error('Connection params used:', {
      serverNode: connectionParams.serverNode,
      uid: connectionParams.uid
    });
    throw new Error(`Failed to connect to HANA: ${error.message}`);
  }
}

/**
 * Execute a stored procedure and return the result
 * @param {Object} connection - HANA connection object
 * @param {string} procedureName - Name of the stored procedure
 * @param {Array} params - Array of parameters for the stored procedure
 * @returns {Promise<any>} - Result from the stored procedure (usually JSON string)
 */
export async function executeStoredProcedure(connection, procedureName, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // Get database name to prepend to stored procedure name
      const databaseName = getDatabaseName();
      
      // Build the full procedure name: "DATABASE"."PROCEDURE" or "PROCEDURE"
      let fullProcedureName = procedureName;
      if (databaseName) {
        // If database name is provided, prepend it: "DATABASE"."PROCEDURE"
        fullProcedureName = `"${databaseName}"."${procedureName}"`;
      } else {
        // Otherwise just use the procedure name with quotes
        fullProcedureName = `"${procedureName}"`;
      }
      
      const paramPlaceholders = params.map((_, i) => '?').join(', ');
      const sql = `CALL ${fullProcedureName}(${paramPlaceholders})`;
      console.log(`Executing: ${sql}`);
      console.log('Parameters:', params);

      // Use prepare() and then execute() with parameters array
      const stmt = connection.prepare(sql);
      
      // Execute with parameters directly (correct API for @sap/hana-client)
      const resultSet = stmt.executeQuery(params);
      
      let result = null;
      if (resultSet && resultSet.next()) {
        // Get the first column (index 0) which should contain the JSON string
        try {
          result = resultSet.getString(0);
        } catch (e) {
          // Try to get as any type if getString fails
          try {
            result = resultSet.getValue(0);
            if (result !== null && result !== undefined) {
              result = String(result);
            }
          } catch (e2) {
            console.warn('Could not read result from stored procedure');
          }
        }
      }
      
      if (resultSet) {
        resultSet.close();
      }
      stmt.drop();
      
      if (!result || (typeof result === 'string' && result.trim() === '')) {
        resolve(null);
      } else {
        resolve(result);
      }
    } catch (error) {
      console.error(`Error executing stored procedure ${procedureName}:`, error);
      reject(error);
    }
  });
}

/**
 * Close a HANA connection
 */
export function closeConnection(connection) {
  try {
    if (connection) {
      connection.disconnect();
    }
  } catch (error) {
    console.error('Error closing connection:', error);
  }
}


export async function executeQuery(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = connection.prepare(sql)
      const rs = stmt.executeQuery(params)

      const rows = []
      while (rs && rs.next()) {
        const meta = rs.getMetaData()
        const obj = {}
        for (let i = 1; i <= meta.getColumnCount(); i++) {
          const col = meta.getColumnName(i)
          obj[col] = rs.getValue(i)
        }
        rows.push(obj)
      }

      if (rs) rs.close()
      stmt.drop()
      resolve(rows)
    } catch (err) {
      reject(err)
    }
  })
}

export async function executeNonQuery(connection, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = connection.prepare(sql)
      stmt.execute(params)
      stmt.drop()
      resolve(true)
    } catch (err) {
      reject(err)
    }
  })
}
