import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';
import api from '../api';

export default function DepreciationSettings() {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/depreciation/settings');
            setSettings(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/depreciation/settings', settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { alert('Gagal menyimpan settings'); }
        setSaving(false);
    };

    if (loading) return <div className="loader"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1><Settings size={28} /> Setting Depresiasi</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saved ? <><CheckCircle size={16} /> Tersimpan</> : <><Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Setting'}</>}
                </button>
            </div>

            <div className="card" style={{ maxWidth: 600 }}>
                <h3 style={{ fontSize: 16, marginBottom: 20 }}>Pengaturan Jurnal Depresiasi Otomatis</h3>

                <div className="form-group">
                    <label>Metode Penyusutan Default</label>
                    <select className="form-control" value={settings.default_method || 'straight_line'} onChange={e => setSettings({ ...settings, default_method: e.target.value })}>
                        <option value="straight_line">Garis Lurus (Straight Line)</option>
                        <option value="declining_balance">Saldo Menurun (Declining Balance)</option>
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Akun Debit Default (Beban Penyusutan)</label>
                        <input className="form-control" value={settings.default_debit_account || ''} onChange={e => setSettings({ ...settings, default_debit_account: e.target.value })} placeholder="Contoh: 6100" />
                    </div>
                    <div className="form-group">
                        <label>Akun Kredit Default (Akum. Penyusutan)</label>
                        <input className="form-control" value={settings.default_credit_account || ''} onChange={e => setSettings({ ...settings, default_credit_account: e.target.value })} placeholder="Contoh: 1290" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Tanggal Auto Generate (hari ke- setiap bulan)</label>
                    <input type="number" className="form-control" value={settings.auto_generate_day || '1'} onChange={e => setSettings({ ...settings, auto_generate_day: e.target.value })} min="1" max="28" style={{ width: 120 }} />
                </div>

                <div className="alert alert-info mt-4" style={{ fontSize: 13 }}>
                    <strong>Keterangan:</strong><br />
                    • Akun debit/kredit per kategori dapat di-set di halaman Kategori Aset<br />
                    • Jika kategori tidak punya setting akun, akan menggunakan akun default di atas<br />
                    • Jurnal depresiasi dikelompokkan per kategori aset
                </div>
            </div>
        </div>
    );
}
