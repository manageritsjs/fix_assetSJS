const odbc = require('odbc');

const CONNECTION_STRING = 'DRIVER={SQL Anywhere 17};SERVER=fixdb;UID=dba;PWD=dbasjs;DBN=fixdb;LINKS=tcpip';

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await odbc.pool(CONNECTION_STRING, {
      initialSize: 2,
      maxSize: 10
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const p = await getPool();
  try {
    const result = await p.query(sql, params);
    return result;
  } catch (err) {
    console.error('DB Query Error:', err.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
}

async function execute(sql, params = []) {
  return query(sql, params);
}

async function testConnection() {
  try {
    const result = await query('SELECT 1 AS test');
    console.log('✅ Database connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

module.exports = { query, execute, testConnection, getPool };
