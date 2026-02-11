const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Asset list report
router.get('/assets', async (req, res) => {
    try {
        const { category_id, location_id, status } = req.query;
        let sql = `SELECT a.*, c.name as category_name, c.code as category_code,
               l.name as location_name, l.code as location_code
               FROM assets a
               LEFT JOIN asset_categories c ON a.category_id = c.id
               LEFT JOIN asset_locations l ON a.location_id = l.id
               WHERE 1=1`;
        const params = [];
        if (category_id) { sql += ' AND a.category_id = ?'; params.push(category_id); }
        if (location_id) { sql += ' AND a.location_id = ?'; params.push(location_id); }
        if (status) { sql += ' AND a.status = ?'; params.push(status); }
        sql += ' ORDER BY a.asset_code';

        const result = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Asset card (kartu aset)
router.get('/asset-card/:id', async (req, res) => {
    try {
        const asset = await db.query(
            `SELECT a.*, c.name as category_name, l.name as location_name
       FROM assets a
       LEFT JOIN asset_categories c ON a.category_id = c.id
       LEFT JOIN asset_locations l ON a.location_id = l.id
       WHERE a.id = ?`, [req.params.id]);

        if (asset.length === 0) return res.status(404).json({ error: 'Aset tidak ditemukan' });

        const schedules = await db.query(
            'SELECT * FROM depreciation_schedules WHERE asset_id = ? ORDER BY period_year, period_month',
            [req.params.id]);

        res.json({ asset: asset[0], schedules });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Depreciation report
router.get('/depreciation', async (req, res) => {
    try {
        const { year, month } = req.query;
        let sql = `SELECT a.asset_code, a.name as asset_name, a.acquisition_date, a.acquisition_cost,
               a.salvage_value, a.useful_life_months, a.depreciation_method,
               c.name as category_name,
               COALESCE(SUM(ds.depreciation_amount), 0) as total_depreciation,
               MAX(ds.accumulated_depreciation) as accumulated_depreciation,
               MIN(ds.book_value) as book_value
               FROM assets a
               LEFT JOIN asset_categories c ON a.category_id = c.id
               LEFT JOIN depreciation_schedules ds ON a.id = ds.asset_id`;
        const params = [];

        if (year && month) {
            sql += ' AND ds.period_year = ? AND ds.period_month = ?';
            params.push(year, month);
        } else if (year) {
            sql += ' AND ds.period_year = ?';
            params.push(year);
        }

        sql += ` WHERE a.is_depreciable = 1
             GROUP BY a.asset_code, a.name, a.acquisition_date, a.acquisition_cost,
             a.salvage_value, a.useful_life_months, a.depreciation_method, c.name
             ORDER BY a.asset_code`;

        const result = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Summary report
router.get('/summary', async (req, res) => {
    try {
        const byCategory = await db.query(
            `SELECT c.name as category_name, COUNT(a.id) as asset_count,
              COALESCE(SUM(a.acquisition_cost), 0) as total_cost,
              COALESCE(SUM(CASE WHEN a.is_depreciable = 1 THEN (
                SELECT COALESCE(SUM(ds.depreciation_amount), 0) FROM depreciation_schedules ds WHERE ds.asset_id = a.id AND ds.is_posted = 1
              ) ELSE 0 END), 0) as total_depreciation
       FROM asset_categories c
       LEFT JOIN assets a ON c.id = a.category_id AND a.status = 'active'
       GROUP BY c.name
       ORDER BY total_cost DESC`
        );

        res.json({ by_category: byCategory });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
