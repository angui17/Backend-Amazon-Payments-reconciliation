# Documentación técnica backend (API propia) — Reemplazo IDA Cloud/API

> Estado analizado sobre el código actual del repositorio `Backend-Amazon-Payments-reconciliation`.

## 1) Stack, arquitectura y ejecución

## Stack backend
- **Lenguaje/runtime:** Node.js (ES Modules, `"type": "module"`).
- **Framework HTTP:** Express 4.
- **DB client:** `@sap/hana-client` (driver nativo SAP HANA, sin ORM).
- **Otros componentes:** `cors`, `dotenv`, `multer` (upload de avatar).

## Estructura del proyecto
- `server.js`: bootstrap del servidor, CORS, healthcheck, rutas legacy y perfil.
- `src/routes/dynamic.js`: endpoint universal compatible con IDA (`Id` header + body), resuelve SP por mapping.
- `src/mappings/sp-mappings.js`: catálogo `id -> stored procedure + buildParams`.
- `src/procedures/id-*.js`: traducción de payload frontend a parámetros del SP por cada caso funcional.
- `src/db/hana.js`: conexión, ejecución de `CALL`, utilidades de query/non-query.
- `src/routes/meProfile.js`: endpoints de perfil y avatar (lectura OUSR + tabla portal).
- `src/middleware/auth.js`: validación opcional de token estático (actualmente no conectada al pipeline global).
- `uploads/`: archivos estáticos de avatar.

## Ejecución
- `npm install`
- `npm start` → ejecuta `node server.js`.
- `npm run dev` → `node --watch server.js`.

## Docker
- **No hay** `Dockerfile` ni `docker-compose` en este repositorio.

---

## 2) Configuración de entorno

## Variables de conexión DB (SAP HANA)
Configuradas/consumidas en `src/db/hana.js`:
- `HANA_SERVER` (default: `localhost:30015`)
- `HANA_USER`
- `HANA_PASSWORD`
- `HANA_DATABASE` *(se usa para prefijar el SP como `"DATABASE"."SP"`)*

Variables relacionadas adicionales:
- `HANA_SCHEMA` aparece en README, pero en código de `meProfile` hay schema **hardcodeado** (`"SBO_COPA_LIVE"`) para consultas directas.

## Variables de seguridad / API
- `PORT` (default `3010`).
- `FRONTEND_ORIGIN` (default `http://localhost:5173`) para CORS.
- `ENABLE_TOKEN_VALIDATION` (`true/false`) para activar validación de token en middleware.
- `API_TOKEN` token esperado por middleware (si está activo).

## Puertos, base path, versión de API
- Puerto por defecto: `3010`.
- Paths expuestos:
  - `POST /api/Dynamic/process` (principal)
  - `POST /ida-proxy/API/api/Dynamic/process` (compatibilidad legacy proxy)
  - `GET /health`
  - `GET|PUT /api/me/profile`
  - `POST|DELETE /api/me/avatar`
  - `GET /uploads/:filename` (estático)
- No existe versionado explícito (`/v1`, `/v2`) en rutas.

---

## 3) Autenticación y autorización

## Modelo real implementado
- **No hay JWT** (no se firma, no se refresca, no expiración, no claims/roles).
- El middleware `validateToken` de `src/middleware/auth.js` usa comparación de **token estático en header** (`token`) vs `API_TOKEN`, pero:
  - actualmente **no está aplicado** con `app.use(validateToken)` ni por-ruta.
- Para `me/profile` y avatar, la “identidad” se basa en headers:
  - `x-sap-user`
  - `x-company-db`

## Endpoints login/logout/refresh
- **No existen** endpoints `login`, `logout`, `refresh` en el backend actual.

## Middlewares/guards
- Activos:
  - `cors(...)`
  - `express.json()`
  - `express.urlencoded(...)`
  - `multer` solo en upload avatar.
- Inactivo/no cableado:
  - `validateToken`.

## Roles/permisos
- **No hay RBAC/ACL** implementado en código.

---

## 4) CORS y seguridad

## CORS
Configuración explícita en `server.js`:
- `origin`: `FRONTEND_ORIGIN`
- `credentials: true`
- `methods`: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `allowedHeaders`: `Content-Type, x-sap-user, x-company-db, id, token`
- `app.options('*', cors())` habilita preflight global.

## Seguridad adicional
- No se observan:
  - rate limiting
  - helmet/secure headers
  - CSRF protection
  - auditoría estructurada
