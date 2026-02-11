# Backend Node.js para SAP HANA

Backend sencillo que se conecta a SAP HANA usando HANA Client Library y expone los stored procedures como APIs REST.

## Características

- ✅ Conexión a SAP HANA usando `@sap/hana-client`
- ✅ Ejecución de stored procedures desde APIs REST
- ✅ Compatible con el formato de requests del frontend existente
- ✅ Mapeo de IDs a stored procedures específicos

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de HANA:
```
HANA_SERVER=tu-servidor:30015
HANA_USER=tu-usuario
HANA_PASSWORD=tu-password
HANA_DATABASE=tu-base-de-datos
HANA_SCHEMA=tu-schema
```

3. Iniciar el servidor:
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

## Endpoints

### POST `/api/Dynamic/process`
Endpoint principal que procesa requests del frontend.

**Headers:**
- `Id`: ID numérico que mapea al stored procedure
- `Token`: Token de autenticación (opcional, no se valida actualmente)
- `Content-Type`: application/json

**Body:**
```json
{
  "engine": "Worker",
  "fecha_desde": "01-01-2025",
  "fecha_hasta": "12-31-2025",
  "status": "ALL",
  "limit": 50
}
```

## Mapeo de IDs a Stored Procedures

- **257**: `CTS_ORDERS_RECONCILIATIONS` - Órdenes
- **261**: `CTS_AMAZON_SALES_RECONCILIATIONS` - Ventas (Sales)
- **262**: `CTS_AMAZON_INPAYMENTS_RECONCILIATIONS` - Pagos (Payments)
- **263**: `CTS_AMAZON_SALES_FEES_RECONCILIATIONS` - Fees de Ventas
- **264**: `CTS_AMAZON_INPAYMENTS_FEES_RECONCILIATIONS` - Fees de Pagos
- **265**: `CTS_RECON_DASHBOARD_HEADER` - Dashboard
- **266**: `CTS_RECON_SETTLEMENT_DETAIL` - Detalle de Settlement
- **267**: `CTS_EXCEPTIONS_DASHBOARD` - Excepciones Dashboard
- **269**: `CTS_ACCOUNTING_GL_SUMMARY` - Resumen Contable
- **271**: `CTS_REPORT_MONTHLY_RECON_SUMMARY` - Reporte Mensual
- **279**: `CTS_EXCEPTIONS_PARETO_GLOBAL` - Pareto de Excepciones

## Estructura del Proyecto

```
.
├── server.js                 # Servidor principal Express
├── src/
│   ├── db/
│   │   └── hana.js          # Conexión y ejecución de HANA
│   ├── routes/
│   │   └── dynamic.js       # Procesamiento de requests
│   └── mappings/
│       └── sp-mappings.js   # Mapeo ID -> Stored Procedure
├── .env                      # Variables de entorno (no commitear)
└── package.json
```

## Notas

- El backend es compatible con el formato de requests del frontend existente
- Los stored procedures deben devolver JSON como string en la primera columna
- El formato de fechas esperado es `MM-dd-yyyy` (ej: `01-15-2025`)

