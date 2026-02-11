// import express from 'express'
// import { createConnection, closeConnection, executeQuery, executeNonQuery } from '../db/hana.js'

// export const meProfileRouter = express.Router()

// const HANA_SCHEMA = process.env.HANA_SCHEMA || 'SBO_COPA_LIVE'
// const PORTAL_TABLE = 'PORTAL_USER_PROFILE'

// function requireIdentity(req) {
//   const sapUser = req.header('x-sap-user')
//   const companyDb = req.header('x-company-db')

//   if (!sapUser || !companyDb) {
//     const err = new Error('Missing identity headers: x-sap-user, x-company-db')
//     err.status = 400
//     throw err
//   }

//   return {
//     sapUser: String(sapUser).trim(),
//     companyDb: String(companyDb).trim(),
//     userKey: `${companyDb}|${sapUser}`,
//   }
// }

// function qTable(tableName) {
//   return `"${HANA_SCHEMA}"."${tableName}"`
// }

// // --- SAP OUSR (solo lectura) ---
// async function readSapUser(conn, sapUser) {
//   const sql = `
//     SELECT
//       USER_CODE,
//       U_NAME,
//       E_Mail,
//       Department,
//       lastLogin,
//       LstLogoutD,
//       LstLoginT,
//       LstLogoutT
//     FROM OUSR
//     WHERE USER_CODE = ?
//     LIMIT 1
//   `
//   const rows = await executeQuery(conn, sql, [sapUser])
//   return rows[0] || null
// }

// // --- Portal Profile (editable) ---
// async function readPortalProfile(conn, companyDb, sapUser) {
//   const sql = `
//     SELECT
//       CompanyDb,
//       SapUser,
//       FullName,
//       Email,
//       Phone,
//       Department,
//       JobTitle,
//       AvatarUrl,
//       UpdatedAt
//     FROM ${qTable(PORTAL_TABLE)}
//     WHERE CompanyDb = ? AND SapUser = ?
//     LIMIT 1
//   `
//   const rows = await executeQuery(conn, sql, [companyDb, sapUser])
//   return rows[0] || null
// }

// async function upsertPortalProfile(conn, companyDb, sapUser, updates) {
//   const now = new Date().toISOString()

//   const fullName = (updates.fullName ?? '').toString()
//   const email = (updates.email ?? '').toString()
//   const phone = (updates.phone ?? '').toString()
//   const department = (updates.department ?? '').toString()
//   const jobTitle = (updates.jobTitle ?? '').toString()
//   const avatarUrl = updates.avatarUrl ?? null

//   // MERGE para UPSERT
//   const sql = `
//     MERGE INTO ${qTable(PORTAL_TABLE)} AS T
//     USING (SELECT ? AS CompanyDb, ? AS SapUser FROM DUMMY) AS S
//     ON (T.CompanyDb = S.CompanyDb AND T.SapUser = S.SapUser)
//     WHEN MATCHED THEN UPDATE SET
//       FullName   = ?,
//       Email      = ?,
//       Phone      = ?,
//       Department = ?,
//       JobTitle   = ?,
//       AvatarUrl  = ?,
//       UpdatedAt  = ?
//     WHEN NOT MATCHED THEN INSERT
//       (CompanyDb, SapUser, FullName, Email, Phone, Department, JobTitle, AvatarUrl, UpdatedAt)
//     VALUES
//       (?, ?, ?, ?, ?, ?, ?, ?, ?)
//   `

//   const params = [
//     companyDb, sapUser,
//     fullName, email, phone, department, jobTitle, avatarUrl, now,
//     companyDb, sapUser, fullName, email, phone, department, jobTitle, avatarUrl, now,
//   ]

//   await executeNonQuery(conn, sql, params)
//   return readPortalProfile(conn, companyDb, sapUser)
// }

// function mapResponse({ userKey, sapUser, companyDb, sapRow, portalRow }) {
//   // Nota: HANA devuelve columnas en MAYÚSCULA generalmente.
//   const portal = portalRow || {}
//   const sap = sapRow || null