- Logging actual: `console.log/error` (incluye logging de parámetros y token parcial).

---

## 5) Conexión a base de datos

## Tipo de conexión
- Driver nativo `@sap/hana-client`.
- Conexión por request (`createConnection()`), ejecución y cierre en `finally`.
- No existe pool de conexiones real pese a variable declarada (`connectionPool` no utilizada).

## Timeouts / manejo de errores
- Timeouts no configurados explícitamente en cliente HANA.
- Errores se capturan y devuelven en formato `{ id: -500, Message: ... }` para dynamic o `{ Message: ... }` en profile/avatar.
- Parsing del resultado SP:
  - espera string JSON en primera columna.
  - si vacío => `id: -500`.
  - si JSON inválido => `id: -501`.

## Dónde están queries/SP calls
- Llamada dinámica a SP: `src/db/hana.js` (`CALL ...`).
- Resolución ID→SP: `src/mappings/sp-mappings.js`.
- Traducción de filtros por endpoint lógico: `src/procedures/id-*.js`.
- Queries SQL directas (sin SP) perfil/avatar: `src/routes/meProfile.js` sobre:
  - `"SBO_COPA_LIVE"."OUSR"`
  - `"SBO_COPA_LIVE"."AMAZON_PORTAL_USER_PROFILE"`

---

## 6) Endpoints API completos

## Tabla de endpoints HTTP reales

| Método | Path | Propósito | Headers clave | Body/Params | Response base |
|---|---|---|---|---|---|
| GET | `/health` | Healthcheck del servicio | - | - | `{ status, message }` |
| POST | `/api/Dynamic/process` | Endpoint universal compatible con IDA | `id` obligatorio; `token` opcional; `Content-Type` | JSON con filtros (depende de `id`) | JSON devuelto por SP o `{id, Message}` de error |
| POST | `/ida-proxy/API/api/Dynamic/process` | Alias legacy del endpoint universal | Igual que anterior | Igual | Igual |
| GET | `/api/me/profile` | Perfil combinado SAP + portal | `x-sap-user`, `x-company-db` | - | `{ userKey, sapUser, companyDb, sap, profile }` |
| PUT | `/api/me/profile` | Upsert de perfil portal | `x-sap-user`, `x-company-db` | `fullName,email,phone,department,jobTitle,avatarUrl,preferences` | objeto combinado |
| POST | `/api/me/avatar` | Subir avatar (`multipart/form-data`) | `x-sap-user`, `x-company-db` | file field: `avatar` | `{ avatarUrl }` |
| DELETE | `/api/me/avatar` | Eliminar avatar en FS+DB | `x-sap-user`, `x-company-db` | - | `{ message }` |
| GET | `/uploads/:filename` | Servir archivo estático avatar | - | path param | archivo |

> Nota técnica importante: por doble montaje del router (`app.use(meProfileRouter)` y `app.use('/api/me', meProfileRouter)`), también quedan rutas duplicadas no intencionales (`/api/me/api/me/profile`, etc.).

## Endpoint dinámico: catálogo funcional por `id` (Id header)

