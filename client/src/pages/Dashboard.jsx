import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, DollarSign, TrendingDown, Building2, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const formatCurrency = (v) => {
    if (!v) return 'Rp 0';
    return 'Rp ' + Number(v).toLocaleString('id-ID');
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await api.get('/assets/summary/dashboard');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loader"><div className="spinner"></div></div>;
    if (!data) return <div className="alert alert-error"><AlertCircle size={16} /> Gagal memuat data dashboard</div>;

    const pieData = (data.by_category || []).filter(c => c.count > 0).map(c => ({
        name: c.name, value: Number(c.total_value)
    }));

    const barData = (data.by_location || []).filter(l => l.count > 0).map(l => ({
        name: l.name, jumlah: l.count, nilai: Number(l.total_value)
    }));

    return (
        <div>
            <div className="page-header">
                <h1><LayoutDashboard size={28} /> Dashboard</h1>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon purple"><Package size={24} /></div>
                    <div className="stat-info">
                        <h3 className="number">{data.total_assets}</h3>
                        <p>Total Aset</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3 className="number">{formatCurrency(data.total_value)}</h3>
                        <p>Total Nilai Aset</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon amber"><TrendingDown size={24} /></div>
                    <div className="stat-info">
                        <h3 className="number">{data.depreciable_count}</h3>
                        <p>Aset Disusutkan</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Building2 size={24} /></div>
                    <div className="stat-info">
                        <h3 className="number">{data.non_depreciable_count}</h3>
                        <p>Aset Tidak Disusutkan</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon red"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <h3 className="number">{formatCurrency(data.total_depreciation)}</h3>
                        <p>Total Penyusutan</p>
                    </div>
                </div>
            </div>

            <div className="chart-grid">
                <div className="chart-card">
                    <h3>Nilai Aset per Kategori</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-muted text-center" style={{ padding: 40 }}>Belum ada data</p>}
                </div>
                <div className="chart-card">
                    <h3>Aset per Lokasi</h3>
                    {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8 }} />
                                <Bar dataKey="jumlah" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-muted text-center" style={{ padding: 40 }}>Belum ada data</p>}
                </div>
            </div>

            {data.by_status && data.by_status.length > 0 && (
                <div className="card">
                    <h3 style={{ marginBottom: 16 }}>Status Aset</h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {data.by_status.map(s => (
                            <div key={s.status} className="stat-card" style={{ flex: '1 1 150px' }}>
                                <div className="stat-info">
                                    <h3 className="number">{s.count}</h3>
                                    <p style={{ textTransform: 'capitalize' }}>{s.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
