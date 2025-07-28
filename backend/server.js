// server.js

// 1. Abhängigkeiten importieren
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// PostgreSQL für persistente Datenhaltung
const { Pool } = require('pg');

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

// =================================================================
// NEU: Datenbank-Konfiguration
// =================================================================
let pool;
let dbMode = '⚠️ In-Memory'; // Standardmäßig In-Memory

// Prüfen, ob eine DATABASE_URL von Railway vorhanden ist
if (process.env.DATABASE_URL) {
    console.log('🔗 Versuche PostgreSQL Verbindung...');
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Notwendig für die Verbindung zu Railway
            }
        });
        
        // Teste die Verbindung mit einer einfachen Abfrage
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ Datenbank-Verbindungs-Test fehlgeschlagen', err.stack);
            } else {
                console.log('✅ PostgreSQL-Datenbank erfolgreich verbunden!');
                dbMode = 'PostgreSQL';
            }
        });

    } catch (error) {
         console.error('❌ Datenbank-Initialisierung fehlgeschlagen:', error);
    }
} else {
    console.log('ℹ️ Keine DATABASE_URL gefunden. Verwende In-Memory Storage.');
}
// =================================================================

// 3. Statische Dateien bereitstellen (HTML, CSS, Logo aus dem public Ordner)
app.use(express.static(path.join(__dirname, '..', 'public')));

// 4. Datenbank initialisieren
async function initializeDatabase() {
    if (!pool) {
        console.log('ℹ️ Überspringe Datenbankinitialisierung - verwende In-Memory Storage');
        return;
    }
    
    try {
        // Tabelle für Bestellungen erstellen
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                table_number VARCHAR(10) NOT NULL,
                waiter_name VARCHAR(100),
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'Neu',
                timestamp VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabelle für Bestellungsartikel erstellen
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                item_name VARCHAR(100) NOT NULL,
                item_price DECIMAL(10,2) NOT NULL,
                quantity INTEGER DEFAULT 1
            )
        `);

        console.log('✅ Datenbank erfolgreich initialisiert');
    } catch (error) {
        console.error('❌ Datenbankfehler:', error);
        dbMode = '⚠️ In-Memory'; // Fallback zu In-Memory
    }
}

// --- In-Memory-Datenbank (Fallback) ---

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

// Fallback: In-Memory Bestellungen (falls keine DB verfügbar)
let activeOrders = [];
let orderCounter = 1;

// --- API Endpunkte ---
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// Health Check für Railway
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: dbMode,
        orders: activeOrders.length
    });
});

// Bestellungen aus Datenbank laden
async function loadOrdersFromDatabase() {
    if (!pool) {
        console.log('ℹ️ Verwende In-Memory Storage für Bestellungen');
        return;
    }

    try {
        const result = await pool.query(`
            SELECT o.*, 
                   json_agg(json_build_object('name', oi.item_name, 'price', oi.item_price, 'quantity', oi.quantity)) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.status != 'Fertig'
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);

        activeOrders = result.rows.map(row => ({
            id: row.id,
            table: row.table_number,
            waiter: row.waiter_name,
            total: parseFloat(row.total),
            status: row.status,
            timestamp: row.timestamp,
            items: row.items || []
        }));

        orderCounter = Math.max(...activeOrders.map(o => o.id), 0) + 1;
        console.log(`📊 ${activeOrders.length} aktive Bestellungen aus Datenbank geladen`);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Bestellungen:', error);
        console.log('⚠️ Fallback zu In-Memory Storage');
        dbMode = '⚠️ In-Memory';
    }
}

// --- Echtzeit-Logik mit Socket.IO ---
io.on('connection', (socket) => {
    console.log('Ein Client hat sich verbunden:', socket.id);
    socket.emit('initialOrders', activeOrders);

    socket.on('placeOrder', async (orderData) => {
        console.log('Neue Bestellung erhalten:', orderData);
        
        try {
            if (pool) {
                // In Datenbank speichern
                const orderResult = await pool.query(`
                    INSERT INTO orders (table_number, waiter_name, total, timestamp, status)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                `, [orderData.table, orderData.waiter, orderData.total, orderData.timestamp, 'Neu']);

                const orderId = orderResult.rows[0].id;

                // Artikel speichern
                for (const item of orderData.items) {
                    await pool.query(`
                        INSERT INTO order_items (order_id, item_name, item_price, quantity)
                        VALUES ($1, $2, $3, $4)
                    `, [orderId, item.name, item.price, 1]);
                }

                const newOrder = {
                    id: orderId,
                    table: orderData.table,
                    items: orderData.items,
                    total: orderData.total,
                    waiter: orderData.waiter || 'Unbekannt',
                    timestamp: orderData.timestamp || new Date().toLocaleString('de-DE'),
                    status: 'Neu',
                    createdAt: new Date()
                };

                activeOrders.push(newOrder);
                orderCounter = Math.max(orderCounter, orderId + 1);
            } else {
                // Fallback: In-Memory
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
            }

            io.emit('newOrder', newOrder);
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Bestellung:', error);
            // Fallback zu In-Memory wenn Datenbankfehler
            if (pool) {
                console.log('⚠️ Fallback zu In-Memory Storage');
                dbMode = '⚠️ In-Memory';
            }
        }
    });
    
    socket.on('updateOrderStatus', async ({ orderId, newStatus }) => {
        try {
            if (pool) {
                // In Datenbank aktualisieren
                await pool.query(`
                    UPDATE orders SET status = $1 WHERE id = $2
                `, [newStatus, orderId]);
            }

            const order = activeOrders.find(o => o.id === orderId);
            if (order) {
                order.status = newStatus;
                console.log(`Status für Bestellung ${orderId} geändert zu ${newStatus}`);
                io.emit('orderStatusChanged', { orderId, newStatus });
            }
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Status:', error);
            // Fallback zu In-Memory wenn Datenbankfehler
            if (pool) {
                console.log('⚠️ Fallback zu In-Memory Storage');
                dbMode = '⚠️ In-Memory';
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Ein Client hat die Verbindung getrennt:', socket.id);
    });
});

// 5. Server starten
async function startServer() {
    await initializeDatabase(); // Initialisiere die Datenbankstruktur
    await loadOrdersFromDatabase();
    
    server.listen(PORT, () => {
        console.log(`🎉 Kassen-Server läuft auf Port ${PORT}`);
        console.log(`Kellner-App: http://localhost:${PORT}/kellner.html`);
        console.log(`Küchen-Display: http://localhost:${PORT}/kueche.html`);
        console.log(`Health Check: http://localhost:${PORT}/health`);
        console.log(`Datenbank: ${dbMode}`);
        console.log(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer();