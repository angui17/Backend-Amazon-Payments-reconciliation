// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { createConnection, executeStoredProcedure } from './src/db/hana.js';
// import { processRequest } from './src/routes/dynamic.js';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', message: 'Backend SAP HANA is running' });
// });

// // Main API endpoint - compatible with old IDA Dynamics endpoint
// app.post('/api/Dynamic/process', async (req, res) => {
//   try {
//     const result = await processRequest(req);
//     res.json(result);
//   } catch (error) {
//     console.error('Error processing request:', error);
//     res.status(500).json({
//       id: -500,
//       Message: error.message || 'Internal server error'
//     });
//   }
// });

// // Alternative endpoint for compatibility
// app.post('/ida-proxy/API/api/Dynamic/process', async (req, res) => {
//   try {
//     const result = await processRequest(req);
//     res.json(result);
//   } catch (error) {
//     console.error('Error processing request:', error);
//     res.status(500).json({
//       id: -500,
//       Message: error.message || 'Internal server error'
//     });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Backend SAP HANA server running on http://localhost:${PORT}`);
//   console.log(`📡 API endpoint: http://localhost:${PORT}/api/Dynamic/process`);
// });

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { processRequest } from './src/routes/dynamic.js'
// import { meProfileRouter } from './src/routes/meProfile.js'
import meProfileRouter from './src/routes/meProfile.js';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3010

// ✅ CORS correcto para cookies/credentials + headers custom
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-sap-user', 'x-company-db', 'id', 'token'],  
}))

// Preflight
app.options('*', cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use(meProfileRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend SAP HANA is running' })
})

// Legacy compatible endpoint
app.post('/api/Dynamic/process', async (req, res) => {
  try {
    const result = await processRequest(req)
    res.json(result)
  } catch (error) {
    console.error('Error processing request:', error)
    res.status(500).json({
      id: -500,
      Message: error.message || 'Internal server error',
    })
  }
})

// Alternative endpoint for compatibility
app.post('/ida-proxy/API/api/Dynamic/process', async (req, res) => {
  try {
    const result = await processRequest(req)
    res.json(result)
  } catch (error) {
    console.error('Error processing request:', error)
    res.status(500).json({
      id: -500,
      Message: error.message || 'Internal server error',
    })
  }
})

// ✅ NUEVO: /api/me/profile (GET/PUT/DELETE) y /api/me/profile/avatar (POST)
app.use('/api/me', meProfileRouter)

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
  console.log(`✅ CORS origin allowed: ${FRONTEND_ORIGIN}`)
})
