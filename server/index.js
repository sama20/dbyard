import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { Client } from 'ssh2';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const GITHUB_CLIENT_ID = process.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error("GitHub client ID or secret not found in .env.local. Please check your environment variables.");
  process.exit(1);
}

// Proxy for getting device code
app.post('/api/github/device/code', async (req, res) => {
  try {
    const response = await axios.post('https://github.com/login/device/code', {
      client_id: GITHUB_CLIENT_ID,
      scope: req.body.scope,
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying device code request:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to get device code from GitHub' });
  }
});

// Proxy for getting access token
app.post('/api/github/login/oauth/access_token', async (req, res) => {
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      device_code: req.body.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying access token request:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to get access token' });
  }
});

// Proxy for getting user data
app.get('/api/github/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying user request:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch user data' });
  }
});

// Proxy for checking Copilot status - improved version
app.get('/api/copilot_internal/token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    try {
      // Get user information to check if they likely have Copilot
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const user = userResponse.data;
      
      // Enhanced user tier detection
      const isPremiumUser = 
        user.plan?.name === 'pro' ||           // GitHub Pro users
        user.plan?.name === 'team' ||          // Team plan users  
        user.plan?.name === 'enterprise' ||    // Enterprise users
        (user.plan?.private_repos > 0) ||      // Users with private repo access
        user.company;                          // Company-affiliated users
      
      // Basic heuristics to determine Copilot access
      const hasLikelyCopilotAccess = 
        isPremiumUser ||                       // Premium users likely have Copilot
        user.plan?.name === 'free' ||          // Free users can have Copilot Individual
        user.type === 'User' ||                // Individual users
        user.public_repos > 5;                 // Active developers likely have Copilot
      
      if (hasLikelyCopilotAccess) {
        const mockCopilotToken = {
          token: 'ghu_mock_copilot_token_' + Buffer.from(user.login).toString('base64'),
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          permissions: {
            chat: true,
            completions: true
          },
          user_tier: isPremiumUser ? 'premium' : 'free',
          has_copilot: true
        };
        
        res.json(mockCopilotToken);
      } else {
        return res.status(401).json({ 
          error: 'User does not appear to have Copilot access',
          hint: 'This is determined by basic heuristics since GitHub does not expose Copilot subscription status via public API'
        });
      }
    } catch (userError) {
      if (userError.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid GitHub token' });
      }
      throw userError;
    }
  } catch (error) {
    console.error('Error checking Copilot status:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to check Copilot status' });
  }
});

// Proxy for getting Copilot usage
app.get('/api/copilot/usage', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    try {
      // Verify user has valid GitHub token first
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const user = userResponse.data;
      
      // Determine user tier for premium features
      const isPremiumUser = 
        user.plan?.name === 'pro' ||           
        user.plan?.name === 'team' ||          
        user.plan?.name === 'enterprise' ||    
        (user.plan?.private_repos > 0) ||      
        user.company;                          
      
      // Since GitHub doesn't expose Copilot usage via public API, 
      // we'll return mock data that matches VS Code Copilot format
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      const copilotUsageData = {
        // Copilot-specific metrics matching VS Code display
        codeCompletions: "Included",
        chatMessages: "Included",
        premiumRequests: {
          used: isPremiumUser ? 31.3 : 85.7,     // Premium users have lower usage
          percentage: isPremiumUser ? "31.3%" : "85.7%",
          disabled: !isPremiumUser              // Disable premium features for free users
        },
        allowanceResetDate: nextMonth.toISOString(),
        workspaceIndex: isPremiumUser ? "Enhanced index" : "Basic index",
        // Additional internal data
        billingCycle: 'monthly',
        hasActiveSubscription: true,
        subscriptionType: isPremiumUser ? 'premium' : 'individual',
        userTier: isPremiumUser ? 'premium' : 'free'
      };      res.json(copilotUsageData);
    } catch (userError) {
      if (userError.response?.status === 401) {
        return res.status(404).json({ error: 'User does not have valid GitHub access' });
      }
      throw userError;
    }
  } catch (error) {
    console.error('Error fetching Copilot usage:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch Copilot usage' });
  }
});

