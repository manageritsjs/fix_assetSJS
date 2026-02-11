import { useState, useEffect } from 'react';
import { Calculator, Play, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

const formatCurrency = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Depreciation() {
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [posting, setPosting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { loadSchedules(); }, [year, month]);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const res = await api.get('/depreciation/schedules', { params: { year, month } });
            setSchedules(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setMessage(null);
        try {
            const res = await api.post('/depreciation/generate', { year, month });
            setMessage({ type: 'success', text: res.data.message });
            loadSchedules();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Gagal generate' });
        }
        setGenerating(false);
    };

    const handlePostJournal = async () => {
        if (!confirm(`Posting jurnal depresiasi untuk ${months[month - 1]} ${year}?`)) return;
        setPosting(true);
        setMessage(null);
        try {
            const res = await api.post('/depreciation/post-journal', { year, month });
            setMessage({ type: 'success', text: res.data.message });
            loadSchedules();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Gagal posting jurnal' });
        }
        setPosting(false);
    };

    const unpostedCount = schedules.filter(s => !s.is_posted).length;
    const totalDepr = schedules.reduce((sum, s) => sum + parseFloat(s.depreciation_amount || 0), 0);

    return (
        <div>
            <div className="page-header">
                <h1><Calculator size={28} /> Jadwal Penyusutan & Generate</h1>
            </div>

            <div className="card mb-4">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Tahun</label>
                        <select className="form-control" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 120 }}>
                            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Bulan</label>
                        <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 160 }}>
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                        <Play size={16} /> {generating ? 'Generating...' : 'Generate Penyusutan'}
                    </button>
                    {unpostedCount > 0 && (
                        <button className="btn btn-success" onClick={handlePostJournal} disabled={posting}>
                            <BookOpen size={16} /> {posting ? 'Posting...' : `Posting Jurnal (${unpostedCount} aset)`}
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16 }}>Penyusutan {months[month - 1]} {year}</h3>
                    <div className="text-sm">
                        <span className="text-muted">Total: </span>
                        <strong className="number">{formatCurrency(totalDepr)}</strong>
                        <span className="text-muted ml-3"> | {schedules.length} aset</span>
                    </div>
                </div>

                {loading ? <div className="loader"><div className="spinner"></div></div> : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Kode Aset</th>
                                    <th>Nama Aset</th>
                                    <th>Kategori</th>
                                    <th className="text-right">Harga Perolehan</th>
                                    <th className="text-right">Penyusutan</th>
                                    <th className="text-right">Akumulasi</th>
                                    <th className="text-right">Nilai Buku</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>Belum ada jadwal penyusutan untuk periode ini. Klik "Generate Penyusutan" untuk membuat.</td></tr>
                                ) : schedules.map(s => (
                                    <tr key={s.id}>
                                        <td><strong>{s.asset_code}</strong></td>
                                        <td>{s.asset_name}</td>
                                        <td><span className="badge badge-purple">{s.category_name || '-'}</span></td>
                                        <td className="text-right number">{formatCurrency(s.acquisition_cost)}</td>
                                        <td className="text-right number">{formatCurrency(s.depreciation_amount)}</td>
                                        <td className="text-right number">{formatCurrency(s.accumulated_depreciation)}</td>
                                        <td className="text-right number">{formatCurrency(s.book_value)}</td>
                                        <td>{s.is_posted ? <span className="badge badge-success">Posted</span> : <span className="badge badge-warning">Belum</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