//   return {
//     userKey,
//     sapUser,
//     companyDb,

//     // Portal (editable)
//     fullName: portal.FULLNAME || '',
//     email: portal.EMAIL || '',
//     phone: portal.PHONE || '',
//     department: portal.DEPARTMENT || '',
//     jobTitle: portal.JOBTITLE || '',
//     avatarUrl: portal.AVATARURL || null,
//     updatedAt: portal.UPDATEDAT || null,

//     // SAP (read-only)
//     sap: sap ? {
//       userCode: sap.USER_CODE,
//       userName: sap.U_NAME,
//       email: sap.E_MAIL,
//       department: sap.DEPARTMENT,
//       lastLogin: sap.LASTLOGIN,
//       lstLogoutD: sap.LSTLOGOUTD,
//       lstLoginT: sap.LSTLOGINT,
//       lstLogoutT: sap.LSTLOGOUTT,
//     } : null,
//   }
// }

// // ✅ GET /api/me/profile
// meProfileRouter.get('/profile', async (req, res) => {
//   let conn = null
//   try {
//     const { sapUser, companyDb, userKey } = requireIdentity(req)
//     conn = createConnection()

//     const [sapRow, portalRow] = await Promise.all([
//       readSapUser(conn, sapUser),
//       readPortalProfile(conn, companyDb, sapUser),
//     ])

//     res.json(mapResponse({ userKey, sapUser, companyDb, sapRow, portalRow }))
//   } catch (err) {
//     console.error(err)
//     res.status(err.status || 500).json({ Message: err.message || 'Error' })
//   } finally {
//     closeConnection(conn)
//   }
// })

// // ✅ PUT /api/me/profile (solo portal)
// meProfileRouter.put('/profile', async (req, res) => {
//   let conn = null
//   try {
//     const { sapUser, companyDb, userKey } = requireIdentity(req)

//     // Solo permitimos campos del portal
//     const updates = {
//       fullName: req.body?.fullName ?? '',
//       email: req.body?.email ?? '',
//       phone: req.body?.phone ?? '',
//       department: req.body?.department ?? '',
//       jobTitle: req.body?.jobTitle ?? '',
//       avatarUrl: req.body?.avatarUrl ?? null,
//     }

//     conn = createConnection()

//     const portalRow = await upsertPortalProfile(conn, companyDb, sapUser, updates)
//     const sapRow = await readSapUser(conn, sapUser)

//     res.json(mapResponse({ userKey, sapUser, companyDb, sapRow, portalRow }))
//   } catch (err) {
//     console.error(err)
//     res.status(err.status || 500).json({ Message: err.message || 'Error' })
//   } finally {
//     closeConnection(conn)
//   }
// })

// src/routes/meProfile.js
import express from 'express';
import { createConnection, closeConnection } from '../db/hana.js';
import { getStr } from '../utils/helpers.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * Helper: read OUSR basic info
 */
