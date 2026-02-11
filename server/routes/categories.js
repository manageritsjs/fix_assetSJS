const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all categories
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM asset_categories ORDER BY code');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM asset_categories WHERE id = ?', [req.params.id]);
        if (result.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create category
router.post('/', async (req, res) => {
    try {
        const { code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit } = req.body;
        await db.execute(
            'INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, useful_life_months || 60, depreciation_method || 'straight_line', depreciation_account_debit, depreciation_account_credit]
        );
        const result = await db.query('SELECT * FROM asset_categories WHERE code = ?', [code]);
        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit, is_active } = req.body;
        await db.execute(
            'UPDATE asset_categories SET code=?, name=?, useful_life_months=?, depreciation_method=?, depreciation_account_debit=?, depreciation_account_credit=?, is_active=? WHERE id=?',
            [code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit, is_active, req.params.id]
        );
        const result = await db.query('SELECT * FROM asset_categories WHERE id = ?', [req.params.id]);
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM asset_categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Kategori berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
