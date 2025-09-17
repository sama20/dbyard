import mysql from 'mysql2/promise';

async function testConnection() {
  const configs = [
    { host: 'localhost', port: 3307, user: 'root', password: '' },
    { host: 'localhost', port: 3307, user: 'root', password: 'root' },
    { host: '127.0.0.1', port: 3307, user: 'root', password: '' },
    { host: '127.0.0.1', port: 3307, user: 'root', password: 'root' },
  ];

  for (const config of configs) {
    try {
      console.log(`Testing connection: ${config.host}:${config.port} with user '${config.user}' and password '${config.password}'`);
      
      const connection = await mysql.createConnection({
        ...config,
        connectTimeout: 5000,
        waitForConnections: true,
      });
      
      await connection.connect();
      const [rows] = await connection.query('SELECT VERSION() as version');
      console.log('✓ SUCCESS:', rows[0].version);
      await connection.end();
      return config; // Return the working config
    } catch (error) {
      console.log('✗ FAILED:', error.code || error.message);
    }
  }
  
  console.log('\nAll connection attempts failed. Please check:');
  console.log('1. MySQL service is running');
  console.log('2. Port number is correct');
  console.log('3. Username and password are correct');
  console.log('4. MySQL authentication plugin compatibility');
}

testConnection().catch(console.error);
