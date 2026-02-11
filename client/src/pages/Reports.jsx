import { useState, useEffect } from 'react';
import { BarChart3, FileText, Printer } from 'lucide-react';
import api from '../api';

const fmtC = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';
const fmtD = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';
const Y = new Date().getFullYear();

export default function Reports() {
    const [tab, setTab] = useState('assets');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(Y);

    useEffect(() => { load(); }, [tab, year]);

    const load = async () => {
        setLoading(true);
        try {
            if (tab === 'assets') {
                const r = await api.get('/reports/assets');
                setData(r.data);
            } else if (tab === 'depreciation') {
                const r = await api.get('/reports/depreciation', { params: { year } });
                setData(r.data);
            } else if (tab === 'summary') {
                const r = await api.get('/reports/summary');
                setData(r.data.by_category || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1><BarChart3 size={28} /> Laporan</h1>
                <button className="btn btn-outline" onClick={() => window.print()}>
                    <Printer size={16} /> Cetak
                </button>
            </div>

            <div className="toolbar">
                {['assets', 'depreciation', 'summary'].map(t => (
                    <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setTab(t)}>
                        <FileText size={14} />
                        {t === 'assets' ? 'Daftar Aset' : t === 'depreciation' ? 'Penyusutan' : 'Ringkasan'}
                    </button>
                ))}
                {tab === 'depreciation' && (
                    <select className="form-control" value={year} onChange={e => setYear(+e.target.value)} style={{ width: 120 }}>
                        {[Y - 2, Y - 1, Y, Y + 1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                )}
            </div>

            <div className="card">
                {loading ? <div className="loader"><div className="spinner" /></div> : (
                    <>
                        {tab === 'assets' && (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Lokasi</th><th>Tgl Perolehan</th><th className="text-right">Harga</th><th>Susut</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {data.length === 0 ? <tr><td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>Tidak ada data</td></tr> :
                                            data.map(a => (
                                                <tr key={a.id || a.asset_code}>
                                                    <td><strong>{a.asset_code}</strong></td><td>{a.name}</td>
                                                    <td>{a.category_name || '-'}</td><td>{a.location_name || '-'}</td>
                                                    <td>{fmtD(a.acquisition_date)}</td>
                                                    <td className="text-right number">{fmtC(a.acquisition_cost)}</td>
                                                    <td>{a.is_depreciable ? 'Ya' : 'Tidak'}</td>
                                                    <td><span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-muted'}`}>{a.status}</span></td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'depreciation' && (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th className="text-right">Harga</th><th className="text-right">Residu</th><th className="text-right">Penyusutan</th><th className="text-right">Akumulasi</th><th className="text-right">Nilai Buku</th></tr></thead>
                                    <tbody>
                                        {data.length === 0 ? <tr><td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>Tidak ada data</td></tr> :
                                            data.map((a, i) => (
                                                <tr key={i}>
                                                    <td><strong>{a.asset_code}</strong></td><td>{a.asset_name}</td>
                                                    <td>{a.category_name || '-'}</td>
                                                    <td className="text-right number">{fmtC(a.acquisition_cost)}</td>
                                                    <td className="text-right number">{fmtC(a.salvage_value)}</td>
                                                    <td className="text-right number">{fmtC(a.total_depreciation)}</td>
                                                    <td className="text-right number">{fmtC(a.accumulated_depreciation)}</td>
                                                    <td className="text-right number">{fmtC(a.book_value)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'summary' && (
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Kategori</th><th className="text-right">Jumlah Aset</th><th className="text-right">Total Harga</th><th className="text-right">Total Penyusutan</th></tr></thead>
                                    <tbody>
                                        {data.length === 0 ? <tr><td colSpan="4" className="text-center text-muted" style={{ padding: 40 }}>Tidak ada data</td></tr> :
                                            data.map((c, i) => (
                                                <tr key={i}>
                                                    <td><strong>{c.category_name}</strong></td>
                                                    <td className="text-right number">{c.asset_count}</td>
                                                    <td className="text-right number">{fmtC(c.total_cost)}</td>
                                                    <td className="text-right number">{fmtC(c.total_depreciation)}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
