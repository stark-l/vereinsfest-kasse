# SCU Vereinsfest Bestellsystem

Ein modernes Bestellsystem für das SCU Vereinsfest mit Echtzeit-Updates zwischen Kellner und Küche.

## 🚀 Features

- **Kellner-Interface**: Einfache Bestellaufnahme mit Namenseingabe
- **Küchen-Display**: Echtzeit-Bestellungsanzeige mit Statusverwaltung
- **Statistiken**: Detaillierte Auswertung aller Bestellungen
- **Einklappbare fertige Bestellungen**: Übersichtliche Darstellung
- **Bestätigungsdialoge**: Verhindert versehentliche Statusänderungen

## 🛠️ Technologie

- **Backend**: Node.js mit Express und Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Deployment**: Railway

## 📦 Installation

### Lokale Entwicklung

1. Repository klonen:
```bash
git clone <repository-url>
cd vereinsfest-kasse
```

2. Dependencies installieren:
```bash
npm install
```

3. Server starten:
```bash
npm start
```

4. Anwendung öffnen:
- Kellner-App: http://localhost:3000/kellner.html
- Küchen-Display: http://localhost:3000/kueche.html

### Railway Deployment

1. Railway Account erstellen: https://railway.app
2. GitHub Repository verbinden
3. Automatisches Deployment

## 🎯 Verwendung

### Kellner-Interface
1. Namen eingeben und bestätigen
2. Tischnummer eingeben
3. Gerichte aus der Speisekarte auswählen
4. Bestellung abschicken

### Küchen-Display
1. Eingehende Bestellungen in Echtzeit verfolgen
2. Status ändern: "In Arbeit" → "Fertig"
3. Statistiken einsehen
4. Fertige Bestellungen einklappen

## 📊 API Endpunkte

- `GET /api/menu` - Speisekarte abrufen
- `GET /health` - Health Check
- `GET /kellner.html` - Kellner-Interface
- `GET /kueche.html` - Küchen-Display

## 🔧 Umgebungsvariablen

- `PORT` - Server Port (Standard: 3000)

## 📝 Lizenz

MIT License 