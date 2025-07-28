# Railway Deployment Setup

## 🚀 Railway Deployment Anleitung

### 1. Railway Account erstellen
- Gehe zu [railway.app](https://railway.app)
- Erstelle einen Account oder logge dich ein

### 2. Projekt verbinden
- Klicke auf "New Project"
- Wähle "Deploy from GitHub repo"
- Verbinde dein GitHub Repository: `vereinsfest-kasse`

### 3. PostgreSQL Database hinzufügen
- Im Railway Dashboard: "New Service" → "Database" → "PostgreSQL"
- Railway erstellt automatisch eine PostgreSQL Database
- Die `DATABASE_URL` Umgebungsvariable wird automatisch gesetzt

### 4. Umgebungsvariablen prüfen
Railway setzt automatisch diese Variablen:
- `PORT` - Server Port
- `DATABASE_URL` - PostgreSQL Verbindungsstring
- `NODE_ENV` - Production

### 5. Deployment
- Railway deployt automatisch bei jedem Git Push
- Der Build-Prozess ist in `railway.toml` konfiguriert
- Health Check: `https://your-app.railway.app/health`

### 6. URLs
Nach dem Deployment:
- **Kellner-App**: `https://your-app.railway.app/kellner.html`
- **Küchen-Display**: `https://your-app.railway.app/kueche.html`
- **Health Check**: `https://your-app.railway.app/health`

## 🔧 Troubleshooting

### Database Connection Issues
- Prüfe ob PostgreSQL Service läuft
- Prüfe `DATABASE_URL` in Railway Variables
- Logs in Railway Dashboard prüfen

### Build Issues
- Prüfe `package.json` Dependencies
- Prüfe `railway.toml` Konfiguration
- Node.js Version: >=18.0.0

### SSL Issues
- Railway PostgreSQL erfordert SSL in Production
- Code ist bereits für SSL konfiguriert

## 📊 Monitoring
- Railway Dashboard zeigt Logs und Metriken
- Health Check Endpoint für Monitoring
- Automatische Restarts bei Fehlern 