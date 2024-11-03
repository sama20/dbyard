import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';
import net from 'net';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const createSSHTunnel = async (sshConfig, dbConfig) => {
  return new Promise((resolve, reject) => {
    const ssh = new Client();

    ssh.on('ready', () => {
      ssh.forwardOut(
        '127.0.0.1',
        0,
        dbConfig.host,
        parseInt(dbConfig.port),
        (err, stream) => {
          if (err) {
            ssh.end();
            reject(err);
            return;
          }

          // Return both the tunnel and connection details
          resolve({
            stream,
            ssh,
            config: {
              ...dbConfig,
              stream
            }
          });
        }
      );
    });

    ssh.on('error', (err) => {
      reject(err);
    });

    // Connect with either password or private key
    const sshConnectConfig = {
      host: sshConfig.host,
      port: parseInt(sshConfig.port),
      username: sshConfig.username
    };

    if (sshConfig.privateKey) {
      sshConnectConfig.privateKey = sshConfig.privateKey;
    } else {
      sshConnectConfig.password = sshConfig.password;
    }

    ssh.connect(sshConnectConfig);
  });
};

const createConnectionConfig = ({ host, port, username, password, database }) => ({
  host,
  port: parseInt(port),
  user: username,
  password: password || undefined,
  database,
  connectTimeout: 10000,
  waitForConnections: true,
});

app.post('/api/test-ssh', async (req, res) => {
  const sshConfig = req.body;
  
  try {
    const ssh = new Client();
    
    await new Promise((resolve, reject) => {
      ssh.on('ready', () => {
        ssh.end();
        resolve();
      });
      
      ssh.on('error', (err) => {
        reject(err);
      });
      
      const config = {
        host: sshConfig.host,
        port: parseInt(sshConfig.port),
        username: sshConfig.username
      };
      
      if (sshConfig.privateKey) {
        config.privateKey = sshConfig.privateKey;
      } else {
        config.password = sshConfig.password;
      }
      
      ssh.connect(config);
    });
    
    res.json({ success: true, message: 'SSH connection successful' });
  } catch (error) {
    console.error('SSH connection error:', error);
    res.json({ 
      success: false, 
      message: error.message || 'SSH connection failed' 
    });
  }
});

app.post('/api/execute', async (req, res) => {
  const { host, port, username, password, database, query, sshConfig } = req.body;
  let connection;
  let sshClient;
  
  try {
    const dbConfig = createConnectionConfig({
      host, port, username, password, database
    });

    if (sshConfig) {
      const tunnel = await createSSHTunnel(sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const startTime = process.hrtime();
    const [rows, fields] = await connection.execute(query);
    const endTime = process.hrtime(startTime);
    const executionTime = endTime[0] * 1000 + endTime[1] / 1000000;

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
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

app.post('/api/test-connection', async (req, res) => {
  const { host, port, username, password, database, sshConfig } = req.body;
  let connection;
  let sshClient;
  
  try {
    const dbConfig = createConnectionConfig({
      host, port, username, password, database
    });

    if (sshConfig) {
      const tunnel = await createSSHTunnel(sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }
    
    await connection.connect();
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
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

app.post('/api/databases', async (req, res) => {
  const { host, port, username, password, sshConfig } = req.body;
  let connection;
  let sshClient;
  
  try {
    const dbConfig = createConnectionConfig({
      host, port, username, password, database: undefined
    });

    if (sshConfig) {
      const tunnel = await createSSHTunnel(sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const [rows] = await connection.query('SHOW DATABASES');
    res.json(rows.map(row => row.Database));
  } catch (error) {
    console.error('Database list error:', error);
    res.status(500).json({ 
      error: error.code === 'ECONNREFUSED' 
        ? `Could not connect to MySQL at ${host}:${port}` 
        : error.message 
    });
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

app.post('/api/tables', async (req, res) => {
  const { host, port, username, password, database, sshConfig } = req.body;
  let connection;
  let sshClient;
  
  try {
    const dbConfig = createConnectionConfig({
      host, port, username, password, database
    });

    if (sshConfig) {
      const tunnel = await createSSHTunnel(sshConfig, dbConfig);
      connection = await mysql.createConnection(tunnel.config);
      sshClient = tunnel.ssh;
    } else {
      connection = await mysql.createConnection(dbConfig);
    }

    const [rows] = await connection.query('SHOW TABLES');
    res.json(rows.map(row => Object.values(row)[0]));
  } catch (error) {
    console.error('Table list error:', error);
    res.status(500).json({ 
      error: error.code === 'ECONNREFUSED' 
        ? `Could not connect to MySQL at ${host}:${port}` 
        : error.message 
    });
  } finally {
    if (connection) await connection.end();
    if (sshClient) sshClient.end();
  }
});

const formatFieldType = (field) => {
  const typeMap = {
    0x01: 'TINYINT',
    0x02: 'SMALLINT',
    0x03: 'INT',
    0x08: 'BIGINT',
    0x09: 'MEDIUMINT',
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
    0x11: 'BOOLEAN',
    0xF5: 'JSON'
  };
  return typeMap[field.type] || 'UNKNOWN';
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});