import { useState, useRef } from 'react';
import { QrCode, Search, Printer, Camera, X, Package } from 'lucide-react';
import api, { BARCODE_URL } from '../api';
import { jsPDF } from 'jspdf';

const fmtC = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';

export default function Barcode() {
    const [scanCode, setScanCode] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const handleSearch = async () => {
        if (!scanCode.trim()) return;
        setError(''); setResult(null);
        try {
            const res = await api.get(`/assets/barcode/${scanCode.trim()}`);
            setResult(res.data);
        } catch (err) {
            setError('Aset tidak ditemukan');
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; }
            setScanning(true);
        } catch (err) { setError('Gagal mengakses kamera'); }
    };

    const stopCamera = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
        setScanning(false);
    };

    const printBarcode = () => {
        if (!result) return;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [80, 40] });
        doc.setFontSize(8);
        doc.text(result.asset_code, 40, 8, { align: 'center' });
        doc.setFontSize(6);
        doc.text(result.name.substring(0, 30), 40, 13, { align: 'center' });

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', 10, 16, 60, 15);
            doc.save(`barcode_${result.asset_code}.pdf`);
        };
        img.src = `${BARCODE_URL}/${result.barcode}`;
    };

    return (
        <div>
            <div className="page-header"><h1><QrCode size={28} /> Barcode & Scan</h1></div>

            <div className="card mb-4">
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Cari Aset via Barcode</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: 1, maxWidth: 400 }}>
                        <Search />
                        <input placeholder="Masukkan kode barcode / kode aset..." value={scanCode}
                            onChange={e => setScanCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} />
                    </div>
                    <button className="btn btn-primary" onClick={handleSearch}><Search size={16} /> Cari</button>
                    <button className="btn btn-outline" onClick={scanning ? stopCamera : startCamera}>
                        <Camera size={16} /> {scanning ? 'Stop Kamera' : 'Scan Kamera'}
                    </button>
                </div>

                {scanning && (
                    <div style={{ marginTop: 16, maxWidth: 400 }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
                        <p className="text-muted text-sm mt-2">Arahkan kamera ke barcode, lalu ketik kode manual.</p>
                    </div>
                )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {result && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Package size={18} /> Detail Aset</h3>
                        <div className="btn-group">
                            <button className="btn btn-sm btn-primary" onClick={printBarcode}><Printer size={14} /> Cetak Label</button>
                            <button className="btn btn-sm btn-outline" onClick={() => { setResult(null); setScanCode(''); }}><X size={14} /> Tutup</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280 }}>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    {[['Kode', result.asset_code], ['Nama', result.name], ['Kategori', result.category_name || '-'],
                                    ['Lokasi', result.location_name || '-'], ['Harga', fmtC(result.acquisition_cost)],
                                    ['Status', result.status], ['Disusutkan', result.is_depreciable ? 'Ya' : 'Tidak']
                                    ].map(([k, v]) => <tr key={k}><td style={{ padding: '6px 12px', color: 'var(--text-muted)', width: 120 }}>{k}</td><td style={{ padding: '6px 12px' }}>{v}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div className="barcode-container">
                                <img src={`${BARCODE_URL}/${result.barcode}`} alt="barcode" />
                                <span className="barcode-label">{result.barcode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
