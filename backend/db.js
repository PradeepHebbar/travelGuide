// backend/db.js
const { Pool } = require('pg');
const config = require('../constants/config.json');

const pool = new Pool({
  connectionString: config.DATABASE_URL
});

module.exports = pool;

