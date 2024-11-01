import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const createConnectionConfig = ({ host, port, username, password, database }) => ({
  host,
  port: parseInt(port),
  user: username,
  password: password || undefined,
  database,
  connectTimeout: 10000,
  waitForConnections: true,
});

const formatFieldType = (field) => {
  const typeMap = {
    0x01: 'TINYINT',
    0x02: 'SMALLINT',
    0x03: 'INT',
    0x08: 'BIGINT',
    0x09: 'MEDIUMINT', // Hypothetical identifier
    0x04: 'FLOAT',
    0x05: 'DOUBLE',
    0x0A: 'DATE',
    0x0B: 'TIME',
    0x0C: 'DATETIME',
    0xF6: 'DECIMAL',
    0xFD: 'VARCHAR',
    0xFC: 'TEXT',
    0x07: 'TIMESTAMP',
    0xF7: 'CHAR',
    0xF9: 'BLOB',
    0xFA: 'VARBINARY',
    0xFB: 'BINARY',
    0xFE: 'ENUM',
    0xFF: 'SET',
    0x10: 'BIT',
    0x11: 'BOOLEAN', // Often represented as TINYINT(1)
    0xF5: 'JSON'
  };
  return typeMap[field.type] || 'UNKNOWN';
};


app.post('/api/execute', async (req, res) => {
  const { host, port, username, password, database, query } = req.body;
  
  try {
    const connection = await mysql.createConnection(createConnectionConfig({
      host, port, username, password, database
    }));

    const startTime = process.hrtime();
    const [rows, fields] = await connection.execute(query);
    const endTime = process.hrtime(startTime);
    const executionTime = endTime[0] * 1000 + endTime[1] / 1000000;

    await connection.end();
    
    // Convert RowDataPacket to plain objects
    const plainRows = Array.isArray(rows) 
      ? rows.map(row => Object.assign({}, row))
      : [];

    const formattedFields = fields?.map(field => ({
      name: field.name,
      type: formatFieldType(field),
      length: field.columnLength,
      flags: field.flags
    })) || [];

    res.json({
      rows: plainRows,
      fields: formattedFields,
      executionTime,
      rowsAffected: Array.isArray(rows) ? rows.length : rows?.affectedRows || 0
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({ 
      error: error.message,
      rows: [],
      fields: [],
      executionTime: 0,
      rowsAffected: 0
    });
  }
});

app.post('/api/test-connection', async (req, res) => {
  const { host, port, username, password, database } = req.body;
  
  try {
    const connection = await mysql.createConnection(createConnectionConfig({
      host, port, username, password, database
    }));
    
    await connection.connect();
    await connection.end();
    
    res.json({ success: true, message: 'Connection successful!' });
  } catch (error) {
    console.error('Connection error:', error);
    let errorMessage = 'Connection failed';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Could not connect to MySQL at ${host}:${port}. Please verify that MySQL is running and the port is correct.`;
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Access denied. Please check your username and password.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = `Database '${database}' does not exist.`;
    }
    
    res.json({ 
      success: false, 
      message: errorMessage,
      code: error.code
    });
  }
});

app.post('/api/databases', async (req, res) => {
  const { host, port, username, password } = req.body;
  
  try {
    const connection = await mysql.createConnection(createConnectionConfig({
      host, port, username, password, database: undefined
    }));

    const [rows] = await connection.query('SHOW DATABASES');
    await connection.end();
    
    res.json(rows.map(row => row.Database));
  } catch (error) {
    console.error('Database list error:', error);
    res.status(500).json({ 
      error: error.code === 'ECONNREFUSED' 
        ? `Could not connect to MySQL at ${host}:${port}` 
        : error.message 
    });
  }
});

app.post('/api/tables', async (req, res) => {
  const { host, port, username, password, database } = req.body;
  
  try {
    const connection = await mysql.createConnection(createConnectionConfig({
      host, port, username, password, database
    }));

    const [rows] = await connection.query('SHOW TABLES');
    await connection.end();
    
    res.json(rows.map(row => Object.values(row)[0]));
  } catch (error) {
    console.error('Table list error:', error);
    res.status(500).json({ 
      error: error.code === 'ECONNREFUSED' 
        ? `Could not connect to MySQL at ${host}:${port}` 
        : error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});