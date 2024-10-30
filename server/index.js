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
  connectTimeout: 10000, // 10 second timeout
  waitForConnections: true,
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