import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../api';

export default function Locations() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const emptyForm = { code: '', name: '', description: '', is_active: 1 };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { const res = await api.get('/locations'); setData(res.data); } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/locations/${editing}`, form); } else { await api.post('/locations', form); }
            setShowModal(false); setEditing(null); setForm(emptyForm); load();
        } catch (err) { alert(err.response?.data?.error || 'Gagal menyimpan'); }
    };

    const handleEdit = (item) => {
        setForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active });
        setEditing(item.id); setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus lokasi ini?')) return;
        try { await api.delete(`/locations/${id}`); load(); } catch (err) { alert('Gagal menghapus'); }
    };

    return (
        <div>
            <div className="page-header">
                <h1><MapPin size={28} /> Lokasi Aset</h1>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true); }}><Plus size={16} /> Tambah Lokasi</button>
            </div>
            <div className="card">
                {loading ? <div className="loader"><div className="spinner"></div></div> : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Kode</th><th>Nama</th><th>Deskripsi</th><th>Status</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {data.length === 0 ? <tr><td colSpan="5" className="text-center text-muted" style={{ padding: 40 }}>Belum ada lokasi</td></tr> :
                                    data.map(item => (
                                        <tr key={item.id}>
                                            <td><strong>{item.code}</strong></td><td>{item.name}</td><td>{item.description || '-'}</td>
                                            <td>{item.is_active ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-muted">Nonaktif</span>}</td>
                                            <td><div className="btn-group"><button className="btn btn-sm btn-outline" onClick={() => handleEdit(item)}><Edit size={14} /></button><button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button></div></td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header"><h2>{editing ? 'Edit Lokasi' : 'Tambah Lokasi'}</h2><button className="btn btn-icon btn-outline" onClick={() => setShowModal(false)}><X size={16} /></button></div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group"><label>Kode *</label><input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
                                    <div className="form-group"><label>Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                </div>
                                <div className="form-group"><label>Deskripsi</label><textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="2"></textarea></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
