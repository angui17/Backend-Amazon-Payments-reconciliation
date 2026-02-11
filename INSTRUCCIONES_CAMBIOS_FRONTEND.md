

 Cambio 1: Archivo `Amazon-Payments-reconciliation-main/src/api/base.js`

**Línea 1** - Cambiar:
```javascript
const PROXY_PATH = "/ida-proxy/API/api/Dynamic/process?company=ida";
```

**Por:**
```javascript
const PROXY_PATH = "http://localhost:3010/api/Dynamic/process";
```

O si prefieres usar una variable de entorno:
```javascript
const PROXY_PATH = import.meta?.env?.VITE_API_URL || "http://localhost:3010/api/Dynamic/process";
```

---

 Cambio 2: Archivo `Amazon-Payments-reconciliation-main/vite.config.js`

**En la sección `server.proxy`** - Cambiar:
```javascript
'/ida-proxy': {
  target: 'https://cts.idadns.com:33190',
  changeOrigin: true,
  secure: false,
  rewrite: path => path.replace(/^\/ida-proxy/, '')
},
```

**Por:**
```javascript
'/ida-proxy': {
  target: 'http://localhost:3010',
  changeOrigin: true,
  secure: false,
  rewrite: path => path.replace(/^\/ida-proxy\/API\/api/, '/api')
},
```