async function readSapUser(hanaConn, sapUser) {
  // Query simple a OUSR
  const sql = `
    SELECT "USER_CODE", "U_NAME", "E_Mail", "Department", "lastLogin", "LstLogoutD", "LstLoginT", "LstLogoutT"
    FROM "SBO_COPA_LIVE"."OUSR"
    WHERE USER_CODE = ? 
    LIMIT 1
  `;

  const stmt = hanaConn.prepare(sql);
  // const rs = stmt.executeQuery([sapUser]);

  // const out = {};
  // if (rs && rs.next()) {
  //   out.userCode = rs.getString(0);
  //   out.fullName = rs.getString(1);
  //   out.email = rs.getString(2); // "E_Mail"
  //   out.department = rs.getString(3);
  //   out.lastLogin = rs.getString(4);
  //   out.lastLogoutDate = rs.getString(5);
  //   out.lastLoginTime = rs.getString(6);
  //   out.lastLogoutTime = rs.getString(7);
  // }
  // if (rs) { rs.close(); }
  // try { stmt.drop(); } catch(e) {}
  // return out;

  const rs = stmt.executeQuery([sapUser]);
  const out = {};
  if (rs && rs.next()) {
    // Usa getValue en lugar de getString
    out.userCode = rs.getValue(0) ? String(rs.getValue(0)) : '';
    out.fullName = rs.getValue(1) ? String(rs.getValue(1)) : '';
    out.email = rs.getValue(2) ? String(rs.getValue(2)) : ''; // "E_Mail"
    out.department = rs.getValue(3) ? String(rs.getValue(3)) : '';
    out.lastLogin = rs.getValue(4) ? String(rs.getValue(4)) : '';
    out.lastLogoutDate = rs.getValue(5) ? String(rs.getValue(5)) : '';
    out.lastLoginTime = rs.getValue(6) ? String(rs.getValue(6)) : '';
    out.lastLogoutTime = rs.getValue(7) ? String(rs.getValue(7)) : '';
    console.log('SAP data for user:', sapUser, out);  
  } else {
    console.log('No SAP data found for user:', sapUser);
  }
  if (rs) { rs.close(); }
  try { stmt.drop(); } catch (e) { }
  return out;
}


/**
 * Helper: read portal profile from PORTAL_USER_PROFILE
 */
async function readPortalProfile(hanaConn, companyDb, sapUser) {
  const sql = `
    SELECT "FULL_NAME", "EMAIL", "PHONE", "DEPARTMENT", "JOB_TITLE", "AVATAR_URL", "PREFERENCES", "UPDATED_AT"
    FROM "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"
    WHERE "COMPANY_DB" = ? AND "SAP_USER" = ?
  `;
  const stmt = hanaConn.prepare(sql);
  const rs = stmt.executeQuery([companyDb, sapUser]);

  let out = null;
  // if (rs && rs.next()) {
  //   out = {
  //     fullName: rs.getString(0),
  //     email: rs.getString(1),
  //     phone: rs.getString(2),
  //     department: rs.getString(3),
  //     jobTitle: rs.getString(4),
  //     avatarUrl: rs.getString(5),
  //     preferences: rs.getString(6),
  //     updatedAt: rs.getString(7)
  //   };
  // }
  if (rs && rs.next()) {
    out = {
      fullName: rs.getValue(0) ? String(rs.getValue(0)) : '',
      email: rs.getValue(1) ? String(rs.getValue(1)) : '',
      phone: rs.getValue(2) ? String(rs.getValue(2)) : '',
      department: rs.getValue(3) ? String(rs.getValue(3)) : '',
      jobTitle: rs.getValue(4) ? String(rs.getValue(4)) : '',
      avatarUrl: rs.getValue(5) ? String(rs.getValue(5)) : '',
      preferences: rs.getValue(6) ? String(rs.getValue(6)) : '',
      updatedAt: rs.getValue(7) ? String(rs.getValue(7)) : ''
    };
  }
  if (rs) { rs.close(); }
  try { stmt.drop(); } catch (e) { }
  return out;
}

/**
 * Helper: upsert portal profile
 */
