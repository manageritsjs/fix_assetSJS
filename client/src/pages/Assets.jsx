import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, QrCode, X, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { BARCODE_URL } from '../api';

const formatCurrency = (v) => v ? 'Rp ' + Number(v).toLocaleString('id-ID') : 'Rp 0';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID') : '-';

export default function Assets() {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterLoc, setFilterLoc] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showDetail, setShowDetail] = useState(null);
    const limit = 20;

    const emptyForm = {
        asset_code: '', name: '', description: '', category_id: '', location_id: '',
        acquisition_date: '', acquisition_cost: '', salvage_value: '0', useful_life_months: '60',
        depreciation_method: 'straight_line', is_depreciable: 1, status: 'active',
        condition_status: 'good', serial_number: '', brand: '', model: '', supplier: '', notes: ''
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { loadAssets(); loadMeta(); }, [page, search, filterCat, filterLoc]);

    const loadMeta = async () => {
        try {
            const [catRes, locRes] = await Promise.all([api.get('/categories'), api.get('/locations')]);
            setCategories(catRes.data);
            setLocations(locRes.data);
        } catch (err) { console.error(err); }
    };

    const loadAssets = async () => {
        setLoading(true);
        try {
            const params = { page, limit, search };
            if (filterCat) params.category_id = filterCat;
            if (filterLoc) params.location_id = filterLoc;
            const res = await api.get('/assets', { params });
            setAssets(res.data.data);
            setTotal(res.data.total);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/assets/${editing}`, form);
            } else {
                await api.post('/assets', form);
            }
            setShowModal(false);
            setEditing(null);
            setForm(emptyForm);
            loadAssets();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menyimpan');
        }
    };

    const handleEdit = (asset) => {
        setForm({
            asset_code: asset.asset_code, name: asset.name, description: asset.description || '',
            category_id: asset.category_id || '', location_id: asset.location_id || '',
            acquisition_date: asset.acquisition_date ? asset.acquisition_date.slice(0, 10) : '',
            acquisition_cost: asset.acquisition_cost || '', salvage_value: asset.salvage_value || '0',
            useful_life_months: asset.useful_life_months || '60',
            depreciation_method: asset.depreciation_method || 'straight_line',
            is_depreciable: asset.is_depreciable, status: asset.status || 'active',
            condition_status: asset.condition_status || 'good',
            serial_number: asset.serial_number || '', brand: asset.brand || '',
            model: asset.model || '', supplier: asset.supplier || '', notes: asset.notes || ''
        });
        setEditing(asset.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus aset ini?')) return;
        try {
            await api.delete(`/assets/${id}`);
            loadAssets();
        } catch (err) { alert('Gagal menghapus'); }
    };

    const handleDetail = async (id) => {
        try {
            const res = await api.get(`/assets/${id}`);
            setShowDetail(res.data);
        } catch (err) { console.error(err); }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div>
            <div className="page-header">
                <h1><Package size={28} /> Master Aset</h1>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true); }}>
                    <Plus size={16} /> Tambah Aset
                </button>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <Search />
                    <input placeholder="Cari kode, nama, barcode..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="form-control" style={{ width: 180 }} value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}>
                    <option value="">Semua Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="form-control" style={{ width: 180 }} value={filterLoc} onChange={(e) => { setFilterLoc(e.target.value); setPage(1); }}>
                    <option value="">Semua Lokasi</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <span className="text-muted text-sm">{total} aset</span>
            </div>

            <div className="card">
                {loading ? <div className="loader"><div className="spinner"></div></div> : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Kode</th>
                                    <th>Nama Aset</th>
                                    <th>Kategori</th>
                                    <th>Lokasi</th>
                                    <th>Tgl Perolehan</th>
                                    <th className="text-right">Harga Perolehan</th>
                                    <th>Susut</th>
                                    <th>Status</th>
                                    <th>Barcode</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center text-muted" style={{ padding: 40 }}>Belum ada data aset</td></tr>
                                ) : assets.map(a => (
                                    <tr key={a.id}>
                                        <td><strong style={{ cursor: 'pointer', color: 'var(--primary-light)' }} onClick={() => handleDetail(a.id)}>{a.asset_code}</strong></td>
                                        <td>{a.name}</td>
                                        <td><span className="badge badge-purple">{a.category_name || '-'}</span></td>
                                        <td>{a.location_name || '-'}</td>
                                        <td>{formatDate(a.acquisition_date)}</td>
                                        <td className="text-right number">{formatCurrency(a.acquisition_cost)}</td>
                                        <td>{a.is_depreciable ? <span className="badge badge-success">Ya</span> : <span className="badge badge-muted">Tidak</span>}</td>
                                        <td><span className={`badge ${a.status === 'active' ? 'badge-success' : a.status === 'disposed' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                                        <td>{a.barcode && <img src={`${BARCODE_URL}/${a.barcode}`} alt="barcode" style={{ height: 30 }} />}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button className="btn btn-sm btn-outline" onClick={() => handleEdit(a)}><Edit size={14} /></button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
                        <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                        <span className="text-sm text-muted">Halaman {page} dari {totalPages}</span>
                        <button className="btn btn-sm btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetail && (
                <div className="modal-overlay" onClick={() => setShowDetail(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h2>Detail Aset: {showDetail.asset_code}</h2>
                            <button className="btn btn-icon btn-outline" onClick={() => setShowDetail(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                {showDetail.barcode && <div className="barcode-container">
                                    <img src={`${BARCODE_URL}/${showDetail.barcode}`} alt="barcode" />
                                    <span className="barcode-label">{showDetail.barcode}</span>
                                </div>}
                            </div>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    {[
                                        ['Nama', showDetail.name],
                                        ['Kategori', showDetail.category_name],
                                        ['Lokasi', showDetail.location_name],
                                        ['Tgl Perolehan', formatDate(showDetail.acquisition_date)],
                                        ['Harga Perolehan', formatCurrency(showDetail.acquisition_cost)],
                                        ['Nilai Residu', formatCurrency(showDetail.salvage_value)],
                                        ['Umur Ekonomis', `${showDetail.useful_life_months} bulan`],
                                        ['Metode', showDetail.depreciation_method === 'straight_line' ? 'Garis Lurus' : 'Saldo Menurun'],
                                        ['Disusutkan', showDetail.is_depreciable ? 'Ya' : 'Tidak'],
                                        ['Serial Number', showDetail.serial_number || '-'],
                                        ['Merk', showDetail.brand || '-'],
                                        ['Model', showDetail.model || '-'],
                                        ['Supplier', showDetail.supplier || '-'],
                                        ['Status', showDetail.status],
                                        ['Kondisi', showDetail.condition_status],
                                    ].map(([k, v]) => (
                                        <tr key={k}><td style={{ padding: '6px 12px', color: 'var(--text-muted)', width: 160 }}>{k}</td><td style={{ padding: '6px 12px' }}>{v}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            {showDetail.depreciation_schedules?.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="mb-2" style={{ fontSize: 15 }}>Jadwal Penyusutan</h3>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead><tr><th>Periode</th><th className="text-right">Penyusutan</th><th className="text-right">Akumulasi</th><th className="text-right">Nilai Buku</th><th>Posted</th></tr></thead>
                                            <tbody>
                                                {showDetail.depreciation_schedules.map(s => (
                                                    <tr key={s.id}>
                                                        <td>{s.period_month}/{s.period_year}</td>
                                                        <td className="text-right number">{formatCurrency(s.depreciation_amount)}</td>
                                                        <td className="text-right number">{formatCurrency(s.accumulated_depreciation)}</td>
                                                        <td className="text-right number">{formatCurrency(s.book_value)}</td>
                                                        <td>{s.is_posted ? <span className="badge badge-success">Ya</span> : <span className="badge badge-muted">Belum</span>}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Aset' : 'Tambah Aset Baru'}</h2>
                            <button className="btn btn-icon btn-outline" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Kode Aset *</label>
                                        <input className="form-control" value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Aset *</label>
                                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Kategori</label>
                                        <select className="form-control" value={form.category_id} onChange={e => {
                                            const cat = categories.find(c => c.id == e.target.value);
                                            setForm({
                                                ...form, category_id: e.target.value,
                                                useful_life_months: cat?.useful_life_months || form.useful_life_months,
                                                depreciation_method: cat?.depreciation_method || form.depreciation_method
                                            });
                                        }}>
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Lokasi</label>
                                        <select className="form-control" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                                            <option value="">Pilih Lokasi</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label>Tgl Perolehan *</label>
                                        <input type="date" className="form-control" value={form.acquisition_date} onChange={e => setForm({ ...form, acquisition_date: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Harga Perolehan *</label>
                                        <input type="number" className="form-control" value={form.acquisition_cost} onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} required min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nilai Residu</label>
                                        <input type="number" className="form-control" value={form.salvage_value} onChange={e => setForm({ ...form, salvage_value: e.target.value })} min="0" />
                                    </div>
                                </div>
                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label>Umur Ekonomis (bln)</label>
                                        <input type="number" className="form-control" value={form.useful_life_months} onChange={e => setForm({ ...form, useful_life_months: e.target.value })} min="0" />
                                    </div>
                                    <div className="form-group">
                                        <label>Metode Penyusutan</label>
                                        <select className="form-control" value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })}>
                                            <option value="straight_line">Garis Lurus</option>
                                            <option value="declining_balance">Saldo Menurun</option>
                                            <option value="none">Tidak Disusutkan</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="disposed">Disposed</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={form.is_depreciable == 1} onChange={e => setForm({ ...form, is_depreciable: e.target.checked ? 1 : 0 })} />
                                            Aset Disusutkan
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label>Kondisi</label>
                                        <select className="form-control" value={form.condition_status} onChange={e => setForm({ ...form, condition_status: e.target.value })}>
                                            <option value="good">Baik</option>
                                            <option value="fair">Cukup</option>
                                            <option value="poor">Rusak Ringan</option>
                                            <option value="damaged">Rusak Berat</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row-3">
                                    <div className="form-group">
                                        <label>Serial Number</label>
                                        <input className="form-control" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Merk</label>
                                        <input className="form-control" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <input className="form-control" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Supplier</label>
                                    <input className="form-control" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Catatan</label>
                                    <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows="2"></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Simpan Perubahan' : 'Tambah Aset'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