| ID | Stored Procedure | Dominio funcional | Params esperados (body) |
|---|---|---|---|
| 257 | `CTS_ORDERS_RECONCILIATIONS` | Reconciliation / Orders | `fecha_desde`, `fecha_hasta`, `last|limit` |
| 261 | `CTS_AMAZON_SALES_RECONCILIATIONS` | Sales | `type` (requerido), `fecha_desde`, `fecha_hasta`, `last|limit` |
| 262 | `CTS_AMAZON_INPAYMENTS_RECONCILIATIONS` | InPayments | `type` (requerido), `fecha_desde`, `fecha_hasta`, `last|limit` |
| 263 | `CTS_AMAZON_SALES_FEES_RECONCILIATIONS` | Sales Fees | `types` CSV (requerido), `fecha_desde`, `fecha_hasta`, `last|limit` |
| 264 | `CTS_AMAZON_INPAYMENTS_FEES_RECONCILIATIONS` | InPayments Fees | `types` CSV (requerido), `fecha_desde`, `fecha_hasta`, `last|limit` |
| 265 | `CTS_RECON_DASHBOARD_HEADER` | Reconciliation Dashboard | `fecha_desde`, `fecha_hasta`, `status`, `limit|limit_records` |
| 266 | `CTS_RECON_SETTLEMENT_DETAIL` | Reconciliation Settlement Detail | `settlementId` (requerido), `limit|limit_rows` |
| 267 | `CTS_EXCEPTIONS_DASHBOARD` | Exceptions Dashboard | `fecha_desde`, `fecha_hasta`, `status`, `limit|limit_records` |
| 268 | `CTS_EXCEPTIONS_SETTLEMENT_DETAIL` | Exceptions Settlement Detail | `settlementId` (requerido), `limit|limit_rows`, `txn_types_csv`, `amount_desc_like` |
| 269 | `CTS_ACCOUNTING_JOURNAL_HEADER` | Accounting | `fecha_desde`, `fecha_hasta`, `status`, `limit_records` |
| 270 | `CTS_ACCOUNTING_JOURNAL_LINES` | Accounting | `settlementId` (requerido), `limit_rows` |
| 271 | `CTS_REPORT_MONTHLY_RECON_SUMMARY` | Reports | `fecha_desde`, `fecha_hasta`, `status`, `limit_months`, `top_causes_n` |
| 272 | `CTS_REPORT_SETTLEMENT_EXPORT` | Reports | `settlementId` (requerido), `limit_rows`, `txn_types_csv`, `amount_desc_like` |
| 277 | `CTS_ACCOUNTING_POSTING_STATUS` | Accounting | `fecha_desde`, `fecha_hasta`, `status`, `limit_records` |
| 278 | `CTS_ACCOUNTING_GL_SUMMARY` | Accounting | `fecha_desde`, `fecha_hasta`, `status`, `settlementId`, `account_like`, `limit_accounts|limit_records` |
| 279 | `CTS_EXCEPTIONS_PARETO_GLOBAL` | Exceptions/Reports | `fecha_desde`, `fecha_hasta`, `status`, `only_exceptions`, `top_n`, `limit_settlements|limit_records` |

## Shape de responses y errores

### Response success en dynamic
- El backend **no define contrato fijo**: retorna `JSON.parse(resultJson)` del SP.
- Por lo tanto, el shape final depende de cada stored procedure.

### Responses de error dynamic (reales)
- Falta header id:
```json
{ "id": -400, "Message": "Header \"Id\" is required" }
```
- ID sin mapping:
```json
{ "id": -404, "Message": "No stored procedure mapping found for ID: 999" }
```
- Error de ejecución:
```json
{ "id": -500, "Message": "<detalle error>" }
```
- SP sin datos:
```json
{ "id": -500, "Message": "SP no devolvió datos." }
```
- SP devuelve JSON inválido:
```json
{ "id": -501, "Message": "SP devolvió un JSON inválido." }
```

### Response success profile (real del código)
```json
{
  "userKey": "SBO_COPA_LIVE|manager",
  "sapUser": "manager",
  "companyDb": "SBO_COPA_LIVE",
  "sap": {
    "userCode": "manager",
    "fullName": "Manager",
    "email": "manager@empresa.com",
    "department": "FIN",
    "lastLogin": "..."
  },
  "profile": {
    "fullName": "Manager",
    "email": "manager@empresa.com",
    "phone": "",
    "department": "FIN",
    "jobTitle": "",
    "avatarUrl": null,
    "preferences": null,
    "updatedAt": "..."
  }
}
```

---

## 7) Reconciliación / negocio

## Endpoints por dominio
- **Reconciliation:** IDs `257, 265, 266`.
- **Sales:** IDs `261, 263`.
- **InPayments:** IDs `262, 264`.
- **Exceptions:** IDs `267, 268, 279`.
- **Reports:** IDs `271, 272`.
- **Accounting:** IDs `269, 270, 277, 278`.

## ¿SP o lógica en código?
- La lógica de negocio principal está en **stored procedures SAP HANA**.
- El backend reimplementa principalmente:
  - validación mínima de parámetros requeridos.
  - normalización y defaults.
  - traducción payload → orden de parámetros para `CALL`.

## Traducción de filtros (cómo lo hace el backend)
- `fecha_desde/fecha_hasta`:
  - default `fecha_desde = "01-01-2000"`
  - default `fecha_hasta = MM-dd-yyyy` actual.
- `status`:
  - default `ALL`, luego `.toUpperCase()`.
- `settlementId`:
  - requerido en 266/268/270/272.
- `limit`:
  - nombres alternativos según ID (`limit`, `limit_rows`, `limit_records`, etc.).
- `last` (en 257/261/262/263/264):
  - si existe, fuerza `fecha_desde = "01-01-2000"` y usa `last|limit` como cantidad.