async function upsertPortalProfile(hanaConn, companyDb, sapUser, updates) {
  // Convert nullables
  const fullName = getStr(updates.fullName);
  const email = getStr(updates.email);
  const phone = getStr(updates.phone);
  const department = getStr(updates.department);
  const jobTitle = getStr(updates.jobTitle);
  const avatarUrl = getStr(updates.avatarUrl);
  const preferences = updates.preferences ? JSON.stringify(updates.preferences) : null;

  // MERGE-like: try UPDATE, if no rows updated INSERT
  const updateSql = `
    UPDATE "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"
    SET "FULL_NAME" = ?, "EMAIL" = ?, "PHONE" = ?, "DEPARTMENT" = ?, "JOB_TITLE" = ?, "AVATAR_URL" = ?, "PREFERENCES" = ?, "UPDATED_AT" = CURRENT_TIMESTAMP
    WHERE "COMPANY_DB" = ? AND "SAP_USER" = ?
  `;
  const upStmt = hanaConn.prepare(updateSql);
  const res = upStmt.execute([fullName, email, phone, department, jobTitle, avatarUrl, preferences, companyDb, sapUser]);  // ✅ Cambia executeUpdate por execute
  upStmt.drop();  // ✅ Agrega upStmt.drop()
  try { upStmt.drop(); } catch (e) { }
  

  if (res === 0) {
    const insertSql = `
      INSERT INTO "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE" ("COMPANY_DB", "SAP_USER", "FULL_NAME", "EMAIL", "PHONE", "DEPARTMENT", "JOB_TITLE", "AVATAR_URL", "PREFERENCES", "UPDATED_AT")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    const insStmt = hanaConn.prepare(insertSql);
    insStmt.execute([companyDb, sapUser, fullName, email, phone, department, jobTitle, avatarUrl, preferences]);  // ✅ Cambia executeUpdate por execute
    insStmt.drop();  // ✅ Agrega insStmt.drop()
    try { insStmt.drop(); } catch (e) { }
  }

  // return the saved row
  return readPortalProfile(hanaConn, companyDb, sapUser);
}

/**
 * GET /api/me/profile
 */
router.get('/api/me/profile', async (req, res) => {
  const sapUser = req.header('x-sap-user');
  const companyDb = req.header('x-company-db');

  if (!sapUser || !companyDb) {
    return res.status(400).json({ Message: 'Missing x-sap-user or x-company-db headers' });
  }

  let conn;
  try {
    conn = createConnection();
    const sapData = await readSapUser(conn, sapUser);
    const portalData = await readPortalProfile(conn, companyDb, sapUser);

    // Merge: portal overrides editable fields, but use SAP as fallback for empty fields
    const merged = {
      userKey: `${companyDb}|${sapUser}`,
      sapUser: sapUser,
      companyDb: companyDb,
      sap: sapData,
      profile: portalData ? {
        fullName: portalData.fullName || sapData?.fullName || '',
        email: portalData.email || sapData?.email || '',
        phone: portalData.phone || '',
        department: portalData.department || sapData?.department || '',
        jobTitle: portalData.jobTitle || '',
        avatarUrl: portalData.avatarUrl || null,
        preferences: portalData.preferences ? JSON.parse(portalData.preferences) : null,
        updatedAt: portalData.updatedAt
      } : {
        fullName: sapData?.fullName || '',
        email: sapData?.email || '',
        phone: '',
        department: sapData?.department || '',
        jobTitle: '',
        avatarUrl: null,
        preferences: null,
      }
    };
    console.log('Merged profile data:', merged);
    res.json(merged);
  } catch (err) {
    console.error('GET /api/me/profile error', err);
    res.status(500).json({ Message: err.message || 'Internal server error' });
  } finally {
    if (conn) try { closeConnection(conn); } catch (e) { }
  }
});

/**
 * PUT /api/me/profile
 * Body: any subset of profile fields (fullName, email, phone, department, jobTitle, avatarUrl, preferences)
 */
router.put('/api/me/profile', async (req, res) => {
  const sapUser = req.header('x-sap-user');
  const companyDb = req.header('x-company-db');

  if (!sapUser || !companyDb) {
    return res.status(400).json({ Message: 'Missing x-sap-user or x-company-db headers' });
  }

  const updates = req.body || {};

  let conn;
  try {
    conn = createConnection();
    const saved = await upsertPortalProfile(conn, companyDb, sapUser, updates);
    // Return merged as GET would
    const sapData = await readSapUser(conn, sapUser);
    const merged = {
      userKey: `${companyDb}|${sapUser}`,
      sapUser: sapUser,
      companyDb: companyDb,
      sap: sapData,
      profile: saved || {}
    };
    res.json(merged);
  } catch (err) {
    console.error('PUT /api/me/profile error', err);
    res.status(500).json({ Message: err.message || 'Internal server error' });
  } finally {
    if (conn) try { closeConnection(conn); } catch (e) { }
  }
});

// Configurar multer para guardar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } }); // 3MB límite

// Función para actualizar avatar en DB
async function updateAvatar(hanaConn, companyDb, sapUser, avatarUrl) {
  const sql = `
    UPDATE "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"
    SET "AVATAR_URL" = ?
    WHERE "COMPANY_DB" = ? AND "SAP_USER" = ?
  `;
  // const stmt = hanaConn.prepare(sql);
  // stmt.executeUpdate([avatarUrl, companyDb, sapUser]);
  // try { stmt.drop(); } catch(e) {}
  const stmt = hanaConn.prepare(sql);
  stmt.execute([avatarUrl, companyDb, sapUser]);  // ✅ Cambia executeUpdate por execute
  stmt.drop();  // ✅ Agrega stmt.drop() después
}

// POST /api/me/avatar
router.post('/api/me/avatar', upload.single('avatar'), async (req, res) => {
  const sapUser = req.header('x-sap-user');
  const companyDb = req.header('x-company-db');

  if (!sapUser || !companyDb) {
    return res.status(400).json({ Message: 'Missing x-sap-user or x-company-db headers' });
  }

  if (!req.file) {
    return res.status(400).json({ Message: 'No file uploaded' });
  }
  //const avatarUrl = `http://localhost:3010/uploads/${req.file.filename}`;  // ✅ Cambia de '/uploads/...' a URL completa
  const avatarUrl = `/uploads/${req.file.filename}`; // Ruta relativa para servir el archivo

  let conn;
  try {
    conn = createConnection();
    await updateAvatar(conn, companyDb, sapUser, avatarUrl);

    // Devuelve la nueva avatarUrl para que el frontend la use
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ Message: err.message || 'Error uploading avatar' });
  } finally {
    if (conn) try { closeConnection(conn); } catch (e) {}
  }
});

