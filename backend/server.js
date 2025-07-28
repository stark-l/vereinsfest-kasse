// server.js

// 1. Abhängigkeiten importieren
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// 2. App und Server initialisieren
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Railway verwendet PORT aus Umgebungsvariablen
const PORT = process.env.PORT || 3000;

// 3. Statische Dateien bereitstellen (HTML, CSS, Logo aus dem public Ordner)
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- In-Memory-Datenbank ---

// NEUE SPEISEKARTE (aus dem Bild extrahiert)
const menu = {
    speisen: [
        { id: 1, name: '½ Hähnchen m. Semmel', price: 8.50 },
        { id: 2, name: '½ Hähnchen m. Pommes/Salat', price: 11.50 },
        { id: 3, name: 'Schaschlikpfanne m. Semmel', price: 7.50 },
        { id: 4, name: 'Schaschlikpfanne m. Pommes/Salat', price: 10.50 },
        { id: 5, name: 'Gyros m. Tzatziki u. Semmel', price: 7.50 },
        { id: 6, name: 'Gyros m. Tzatziki u. Pommes/Salat', price: 10.50 },
        { id: 7, name: 'Steak m. Semmel', price: 5.00 },
        { id: 8, name: 'Steak m. Pommes/Kartoffelsalat', price: 8.00 },
        { id: 9, name: '1 Paar Grillwürste m. Semmel', price: 4.00 },
        { id: 10, name: '1 Paar Grillwürste m. Pommes/Salat', price: 7.00 },
        { id: 11, name: 'Einzelne Grillwurst m. Semmel', price: 3.00 },
        { id: 12, name: 'Gemüsemaultaschen', price: 8.50 },
        { id: 13, name: 'Portion Pommes/Kartoffelsalat', price: 3.50 },
        { id: 14, name: '100g Käse', price: 3.20 },
        { id: 15, name: 'Käsesemmel', price: 3.20 },
        { id: 16, name: 'Semmel', price: 0.50 },
    ],
    sonntagsgerichte: [
        { id: 20, name: 'Schweinebraten m. Spätzle/Gemüse', price: 13.00 },
        { id: 21, name: 'Schweinebraten m. Kartoffelsalat', price: 12.50 },
        { id: 22, name: 'Schweineschnitzel', price: 11.80 },
        { id: 23, name: 'Spätzle mit Soße', price: 3.50 },
    ]
};

// Aktive Bestellungen
let activeOrders = [];
let orderCounter = 1; // Eindeutige Bestellnummer

// --- API Endpunkte ---
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// Health Check für Railway
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Echtzeit-Logik mit Socket.IO ---
io.on('connection', (socket) => {
    console.log('Ein Client hat sich verbunden:', socket.id);
    socket.emit('initialOrders', activeOrders);

    socket.on('placeOrder', (orderData) => {
        console.log('Neue Bestellung erhalten:', orderData);
        const newOrder = {
            id: orderCounter++,
            table: orderData.table,
            items: orderData.items,
            total: orderData.total,
            waiter: orderData.waiter || 'Unbekannt',
            timestamp: orderData.timestamp || new Date().toLocaleString('de-DE'),
            status: 'Neu',
            createdAt: new Date()
        };
        activeOrders.push(newOrder);
        io.emit('newOrder', newOrder);
    });
    
    socket.on('updateOrderStatus', ({ orderId, newStatus }) => {
        const order = activeOrders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            console.log(`Status für Bestellung ${orderId} geändert zu ${newStatus}`);
            io.emit('orderStatusChanged', { orderId, newStatus });
        }
    });

    socket.on('disconnect', () => {
        console.log('Ein Client hat die Verbindung getrennt:', socket.id);
    });
});

// 4. Server starten
server.listen(PORT, () => {
    console.log(`🎉 Kassen-Server läuft auf Port ${PORT}`);
    console.log(`Kellner-App: http://localhost:${PORT}/kellner.html`);
    console.log(`Küchen-Display: http://localhost:${PORT}/kueche.html`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
});