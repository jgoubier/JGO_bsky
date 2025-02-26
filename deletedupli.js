const mysql = require('mysql2/promise');
const dote = require('dotenv').config({ path:'/var/www/myapp/config.env'}); // To use environment variables
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'dupli_cronlog.txt');

function logMessage(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
}

try {
    logMessage('Script started.');
} catch (error) {
    logMessage(`Error: ${error.message}`);
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function removeDuplicates() {
  let connection;

  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database.');
    logMessage('Connected to the database');

//////////////////////////////////// GOV table 1 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName = 'gov'; // Replace with your table name
const duplicateColumn = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery = `
  DELETE t1
  FROM ${tableName} t1
  INNER JOIN ${tableName} t2
  ON t1.${duplicateColumn} = t2.${duplicateColumn}
  WHERE t1.id > t2.id;
`;

const [result1] = await connection.execute(deleteDuplicatesQuery);
console.log(`Deleted ${result1.affectedRows} duplicate rows in ${tableName}.`);
logMessage(`Deleted ${result1.affectedRows} duplicate rows in ${tableName}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery = `
DELETE FROM ${tableName} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 500
  ) AS subquery
);
`;

const [result2] = await connection.execute(deleteOlderEntriesQuery);
console.log(`Deleted ${result2.affectedRows} rows older than the 500 most recent entries in ${tableName}.`);
logMessage(`Deleted ${result2.affectedRows} rows older than the 500 most recent entries in ${tableName}.`);

//////////////////////////////////// COM table 2 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName2 = 'com'; // Replace with your table name
const duplicateColumn2 = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery2 = `
  DELETE t1
  FROM ${tableName2} t1
  INNER JOIN ${tableName2} t2
  ON t1.${duplicateColumn2} = t2.${duplicateColumn2}
  WHERE t1.id > t2.id;
`;

const [result12] = await connection.execute(deleteDuplicatesQuery2);
console.log(`Deleted ${result12.affectedRows} duplicate rows in ${tableName2}.`);
logMessage(`Deleted ${result12.affectedRows} duplicate rows in ${tableName2}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery2 = `
DELETE FROM ${tableName2} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName2} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 500
  ) AS subquery
);
`;

const [result22] = await connection.execute(deleteOlderEntriesQuery2);
console.log(`Deleted ${result22.affectedRows} rows older than the 500 most recent entries in ${tableName2}.`);
logMessage(`Deleted ${result22.affectedRows} rows older than the 500 most recent entries in ${tableName2}.`);

//////////////////////////////////// ORG table 3 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName3 = 'org'; // Replace with your table name
const duplicateColumn3 = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery3 = `
  DELETE t1
  FROM ${tableName3} t1
  INNER JOIN ${tableName3} t2
  ON t1.${duplicateColumn3} = t2.${duplicateColumn3}
  WHERE t1.id > t2.id;
`;

const [result13] = await connection.execute(deleteDuplicatesQuery3);
console.log(`Deleted ${result13.affectedRows} duplicate rows in ${tableName3}.`);
logMessage(`Deleted ${result13.affectedRows} duplicate rows in ${tableName3}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery3 = `
DELETE FROM ${tableName3} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName3} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 500
  ) AS subquery
);
`;

const [result23] = await connection.execute(deleteOlderEntriesQuery3);
console.log(`Deleted ${result23.affectedRows} rows older than the 500 most recent entries in ${tableName3}.`);
logMessage(`Deleted ${result23.affectedRows} rows older than the 500 most recent entries in ${tableName3}.`);

//////////////////////////////////// EDU table 4 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName4 = 'edu'; // Replace with your table name
const duplicateColumn4 = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery4 = `
  DELETE t1
  FROM ${tableName4} t1
  INNER JOIN ${tableName4} t2
  ON t1.${duplicateColumn4} = t2.${duplicateColumn4}
  WHERE t1.id > t2.id;
`;

const [result14] = await connection.execute(deleteDuplicatesQuery4);
console.log(`Deleted ${result14.affectedRows} duplicate rows in ${tableName4}.`);
logMessage(`Deleted ${result14.affectedRows} duplicate rows in ${tableName4}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery4 = `
DELETE FROM ${tableName4} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName4} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 500
  ) AS subquery
);
`;

const [result24] = await connection.execute(deleteOlderEntriesQuery4);
console.log(`Deleted ${result24.affectedRows} rows older than the 500 most recent entries in ${tableName4}.`);
logMessage(`Deleted ${result24.affectedRows} rows older than the 500 most recent entries in ${tableName4}.`);

//////////////////////////////////// EUR table 5 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName5 = 'eur'; // Replace with your table name
const duplicateColumn5 = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery5 = `
  DELETE t1
  FROM ${tableName5} t1
  INNER JOIN ${tableName5} t2
  ON t1.${duplicateColumn5} = t2.${duplicateColumn5}
  WHERE t1.id > t2.id;
`;

const [result15] = await connection.execute(deleteDuplicatesQuery5);
console.log(`Deleted ${result15.affectedRows} duplicate rows in ${tableName5}.`);
logMessage(`Deleted ${result15.affectedRows} duplicate rows in ${tableName5}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery5 = `
DELETE FROM ${tableName5} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName5} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 500
  ) AS subquery
);
`;

const [result25] = await connection.execute(deleteOlderEntriesQuery5);
console.log(`Deleted ${result25.affectedRows} rows older than the 500 most recent entries in ${tableName5}.`);
logMessage(`Deleted ${result25.affectedRows} rows older than the 500 most recent entries in ${tableName5}.`);

//////////////////////////////////// events table 6 //////////////////////////////////////////////////////

// Define the table and column(s) for duplicate removal
const tableName6 = 'events'; // Replace with your table name
const duplicateColumn6 = 'did'; // Replace with the column name for duplicates

// Step 1: Delete duplicates (keeping the row with the smallest ID for each `did`)
const deleteDuplicatesQuery6 = `
  DELETE t1
  FROM ${tableName6} t1
  INNER JOIN ${tableName6} t2
  ON t1.${duplicateColumn6} = t2.${duplicateColumn6}
  WHERE t1.id > t2.id;
`;

// DISABLED // const [result15] = await connection.execute(deleteDuplicatesQuery5);
// DISABLED // console.log(`Deleted ${result15.affectedRows} duplicate rows in ${tableName5}.`);

// Step 2: Delete rows except for the 500 most recent entries based on ID
const deleteOlderEntriesQuery6 = `
DELETE FROM ${tableName6} 
WHERE ID < (
  SELECT min_id FROM (
    SELECT ID AS min_id FROM ${tableName6} 
    ORDER BY ID DESC 
    LIMIT 1 OFFSET 50000
  ) AS subquery
);
`;

// DISABLED // const [result26] = await connection.execute(deleteOlderEntriesQuery6);
// DISABLED // console.log(`Deleted ${result26.affectedRows} rows older than the 500 most recent entries in ${tableName6}.`);

  } catch (error) {
    console.error('An error occurred:', error.message);
    logMessage('An error occurred:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
      logMessage('Database connection closed.');
    }
  }
}

// Run the function
removeDuplicates();