// Proxy for getting user's Copilot subscription and available models
app.get('/api/copilot/subscription', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    
    try {
      // Get user information
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      const user = userResponse.data;
      console.log('User data:', {
        login: user.login,
        plan: user.plan?.name || 'free',
        company: user.company || 'none',
        publicRepos: user.public_repos || 0,
        followers: user.followers || 0
      });
      
      // Try to get organization memberships to determine enterprise access
      let hasEnterpriseAccess = false;
      try {
        const orgsResponse = await axios.get('https://api.github.com/user/orgs', {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        // Check if user belongs to organizations that might have Copilot Enterprise
        hasEnterpriseAccess = orgsResponse.data.some(org => 
          org.plan?.name === 'business' || 
          org.plan?.name === 'enterprise' ||
          org.total_private_repos > 50
        );
      } catch {
        // Ignore errors, user might not have org access
      }
      
      // Determine subscription level and available models based on real GitHub data
      let subscriptionData = {
        hasActiveSubscription: false,
        subscriptionType: 'none',
        userTier: 'free',
        availableModels: ['gpt-3.5-turbo'], // Default free model
        features: {
          codeCompletions: false,
          chatMessages: false,
          premiumModels: false
        }
      };
      
      // Check for Copilot Individual (most common)
      if (user.plan?.name === 'free' || user.plan?.name === 'pro') {
        // Individual users might have Copilot Individual subscription
        subscriptionData = {
          hasActiveSubscription: true,
          subscriptionType: 'individual',
          userTier: 'individual',
          availableModels: ['gpt-3.5-turbo', 'copilot'],
          features: {
            codeCompletions: true,
            chatMessages: true,
            premiumModels: false // Individual doesn't get premium models like GPT-4
          }
        };
      }
      
      // Check for Copilot Business/Enterprise
      if (hasEnterpriseAccess || user.company) {
        subscriptionData = {
          hasActiveSubscription: true,
          subscriptionType: 'business',
          userTier: 'business',
          availableModels: ['gpt-3.5-turbo', 'copilot', 'gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
          features: {
            codeCompletions: true,
            chatMessages: true,
            premiumModels: true // Business/Enterprise gets premium models
          }
        };
      }
      
      // Enhanced detection for premium users
      const isProbablyPremiumUser = 
        user.public_repos > 100 ||         // Very active developer
        user.followers > 1000 ||           // Popular developer
        user.following > 500 ||            // Well-connected developer
        (user.company && user.public_repos > 20) || // Company developer
        user.plan?.name === 'pro';         // Pro plan user
        
      if (isProbablyPremiumUser && !hasEnterpriseAccess) {
        // Upgrade individual to premium individual
        subscriptionData.userTier = 'premium';
        subscriptionData.availableModels = ['gpt-3.5-turbo', 'copilot', 'gpt-4'];
        subscriptionData.features.premiumModels = true;
      }
      
      // Add user metadata
      subscriptionData.user = {
        login: user.login,
        plan: user.plan?.name || 'free',
        company: user.company || null,
        publicRepos: user.public_repos || 0,
        followers: user.followers || 0
      };
      
      console.log('Final subscription data:', subscriptionData);
      
      res.json(subscriptionData);
    } catch (userError) {
      if (userError.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid GitHub token' });
      }
      throw userError;
    }
  } catch (error) {
    console.error('Error fetching Copilot subscription:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch subscription data' });
  }
});

// MySQL Database functionality
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

const createConnectionConfig = ({ host, port, username, password, database }) => {
  const config = {
    host,
    port: parseInt(port),
    user: username,
    password: password || undefined,
    connectTimeout: 10000,
    waitForConnections: true,
  };
  
  // Only add database if it's provided and not empty
  if (database && database.trim() !== '') {
    config.database = database;
  }
  
  return config;
};

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

    // Only use SSH if sshConfig is provided AND has required fields
    if (sshConfig && sshConfig.host && sshConfig.username) {
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
    } else {
      errorMessage = error.message || 'Connection failed';
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

app.listen(port, () => {
  console.log(`Backend proxy server listening at http://localhost:${port}`);
});