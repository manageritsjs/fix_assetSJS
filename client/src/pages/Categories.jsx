import { useState, useEffect } from 'react';
import { Tags, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../api';

export default function Categories() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const emptyForm = { code: '', name: '', useful_life_months: '60', depreciation_method: 'straight_line', depreciation_account_debit: '', depreciation_account_credit: '', is_active: 1 };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/categories');
            setData(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/categories/${editing}`, form); }
            else { await api.post('/categories', form); }
            setShowModal(false); setEditing(null); setForm(emptyForm); load();
        } catch (err) { alert(err.response?.data?.error || 'Gagal menyimpan'); }
    };

    const handleEdit = (item) => {
        setForm({ code: item.code, name: item.name, useful_life_months: item.useful_life_months, depreciation_method: item.depreciation_method || 'straight_line', depreciation_account_debit: item.depreciation_account_debit || '', depreciation_account_credit: item.depreciation_account_credit || '', is_active: item.is_active });
        setEditing(item.id); setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus kategori ini?')) return;
        try { await api.delete(`/categories/${id}`); load(); } catch (err) { alert('Gagal menghapus'); }
    };

    return (
        <div>
            <div className="page-header">
                <h1><Tags size={28} /> Kategori Aset</h1>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true); }}>
                    <Plus size={16} /> Tambah Kategori
                </button>
            </div>

            <div className="card">
                {loading ? <div className="loader"><div className="spinner"></div></div> : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Kode</th><th>Nama</th><th>Umur Ekonomis</th><th>Metode</th><th>Akun Debit</th><th>Akun Kredit</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center text-muted" style={{ padding: 40 }}>Belum ada kategori</td></tr>
                                ) : data.map(item => (
                                    <tr key={item.id}>
                                        <td><strong>{item.code}</strong></td>
                                        <td>{item.name}</td>
                                        <td>{item.depreciation_method === 'none' ? '-' : `${item.useful_life_months} bulan`}</td>
                                        <td><span className="badge badge-info">{item.depreciation_method === 'straight_line' ? 'Garis Lurus' : item.depreciation_method === 'declining_balance' ? 'Saldo Menurun' : 'Tidak Disusutkan'}</span></td>
                                        <td>{item.depreciation_account_debit || '-'}</td>
                                        <td>{item.depreciation_account_credit || '-'}</td>
                                        <td>{item.is_active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-muted">Nonaktif</span>}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(item)}><Edit size={14} /></button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 550 }}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                            <button className="btn btn-icon btn-outline" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group"><label>Kode *</label><input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
                                    <div className="form-group"><label>Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Umur Ekonomis (bulan)</label><input type="number" className="form-control" value={form.useful_life_months} onChange={e => setForm({ ...form, useful_life_months: e.target.value })} /></div>
                                    <div className="form-group">
                                        <label>Metode Penyusutan</label>
                                        <select className="form-control" value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })}>
                                            <option value="straight_line">Garis Lurus (Straight Line)</option>
                                            <option value="declining_balance">Saldo Menurun (Declining Balance)</option>
                                            <option value="none">Tidak Disusutkan</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Akun Debit (Beban Penyusutan)</label><input className="form-control" value={form.depreciation_account_debit} onChange={e => setForm({ ...form, depreciation_account_debit: e.target.value })} placeholder="mis: 6101" /></div>
                                    <div className="form-group"><label>Akun Kredit (Akum. Penyusutan)</label><input className="form-control" value={form.depreciation_account_credit} onChange={e => setForm({ ...form, depreciation_account_credit: e.target.value })} placeholder="mis: 1291" /></div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
