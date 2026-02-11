const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all assets with filters
router.get('/', async (req, res) => {
    try {
        const { search, category_id, location_id, status, is_depreciable, page = 1, limit = 50 } = req.query;
        let sql = `SELECT a.*, c.name as category_name, c.code as category_code, l.name as location_name, l.code as location_code 
               FROM assets a 
               LEFT JOIN asset_categories c ON a.category_id = c.id 
               LEFT JOIN asset_locations l ON a.location_id = l.id 
               WHERE 1=1`;
        const params = [];

        if (search) {
            sql += ` AND (a.asset_code LIKE ? OR a.name LIKE ? OR a.barcode LIKE ? OR a.serial_number LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }
        if (category_id) { sql += ` AND a.category_id = ?`; params.push(category_id); }
        if (location_id) { sql += ` AND a.location_id = ?`; params.push(location_id); }
        if (status) { sql += ` AND a.status = ?`; params.push(status); }
        if (is_depreciable !== undefined) { sql += ` AND a.is_depreciable = ?`; params.push(is_depreciable); }

        sql += ` ORDER BY a.asset_code`;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ` ROWS ${offset + 1} TO ${offset + parseInt(limit)}`;

        const result = await db.query(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM assets a WHERE 1=1`;
        const countParams = [];
        if (search) {
            countSql += ` AND (a.asset_code LIKE ? OR a.name LIKE ? OR a.barcode LIKE ? OR a.serial_number LIKE ?)`;
            const s = `%${search}%`;
            countParams.push(s, s, s, s);
        }
        if (category_id) { countSql += ` AND a.category_id = ?`; countParams.push(category_id); }
        if (location_id) { countSql += ` AND a.location_id = ?`; countParams.push(location_id); }
        if (status) { countSql += ` AND a.status = ?`; countParams.push(status); }
        if (is_depreciable !== undefined) { countSql += ` AND a.is_depreciable = ?`; countParams.push(is_depreciable); }

        const countResult = await db.query(countSql, countParams);

        res.json({
            data: result,
            total: countResult[0]?.total || 0,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single asset
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT a.*, c.name as category_name, c.code as category_code, l.name as location_name, l.code as location_code 
       FROM assets a 
       LEFT JOIN asset_categories c ON a.category_id = c.id 
       LEFT JOIN asset_locations l ON a.location_id = l.id 
       WHERE a.id = ?`, [req.params.id]);
        if (result.length === 0) return res.status(404).json({ error: 'Aset tidak ditemukan' });

        // Get depreciation schedule
        const schedules = await db.query(
            'SELECT * FROM depreciation_schedules WHERE asset_id = ? ORDER BY period_year, period_month', [req.params.id]);

        res.json({ ...result[0], depreciation_schedules: schedules });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get asset by barcode
router.get('/barcode/:code', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT a.*, c.name as category_name, l.name as location_name 
       FROM assets a 
       LEFT JOIN asset_categories c ON a.category_id = c.id 
       LEFT JOIN asset_locations l ON a.location_id = l.id 
       WHERE a.barcode = ? OR a.asset_code = ?`, [req.params.code, req.params.code]);
        if (result.length === 0) return res.status(404).json({ error: 'Aset tidak ditemukan' });
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create asset
router.post('/', async (req, res) => {
    try {
        const { asset_code, name, description, category_id, location_id, acquisition_date, acquisition_cost,
            salvage_value, useful_life_months, depreciation_method, is_depreciable, status,
            condition_status, serial_number, brand, model, supplier, notes } = req.body;

        const barcode = asset_code; // Use asset_code as barcode

        await db.execute(
            `INSERT INTO assets (asset_code, barcode, name, description, category_id, location_id, acquisition_date,
        acquisition_cost, salvage_value, useful_life_months, depreciation_method, is_depreciable, status,
        condition_status, serial_number, brand, model, supplier, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [asset_code, barcode, name, description, category_id, location_id, acquisition_date,
                acquisition_cost || 0, salvage_value || 0, useful_life_months || 60,
                depreciation_method || 'straight_line', is_depreciable !== undefined ? is_depreciable : 1,
                status || 'active', condition_status || 'good', serial_number, brand, model, supplier, notes, req.user.id]
        );

        const result = await db.query('SELECT * FROM assets WHERE asset_code = ?', [asset_code]);
        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update asset
router.put('/:id', async (req, res) => {
    try {
        const { asset_code, name, description, category_id, location_id, acquisition_date, acquisition_cost,
            salvage_value, useful_life_months, depreciation_method, is_depreciable, status,
            condition_status, serial_number, brand, model, supplier, notes } = req.body;

        await db.execute(
            `UPDATE assets SET asset_code=?, barcode=?, name=?, description=?, category_id=?, location_id=?,
        acquisition_date=?, acquisition_cost=?, salvage_value=?, useful_life_months=?,
        depreciation_method=?, is_depreciable=?, status=?, condition_status=?,
        serial_number=?, brand=?, model=?, supplier=?, notes=?, updated_at=CURRENT TIMESTAMP
       WHERE id=?`,
            [asset_code, asset_code, name, description, category_id, location_id, acquisition_date,
                acquisition_cost, salvage_value, useful_life_months, depreciation_method, is_depreciable,
                status, condition_status, serial_number, brand, model, supplier, notes, req.params.id]
        );

        const result = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
        res.json(result[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete asset
router.delete('/:id', async (req, res) => {
    try {
        // Delete related depreciation schedules first
        await db.execute('DELETE FROM depreciation_schedules WHERE asset_id = ?', [req.params.id]);
        await db.execute('DELETE FROM assets WHERE id = ?', [req.params.id]);
        res.json({ message: 'Aset berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard summary
router.get('/summary/dashboard', async (req, res) => {
    try {
        const totalAssets = await db.query('SELECT COUNT(*) as count FROM assets');
        const totalValue = await db.query('SELECT COALESCE(SUM(acquisition_cost), 0) as total FROM assets WHERE status = ?', ['active']);
        const depreciableCount = await db.query('SELECT COUNT(*) as count FROM assets WHERE is_depreciable = 1 AND status = ?', ['active']);
        const nonDepreciableCount = await db.query('SELECT COUNT(*) as count FROM assets WHERE is_depreciable = 0 AND status = ?', ['active']);

        const byCategory = await db.query(
            `SELECT c.name, COUNT(a.id) as count, COALESCE(SUM(a.acquisition_cost), 0) as total_value
       FROM asset_categories c LEFT JOIN assets a ON c.id = a.category_id
       GROUP BY c.name ORDER BY total_value DESC`
        );

        const byLocation = await db.query(
            `SELECT l.name, COUNT(a.id) as count, COALESCE(SUM(a.acquisition_cost), 0) as total_value
       FROM asset_locations l LEFT JOIN assets a ON l.id = a.location_id
       GROUP BY l.name ORDER BY total_value DESC`
        );

        const byStatus = await db.query(
            `SELECT status, COUNT(*) as count FROM assets GROUP BY status`
        );

        const totalDepreciation = await db.query(
            'SELECT COALESCE(SUM(depreciation_amount), 0) as total FROM depreciation_schedules WHERE is_posted = 1'
        );

        res.json({
            total_assets: totalAssets[0]?.count || 0,
            total_value: totalValue[0]?.total || 0,
            depreciable_count: depreciableCount[0]?.count || 0,
            non_depreciable_count: nonDepreciableCount[0]?.count || 0,
            total_depreciation: totalDepreciation[0]?.total || 0,
            by_category: byCategory,
            by_location: byLocation,
            by_status: byStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
