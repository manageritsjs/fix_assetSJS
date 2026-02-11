const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all journals
router.get('/', async (req, res) => {
    try {
        const { year, month, status } = req.query;
        let sql = `SELECT j.*, u.full_name as created_by_name
               FROM journal_entries j
               LEFT JOIN users u ON j.created_by = u.id
               WHERE 1=1`;
        const params = [];
        if (year) { sql += ' AND j.period_year = ?'; params.push(year); }
        if (month) { sql += ' AND j.period_month = ?'; params.push(month); }
        if (status) { sql += ' AND j.status = ?'; params.push(status); }
        sql += ' ORDER BY j.journal_date DESC';

        const result = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get journal details
router.get('/:id', async (req, res) => {
    try {
        const journal = await db.query(
            `SELECT j.*, u.full_name as created_by_name
       FROM journal_entries j LEFT JOIN users u ON j.created_by = u.id
       WHERE j.id = ?`, [req.params.id]);
        if (journal.length === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });

        const details = await db.query(
            `SELECT jd.*, a.asset_code, a.name as asset_name
       FROM journal_entry_details jd
       LEFT JOIN assets a ON jd.asset_id = a.id
       WHERE jd.journal_entry_id = ?
       ORDER BY jd.id`, [req.params.id]);

        res.json({ ...journal[0], details });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
