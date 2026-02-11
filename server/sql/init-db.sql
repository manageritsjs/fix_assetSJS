-- ============================================
-- Fix Asset Management System - Database Schema
-- SQL Anywhere 17
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
);

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    useful_life_months INTEGER DEFAULT 60,
    depreciation_method VARCHAR(30) DEFAULT 'straight_line',
    depreciation_account_debit VARCHAR(20),
    depreciation_account_credit VARCHAR(20),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
);

-- Asset Locations
CREATE TABLE IF NOT EXISTS asset_locations (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_active SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
);

-- Assets Master
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    asset_code VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES asset_categories(id),
    location_id INTEGER REFERENCES asset_locations(id),
    acquisition_date DATE NOT NULL,
    acquisition_cost DECIMAL(18, 2) NOT NULL DEFAULT 0,
    salvage_value DECIMAL(18, 2) DEFAULT 0,
    useful_life_months INTEGER DEFAULT 60,
    depreciation_method VARCHAR(30) DEFAULT 'straight_line',
    is_depreciable SMALLINT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    condition_status VARCHAR(20) DEFAULT 'good',
    serial_number VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    supplier VARCHAR(200),
    notes TEXT,
    photo_url VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
);

-- Depreciation Settings (global)
CREATE TABLE IF NOT EXISTS depreciation_settings (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value VARCHAR(255),
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT TIMESTAMP
);

-- Depreciation Schedules (per asset per period)
CREATE TABLE IF NOT EXISTS depreciation_schedules (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    depreciation_amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    accumulated_depreciation DECIMAL(18, 2) NOT NULL DEFAULT 0,
    book_value DECIMAL(18, 2) NOT NULL DEFAULT 0,
    is_posted SMALLINT DEFAULT 0,
    journal_entry_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
    UNIQUE(asset_id, period_year, period_month)
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    journal_no VARCHAR(50) NOT NULL UNIQUE,
    journal_date DATE NOT NULL,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    description VARCHAR(255),
    total_debit DECIMAL(18, 2) DEFAULT 0,
    total_credit DECIMAL(18, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT TIMESTAMP,
    posted_at TIMESTAMP
);

-- Journal Entry Details
CREATE TABLE IF NOT EXISTS journal_entry_details (
    id INTEGER DEFAULT AUTOINCREMENT PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(100),
    asset_id INTEGER REFERENCES assets(id),
    debit_amount DECIMAL(18, 2) DEFAULT 0,
    credit_amount DECIMAL(18, 2) DEFAULT 0,
    description VARCHAR(255)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role)
SELECT 'admin', '$2b$10$rIC/Vl8HJxBgKGLGFOQBb.Z0VZGFWSJQCjY8BqEsqnXB7cPJ6we7i', 'Administrator', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert default depreciation settings
INSERT INTO depreciation_settings (setting_key, setting_value, description)
SELECT 'default_method', 'straight_line', 'Metode penyusutan default'
WHERE NOT EXISTS (SELECT 1 FROM depreciation_settings WHERE setting_key = 'default_method');

INSERT INTO depreciation_settings (setting_key, setting_value, description)
SELECT 'auto_generate_day', '1', 'Tanggal otomatis generate jurnal depresiasi'
WHERE NOT EXISTS (SELECT 1 FROM depreciation_settings WHERE setting_key = 'auto_generate_day');

INSERT INTO depreciation_settings (setting_key, setting_value, description)
SELECT 'default_debit_account', '6100', 'Akun debit default (Beban Penyusutan)'
WHERE NOT EXISTS (SELECT 1 FROM depreciation_settings WHERE setting_key = 'default_debit_account');

INSERT INTO depreciation_settings (setting_key, setting_value, description)
SELECT 'default_credit_account', '1290', 'Akun kredit default (Akumulasi Penyusutan)'
WHERE NOT EXISTS (SELECT 1 FROM depreciation_settings WHERE setting_key = 'default_credit_account');

-- Insert sample categories
INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit)
SELECT 'BNG', 'Bangunan', 240, 'straight_line', '6101', '1291'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'BNG');

INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit)
SELECT 'KND', 'Kendaraan', 96, 'straight_line', '6102', '1292'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'KND');

INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit)
SELECT 'MSN', 'Mesin & Peralatan', 96, 'straight_line', '6103', '1293'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'MSN');

INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit)
SELECT 'INV', 'Inventaris Kantor', 48, 'straight_line', '6104', '1294'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'INV');

INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method, depreciation_account_debit, depreciation_account_credit)
SELECT 'KMP', 'Komputer & IT', 48, 'straight_line', '6105', '1295'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'KMP');

INSERT INTO asset_categories (code, name, useful_life_months, depreciation_method)
SELECT 'TNH', 'Tanah', 0, 'none'
WHERE NOT EXISTS (SELECT 1 FROM asset_categories WHERE code = 'TNH');

-- Insert sample locations
INSERT INTO asset_locations (code, name, description)
SELECT 'HO', 'Head Office', 'Kantor Pusat'
WHERE NOT EXISTS (SELECT 1 FROM asset_locations WHERE code = 'HO');

INSERT INTO asset_locations (code, name, description)
SELECT 'WH', 'Warehouse', 'Gudang'
WHERE NOT EXISTS (SELECT 1 FROM asset_locations WHERE code = 'WH');

INSERT INTO asset_locations (code, name, description)
SELECT 'BR1', 'Branch 1', 'Cabang 1'
WHERE NOT EXISTS (SELECT 1 FROM asset_locations WHERE code = 'BR1');
