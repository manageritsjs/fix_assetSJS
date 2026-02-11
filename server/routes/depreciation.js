const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get depreciation settings
router.get('/settings', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM depreciation_settings ORDER BY setting_key');
        const settings = {};
        result.forEach(r => { settings[r.setting_key] = r.setting_value; });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update depreciation settings
router.post('/settings', async (req, res) => {
    try {
        const entries = Object.entries(req.body);
        for (const [key, value] of entries) {
            const existing = await db.query('SELECT id FROM depreciation_settings WHERE setting_key = ?', [key]);
            if (existing.length > 0) {
                await db.execute('UPDATE depreciation_settings SET setting_value = ?, updated_at = CURRENT TIMESTAMP WHERE setting_key = ?', [value, key]);
            } else {
                await db.execute('INSERT INTO depreciation_settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
            }
        }
        res.json({ message: 'Setting berhasil disimpan' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get depreciation schedules for an asset
router.get('/schedules/:assetId', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM depreciation_schedules WHERE asset_id = ? ORDER BY period_year, period_month',
            [req.params.assetId]
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all schedules for a period
router.get('/schedules', async (req, res) => {
    try {
        const { year, month } = req.query;
        let sql = `SELECT ds.*, a.asset_code, a.name as asset_name, a.acquisition_cost,
               c.name as category_name
               FROM depreciation_schedules ds
               JOIN assets a ON ds.asset_id = a.id
               LEFT JOIN asset_categories c ON a.category_id = c.id
               WHERE 1=1`;
        const params = [];
        if (year) { sql += ' AND ds.period_year = ?'; params.push(year); }
        if (month) { sql += ' AND ds.period_month = ?'; params.push(month); }
        sql += ' ORDER BY a.asset_code, ds.period_year, ds.period_month';

        const result = await db.query(sql, params);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate depreciation schedules for a period
router.post('/generate', async (req, res) => {
    try {
        const { year, month } = req.body;
        if (!year || !month) return res.status(400).json({ error: 'Year dan month diperlukan' });

        // Get all depreciable active assets
        const assets = await db.query(
            `SELECT a.*, c.depreciation_account_debit, c.depreciation_account_credit
       FROM assets a
       LEFT JOIN asset_categories c ON a.category_id = c.id
       WHERE a.is_depreciable = 1 AND a.status = 'active' AND a.useful_life_months > 0`
        );

        // Get default accounts from settings
        const settings = await db.query('SELECT * FROM depreciation_settings');
        const settingsMap = {};
        settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

        let generatedCount = 0;
        let totalDepreciation = 0;
        const results = [];

        for (const asset of assets) {
            // Check if already generated for this period
            const existing = await db.query(
                'SELECT id FROM depreciation_schedules WHERE asset_id = ? AND period_year = ? AND period_month = ?',
                [asset.id, year, month]
            );
            if (existing.length > 0) continue;

            // Calculate months since acquisition
            const acqDate = new Date(asset.acquisition_date);
            const periodDate = new Date(year, month - 1, 1);
            if (periodDate < acqDate) continue; // Skip if period is before acquisition

            const monthsSinceAcq = (periodDate.getFullYear() - acqDate.getFullYear()) * 12 + (periodDate.getMonth() - acqDate.getMonth());
            if (monthsSinceAcq >= asset.useful_life_months) continue; // Fully depreciated

            let depAmount = 0;
            const depreciableValue = parseFloat(asset.acquisition_cost) - parseFloat(asset.salvage_value || 0);

            if (asset.depreciation_method === 'straight_line') {
                depAmount = depreciableValue / asset.useful_life_months;
            } else if (asset.depreciation_method === 'declining_balance') {
                const rate = 2 / asset.useful_life_months;
                // Get accumulated depreciation so far
                const accDep = await db.query(
                    'SELECT COALESCE(SUM(depreciation_amount), 0) as total FROM depreciation_schedules WHERE asset_id = ?',
                    [asset.id]
                );
                const currentBookValue = parseFloat(asset.acquisition_cost) - parseFloat(accDep[0]?.total || 0);
                depAmount = currentBookValue * rate;
                // Ensure book value doesn't go below salvage value
                if (currentBookValue - depAmount < parseFloat(asset.salvage_value || 0)) {
                    depAmount = currentBookValue - parseFloat(asset.salvage_value || 0);
                }
            }

            if (depAmount <= 0) continue;
            depAmount = Math.round(depAmount * 100) / 100;

            // Get accumulated depreciation
            const prevAcc = await db.query(
                'SELECT COALESCE(SUM(depreciation_amount), 0) as total FROM depreciation_schedules WHERE asset_id = ?',
                [asset.id]
            );
            const accumulated = parseFloat(prevAcc[0]?.total || 0) + depAmount;
            const bookValue = parseFloat(asset.acquisition_cost) - accumulated;

            await db.execute(
                `INSERT INTO depreciation_schedules (asset_id, period_year, period_month, depreciation_amount, accumulated_depreciation, book_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [asset.id, year, month, depAmount, accumulated, bookValue]
            );

            generatedCount++;
            totalDepreciation += depAmount;
            results.push({ asset_code: asset.asset_code, name: asset.name, amount: depAmount });
        }

        res.json({
            message: `Berhasil generate ${generatedCount} jadwal penyusutan`,
            generated_count: generatedCount,
            total_depreciation: Math.round(totalDepreciation * 100) / 100,
            details: results
        });
    } catch (err) {
        console.error('Generate depreciation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Post depreciation journal for a period
router.post('/post-journal', async (req, res) => {
    try {
        const { year, month } = req.body;
        if (!year || !month) return res.status(400).json({ error: 'Year dan month diperlukan' });

        // Check if journal already exists for this period
        const existingJournal = await db.query(
            "SELECT id FROM journal_entries WHERE period_year = ? AND period_month = ? AND status = 'posted'",
            [year, month]
        );
        if (existingJournal.length > 0) {
            return res.status(400).json({ error: 'Jurnal depresiasi untuk periode ini sudah di-posting' });
        }

        // Get unposted schedules for this period
        const schedules = await db.query(
            `SELECT ds.*, a.asset_code, a.name as asset_name, a.category_id,
              c.depreciation_account_debit, c.depreciation_account_credit, c.name as category_name
       FROM depreciation_schedules ds
       JOIN assets a ON ds.asset_id = a.id
       LEFT JOIN asset_categories c ON a.category_id = c.id
       WHERE ds.period_year = ? AND ds.period_month = ? AND ds.is_posted = 0`,
            [year, month]
        );

        if (schedules.length === 0) {
            return res.status(400).json({ error: 'Tidak ada jadwal penyusutan yang belum di-posting untuk periode ini. Silakan generate terlebih dahulu.' });
        }

        // Get default accounts
        const settings = await db.query('SELECT * FROM depreciation_settings');
        const settingsMap = {};
        settings.forEach(s => { settingsMap[s.setting_key] = s.setting_value; });

        const monthStr = String(month).padStart(2, '0');
        const journalNo = `DEP-${year}${monthStr}`;
        const journalDate = `${year}-${monthStr}-01`;
        let totalAmount = 0;

        // Create journal entry
        await db.execute(
            `INSERT INTO journal_entries (journal_no, journal_date, period_year, period_month, description, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'posted', ?)`,
            [journalNo, journalDate, year, month, `Jurnal Penyusutan Aset Tetap - ${monthStr}/${year}`, req.user.id]
        );

        const journalResult = await db.query('SELECT * FROM journal_entries WHERE journal_no = ?', [journalNo]);
        const journalId = journalResult[0].id;

        // Create journal details grouped by category
        const categoryGroups = {};
        for (const sch of schedules) {
            const debitAcc = sch.depreciation_account_debit || settingsMap.default_debit_account || '6100';
            const creditAcc = sch.depreciation_account_credit || settingsMap.default_credit_account || '1290';
            const key = `${debitAcc}-${creditAcc}`;
            if (!categoryGroups[key]) {
                categoryGroups[key] = { debitAcc, creditAcc, categoryName: sch.category_name || 'Umum', amount: 0, assets: [] };
            }
            categoryGroups[key].amount += parseFloat(sch.depreciation_amount);
            categoryGroups[key].assets.push(sch);
            totalAmount += parseFloat(sch.depreciation_amount);
        }

        for (const group of Object.values(categoryGroups)) {
            const amount = Math.round(group.amount * 100) / 100;
            // Debit entry
            await db.execute(
                `INSERT INTO journal_entry_details (journal_entry_id, account_code, account_name, debit_amount, credit_amount, description)
         VALUES (?, ?, ?, ?, 0, ?)`,
                [journalId, group.debitAcc, `Beban Penyusutan - ${group.categoryName}`, amount, `Penyusutan ${group.categoryName} ${monthStr}/${year}`]
            );
            // Credit entry
            await db.execute(
                `INSERT INTO journal_entry_details (journal_entry_id, account_code, account_name, debit_amount, credit_amount, description)
         VALUES (?, ?, ?, 0, ?, ?)`,
                [journalId, group.creditAcc, `Akum. Penyusutan - ${group.categoryName}`, amount, `Akumulasi Penyusutan ${group.categoryName} ${monthStr}/${year}`]
            );
        }

        // Update journal totals
        totalAmount = Math.round(totalAmount * 100) / 100;
        await db.execute(
            'UPDATE journal_entries SET total_debit = ?, total_credit = ?, posted_at = CURRENT TIMESTAMP WHERE id = ?',
            [totalAmount, totalAmount, journalId]
        );

        // Mark schedules as posted
        for (const sch of schedules) {
            await db.execute(
                'UPDATE depreciation_schedules SET is_posted = 1, journal_entry_id = ? WHERE id = ?',
                [journalId, sch.id]
            );
        }

        res.json({
            message: `Jurnal depresiasi berhasil di-posting: ${journalNo}`,
            journal_no: journalNo,
            total_amount: totalAmount,
            entries_count: schedules.length
        });
    } catch (err) {
        console.error('Post journal error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
