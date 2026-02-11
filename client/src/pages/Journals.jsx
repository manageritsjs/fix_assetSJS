import { useState, useEffect } from 'react';
import { BookOpen, Eye, X } from 'lucide-react';
import api from '../api';

const fmtC = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';
const fmtD = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';
const Y = new Date().getFullYear();
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function Journals() {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(Y);
    const [det, setDet] = useState(null);

    useEffect(() => { load(); }, [year]);
    const load = async () => { setLoading(true); try { const r = await api.get('/journals', { params: { year } }); setList(r.data); } catch (e) { } setLoading(false); };

    return (
        <div>
            <div className="page-header"><h1><BookOpen size={28} /> Jurnal Depresiasi</h1></div>
            <div className="toolbar">
                <select className="form-control" value={year} onChange={e => setYear(+e.target.value)} style={{ width: 120 }}>
                    {[Y - 2, Y - 1, Y, Y + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-muted text-sm">{list.length} jurnal</span>
            </div>
            <div className="card">
                {loading ? <div className="loader"><div className="spinner" /></div> : <div className="table-wrapper"><table>
                    <thead><tr><th>No. Jurnal</th><th>Tanggal</th><th>Periode</th><th className="text-right">Debit</th><th className="text-right">Kredit</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>{list.length === 0 ? <tr><td colSpan="7" className="text-center text-muted" style={{ padding: 40 }}>Belum ada jurnal</td></tr> : list.map(j => (
                        <tr key={j.id}><td><strong>{j.journal_no}</strong></td><td>{fmtD(j.journal_date)}</td><td>{MN[j.period_month - 1]} {j.period_year}</td>
                            <td className="text-right number">{fmtC(j.total_debit)}</td><td className="text-right number">{fmtC(j.total_credit)}</td>
                            <td><span className={`badge ${j.status === 'posted' ? 'badge-success' : 'badge-warning'}`}>{j.status}</span></td>
                            <td><button className="btn btn-sm btn-outline" onClick={async () => { try { const r = await api.get(`/journals/${j.id}`); setDet(r.data); } catch (e) { } }}><Eye size={14} /></button></td></tr>
                    ))}</tbody></table></div>}
            </div>
            {det && <div className="modal-overlay" onClick={() => setDet(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                <div className="modal-header"><h2>{det.journal_no}</h2><button className="btn btn-icon btn-outline" onClick={() => setDet(null)}><X size={16} /></button></div>
                <div className="modal-body">
                    <p className="text-muted mb-4">{det.description}</p>
                    <div className="table-wrapper"><table>
                        <thead><tr><th>Akun</th><th>Nama</th><th className="text-right">Debit</th><th className="text-right">Kredit</th></tr></thead>
                        <tbody>{(det.details || []).map(d => <tr key={d.id}><td><strong>{d.account_code}</strong></td><td>{d.account_name}</td>
                            <td className="text-right number">{d.debit_amount > 0 ? fmtC(d.debit_amount) : ''}</td><td className="text-right number">{d.credit_amount > 0 ? fmtC(d.credit_amount) : ''}</td></tr>)}
                            <tr style={{ fontWeight: 700 }}><td colSpan="2" className="text-right">Total</td><td className="text-right number">{fmtC(det.total_debit)}</td><td className="text-right number">{fmtC(det.total_credit)}</td></tr>
                        </tbody></table></div>
                </div>
            </div></div>}
        </div>
    );
}