// Función para eliminar avatar
async function deleteAvatar(hanaConn, companyDb, sapUser) {
  // Obtener la avatarUrl actual para borrar el archivo
  const selectSql = `
    SELECT "AVATAR_URL" FROM "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"
    WHERE "COMPANY_DB" = ? AND "SAP_USER" = ?
  `;
  const stmt = hanaConn.prepare(selectSql);

  const rs = stmt.executeQuery([companyDb, sapUser]);
  
  let avatarUrl = null;
  if (rs && rs.next()) {
    avatarUrl = rs.getValue(0);
  }
  if (rs) rs.close();
  stmt.drop();

  // Borrar el archivo si existe
  if (avatarUrl) {
    const filePath = path.join(process.cwd(), 'uploads', path.basename(avatarUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);  // Borra el archivo
    }
  }

  // Setear avatarUrl a null en DB
  const updateSql = `
    UPDATE "SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"
    SET "AVATAR_URL" = NULL
    WHERE "COMPANY_DB" = ? AND "SAP_USER" = ?
  `;
  const upStmt = hanaConn.prepare(updateSql);
  upStmt.execute([companyDb, sapUser]);
  upStmt.drop();
}

// DELETE /api/me/avatar
router.delete('/api/me/avatar', async (req, res) => {
  console.log('DELETE /api/me/avatar called for user:', req.header('x-sap-user'));
  const sapUser = req.header('x-sap-user');
  const companyDb = req.header('x-company-db');

  if (!sapUser || !companyDb) {
    return res.status(400).json({ Message: 'Missing x-sap-user or x-company-db headers' });
  }

  let conn;
  try {
    conn = createConnection();
    await deleteAvatar(conn, companyDb, sapUser);
    res.json({ message: 'Avatar deleted successfully' });
  } catch (err) {
    console.error('Delete avatar error:', err);
    res.status(500).json({ Message: err.message || 'Error deleting avatar' });
  } finally {
    if (conn) try { closeConnection(conn); } catch (e) {}
  }
});

export default router;