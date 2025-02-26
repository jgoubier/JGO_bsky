const WebSocket = require ('ws');
const mysql = require ('mysql2/promise');
//import mysql from 'mysql2/promise';
//import mariadb from 'mariadb';

const url = 'wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.actor.profile';
let ws;

const pool = mysql.createPool({
  host: '127.0.0.1', // Replace with your MySQL host
  //user: 'bskydb', // Replace with your MySQL username
  //password: 'BzDV6bndy9DLCSGE', // Replace with your MySQL password
  user: 'root', // Replace with your MySQL username
  password: 'F2ofi3z31', // Replace with your MySQL password
  database: 'bsky' // Replace with your MySQL database name

});

async function connectWebSocket() {
  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('Connected to BlueSky WebSocket');
  });

  ws.on('message', async (data) => {
    try {
      const json = JSON.parse(data);
      if (json.kind === 'identity' ) { // || json.kind === 'account'
            // Timestamp in milliseconds
            const timestampMs = json.identity.time;
            // Convert to Date
            const datetmp = new Date(timestampMs);
            // console.log(date.toISOString());
            const [rows] = await pool.execute('INSERT INTO events (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
            //console.log('NEW REGISTRATION of : ',json.identity.handle);
         
        if (json.identity.handle.endsWith(".bsky.social")) {
          console.log('bsky handle ');
        }
        else {
          if (json.identity.handle.endsWith(".com")) {
           const [rows] = await pool.execute('INSERT INTO com (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
           console.log('.com detected');
          }
          if (json.identity.handle.endsWith(".gov.us") || json.identity.handle.endsWith(".gov") || json.identity.handle.endsWith(".gov.uk") || json.identity.handle.endsWith(".gouv.fr") || json.identity.handle.endsWith(".gov.au") || json.identity.handle.endsWith(".gov.br") || json.identity.handle.endsWith(".gov.cn") || json.identity.handle.endsWith(".gc.ca") || json.identity.handle.endsWith(".gov.it") || json.identity.handle.endsWith(".go.jp") || json.identity.handle.endsWith(".go.kr") || json.identity.handle.endsWith(".gov.ru"))
          // .gov.au .gov.br .gov.cn .gc.ca .gov.it .gov.in .go.kr .gov.mx .gov.ru .gov.sg .go.jp
          {
           const [rows] = await pool.execute('INSERT INTO gov (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
           console.log('gov detected');
          }
          if (json.identity.handle.endsWith(".eu") || json.identity.handle.endsWith(".fr") || json.identity.handle.endsWith(".it") || json.identity.handle.endsWith(".es") || json.identity.handle.endsWith(".de") || json.identity.handle.endsWith(".nl") || json.identity.handle.endsWith(".co.uk") || json.identity.handle.endsWith(".be") || json.identity.handle.endsWith(".at") || json.identity.handle.endsWith(".ch") || json.identity.handle.endsWith(".bzh") || json.identity.handle.endsWith(".ie"))
          // .eu .fr .it .es .de .nl .bzh .co.uk .ir .be .at .ch 
          {
           const [rows] = await pool.execute('INSERT INTO eur (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
           console.log('eur detected');
          }
          if (json.identity.handle.endsWith(".edu") || json.identity.handle.endsWith(".uni") )
          // .edu .education .school .uni
          {
           const [rows] = await pool.execute('INSERT INTO edu (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
           console.log('edu detected');
          }
          if (json.identity.handle.endsWith(".org"))
          // .org
          {
           const [rows] = await pool.execute('INSERT INTO org (kind, did, handle, time_us) VALUES (?, ?, ?, ?)', [json.kind, json.did, json.identity.handle, datetmp]);
           console.log('org detected');
          }
        }
      }
    } catch (error) {
      console.error('Error parsing message or inserting into database:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed. Reconnecting...');
    setTimeout(connectWebSocket, 5000); // Attempt to reconnect after 5 seconds
  });
}

// Start WebSocket connection
connectWebSocket();