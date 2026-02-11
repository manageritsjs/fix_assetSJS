const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all locations
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM asset_locations ORDER BY code');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single location
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM asset_locations WHERE id = ?', [req.params.id]);
        if (result.length === 0) return res.status(404).json({ error: 'Lokasi tidak ditemukan' });
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create location
router.post('/', async (req, res) => {
    try {
        const { code, name, description } = req.body;
        await db.execute(
            'INSERT INTO asset_locations (code, name, description) VALUES (?, ?, ?)',
            [code, name, description]
        );
        const result = await db.query('SELECT * FROM asset_locations WHERE code = ?', [code]);
        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update location
router.put('/:id', async (req, res) => {
    try {
        const { code, name, description, is_active } = req.body;
        await db.execute(
            'UPDATE asset_locations SET code=?, name=?, description=?, is_active=? WHERE id=?',
            [code, name, description, is_active, req.params.id]
        );
        const result = await db.query('SELECT * FROM asset_locations WHERE id = ?', [req.params.id]);
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete location
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM asset_locations WHERE id = ?', [req.params.id]);
        res.json({ message: 'Lokasi berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
