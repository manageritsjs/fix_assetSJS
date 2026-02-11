import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, MapPin, Calculator, BookOpen, BarChart3, QrCode, Settings, LogOut, Menu } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Categories from './pages/Categories';
import Locations from './pages/Locations';
import Depreciation from './pages/Depreciation';
import Journals from './pages/Journals';
import Barcode from './pages/Barcode';
import Reports from './pages/Reports';
import DepreciationSettings from './pages/DepreciationSettings';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="loader"><div className="spinner"></div></div>;

  if (!user) {
    return <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>;
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/depreciation" element={<Depreciation />} />
          <Route path="/depreciation-settings" element={<DepreciationSettings />} />
          <Route path="/journals" element={<Journals />} />
          <Route path="/barcode" element={<Barcode />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      section: 'Menu Utama', items: [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/assets', icon: Package, label: 'Master Aset' },
        { path: '/categories', icon: Tags, label: 'Kategori Aset' },
        { path: '/locations', icon: MapPin, label: 'Lokasi Aset' },
      ]
    },
    {
      section: 'Penyusutan', items: [
        { path: '/depreciation', icon: Calculator, label: 'Jadwal & Generate' },
        { path: '/depreciation-settings', icon: Settings, label: 'Setting Depresiasi' },
        { path: '/journals', icon: BookOpen, label: 'Jurnal Depresiasi' },
      ]
    },
    {
      section: 'Tools', items: [
        { path: '/barcode', icon: QrCode, label: 'Barcode & Scan' },
        { path: '/reports', icon: BarChart3, label: 'Laporan' },
      ]
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>⚙️ Fix Asset</h2>
        <p>Management System</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user.full_name?.[0] || 'U'}</div>
          <div className="user-details">
            <div className="name">{user.full_name}</div>
            <div className="role">{user.role}</div>
          </div>
          <button className="btn btn-icon btn-outline" onClick={onLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default App;