---

## 8) Diagrama de flujo actual (incluye auth)

```mermaid
flowchart LR
  FE[Frontend] -->|POST /api/Dynamic/process\nHeader id + body filtros| BE[Express Backend]
  FE -->|GET/PUT/POST/DELETE /api/me/*\nHeaders x-sap-user/x-company-db| BE

  BE -->|Resolver ID en sp-mappings\nbuildParams por ID| MAP[src/procedures/id-*.js]
  MAP --> BE

  BE -->|createConnection + CALL SP| HDB[(SAP HANA)]
  HDB -->|JSON string (columna 1)| BE
  BE -->|JSON parse + response| FE

  FE -.->|Header token opcional| BE
  AUTH[validateToken middleware] -. no cableado .-> BE
```

---

## 9) Checklist de puntos críticos para integración frontend

- [ ] Enviar header **`id`** en cada request a endpoint dynamic.
- [ ] Enviar `Content-Type: application/json` en dynamic.
- [ ] En profile/avatar enviar siempre:
  - [ ] `x-sap-user`
  - [ ] `x-company-db`
- [ ] Formato de fechas esperado: **`MM-dd-yyyy`**.
- [ ] Revisar naming de `limit` por endpoint (`limit`, `limit_rows`, `limit_records`, `limit_accounts`, etc.).
- [ ] Manejar errores por código HTTP + body:
  - `400` (headers/campos requeridos)
  - `401/403` solo si se habilita middleware token
  - `500` errores backend/SP
- [ ] CORS: frontend debe originar desde `FRONTEND_ORIGIN`.
- [ ] Tolerancia de diferencias `0.01`:
  - **No aparece implementada en este backend**; si la regla venía de IDA/SP, debe validarse en SP o capa frontend.
- [ ] Considerar fix técnico:
  - eliminar doble mount de router de profile para evitar rutas duplicadas.

---

## 10) Lista de archivos clave (rutas exactas)

- `package.json`
- `server.js`
- `src/routes/dynamic.js`
- `src/mappings/sp-mappings.js`
- `src/procedures/id-257.js`
- `src/procedures/id-261.js`
- `src/procedures/id-262.js`
- `src/procedures/id-263.js`
- `src/procedures/id-264.js`
- `src/procedures/id-265.js`
- `src/procedures/id-266.js`
- `src/procedures/id-267.js`
- `src/procedures/id-268.js`
- `src/procedures/id-269.js`
- `src/procedures/id-270.js`
- `src/procedures/id-271.js`
- `src/procedures/id-272.js`
- `src/procedures/id-277.js`
- `src/procedures/id-278.js`
- `src/procedures/id-279.js`
- `src/db/hana.js`
- `src/routes/meProfile.js`
- `src/middleware/auth.js`
- `src/utils/helpers.js`
- `README.md`
- `INSTRUCCIONES_CAMBIOS_FRONTEND.md`

---

## 11) Ejemplos cURL (3-5 endpoints más importantes)

## 1) Health
```bash
curl -X GET "http://localhost:3010/health"
```

## 2) Dynamic Sales (ID 261)
```bash
curl -X POST "http://localhost:3010/api/Dynamic/process" \
  -H "Content-Type: application/json" \
  -H "id: 261" \
  -d '{
    "engine": "Worker",
    "type": "ORDER",
    "fecha_desde": "01-01-2025",
    "fecha_hasta": "01-31-2025",
    "limit": 50
  }'
```

## 3) Dynamic Settlement Detail (ID 266)
```bash
curl -X POST "http://localhost:3010/api/Dynamic/process" \
  -H "Content-Type: application/json" \
  -H "id: 266" \
  -d '{
    "engine": "Worker",
    "settlementId": "23405515541",
    "limit_rows": 500
  }'
```

## 4) Obtener perfil
```bash
curl -X GET "http://localhost:3010/api/me/profile" \
  -H "x-sap-user: manager" \
  -H "x-company-db: SBO_COPA_LIVE"
```

## 5) Actualizar perfil
```bash
curl -X PUT "http://localhost:3010/api/me/profile" \
  -H "Content-Type: application/json" \
  -H "x-sap-user: manager" \
  -H "x-company-db: SBO_COPA_LIVE" \
  -d '{
    "fullName": "Manager SAP",
    "email": "manager@empresa.com",
    "phone": "+52-555-000-0000",
    "department": "FIN",
    "jobTitle": "Controller"
  }'
```

