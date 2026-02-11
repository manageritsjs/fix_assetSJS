const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/depreciation', require('./routes/depreciation'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api/barcode', require('./routes/barcode'));
app.use('/api/reports', require('./routes/reports'));

// Serve frontend static files
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientDist, 'index.html'));
        }
    });
}

// Initialize database and start server
async function initDB() {
    const connected = await db.testConnection();
    if (!connected) {
        console.error('❌ Cannot start server without database connection');
        console.error('Make sure SQL Anywhere 17 is running with server name "fixdb"');
        process.exit(1);
    }

    // Run init SQL
    const initSql = fs.readFileSync(path.join(__dirname, 'sql', 'init-db.sql'), 'utf8');
    const statements = initSql.split(';').filter(s => s.trim().length > 0);

    for (const stmt of statements) {
        try {
            await db.execute(stmt.trim());
        } catch (err) {
            // Ignore errors for IF NOT EXISTS style statements
            if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                console.warn('Init SQL warning:', err.message.slice(0, 100));
            }
        }
    }
    console.log('✅ Database tables initialized');
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Fix Asset Server running on http://localhost:${PORT}`);
        console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
}).catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
});
