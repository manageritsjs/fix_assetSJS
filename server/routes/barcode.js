const express = require('express');
const router = express.Router();
const bwipjs = require('bwip-js');
const { authMiddleware } = require('../middleware/auth');

// Generate barcode image (public endpoint for barcode rendering)
router.get('/generate/:code', async (req, res) => {
    try {
        const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: req.params.code,
            scale: 3,
            height: 12,
            includetext: true,
            textxalign: 'center',
            textsize: 10
        });
        res.setHeader('Content-Type', 'image/png');
        res.send(png);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate QR code
router.get('/qr/:code', async (req, res) => {
    try {
        const png = await bwipjs.toBuffer({
            bcid: 'qrcode',
            text: req.params.code,
            scale: 4,
            padding: 4
        });
        res.setHeader('Content-Type', 'image/png');
        res.send(png);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
