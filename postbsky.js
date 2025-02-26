// Import required packages
const axios = require('axios');
const mysql = require('mysql2/promise'); // For SQL queries
const fs = require('fs');
const dote = require('dotenv').config({ path: '/var/www/myapp/config.env' }); // To use environment variables
const path = require('path');
const logFile = path.join(__dirname, 'bskypost_cronlog.txt');

// Log messages to a file
function logMessage(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf8');
}

try {
  logMessage('Script started.');
} catch (error) {
  logMessage(`Error: ${error.message}`);
}

// Database connection
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Authenticate with Bluesky and get a session token
async function authenticate(username, password) {
  try {
    const response = await axios.post('https://bsky.social/xrpc/com.atproto.server.createSession', {
      identifier: username, // Use your Bluesky handle (e.g., bskycheck.com)
      password: password,
    });

    console.log('Authenticated successfully');
    logMessage('Authenticated successfully');

    return response.data.accessJwt; // Return the session token
  } catch (error) {
    console.error('Error during authentication:', error.response?.data || error.message);
    logMessage('Error during authentication:', error.response?.data || error.message);
    throw error;
  }
}

// Fetch handles from SQL tables
async function fetchHandles() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [govHandles] = await connection.execute('SELECT handle FROM gov ORDER BY ID DESC LIMIT 10');
    const [comHandles] = await connection.execute('SELECT handle FROM com ORDER BY ID DESC LIMIT 10');
    const [eduHandles] = await connection.execute('SELECT handle FROM edu ORDER BY ID DESC LIMIT 10');
    const [orgHandles] = await connection.execute('SELECT handle FROM org ORDER BY ID DESC LIMIT 10');

    return {
      gov: govHandles.map(row => row.handle),
      com: comHandles.map(row => row.handle),
      edu: eduHandles.map(row => row.handle),
      org: orgHandles.map(row => row.handle),
    };
  } catch (error) {
    console.error('Error fetching handles:', error.message);
    logMessage('Error fetching handles:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Resolve handles to DIDs and filter out unresolved handles and handles longer than 32 characters
async function resolveHandles(sessionToken, handles) {
  const resolvedHandles = [];

  for (const handle of handles) {
    // Skip handles longer than 32 characters
    if (handle.length > 33) {
      console.warn(`Skipping handle longer than 32 characters: @${handle}`);
      logMessage(`Skipping handle longer than 32 characters: @${handle}`);
      continue;
    }

    try {
      const did = await resolveHandle(sessionToken, handle);
      resolvedHandles.push(`@${handle}`);
      if (resolvedHandles.length >= 3) break; // Stop after resolving 3 handles
    } catch (error) {
      console.warn(`Skipping unresolved handle: @${handle}`);
      logMessage(`Skipping unresolved handle: @${handle}`);
    }
  }

  return resolvedHandles;
}

// Resolve a handle to a DID
async function resolveHandle(sessionToken, handle) {
  try {
    const response = await axios.get(`https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
    return response.data.did;
  } catch (error) {
    throw new Error(`Handle @${handle} could not be resolved`);
  }
}

// Upload media to Bluesky
async function uploadMedia(sessionToken, filePath) {
  try {
    const fileData = fs.readFileSync(filePath);
    const mimeType = 'image/png'; // Adjust based on your file type (e.g., image/png)

    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', fileData, {
      headers: {
        'Content-Type': mimeType,
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    console.log(`Media uploaded successfully: ${filePath}`);
    logMessage(`Media uploaded successfully: ${filePath}`);
    return response.data.blob; // Return the blob reference
  } catch (error) {
    console.error(`Error uploading media (${filePath}):`, error.response?.data || error.message);
    logMessage(`Error uploading media (${filePath}):`, error.response?.data || error.message);
    throw error;
  }
}

// Post to the Bluesky feed
async function createPost(sessionToken, text, websiteUrl, thumbnailBlob) {
  try {
    // Resolve handles and hashtags to facets
    const facets = [];
    const handleRegex = /@([\w.-]+)/g;
    const hashtagRegex = /#(\w+)/g;

    let match;
    while ((match = handleRegex.exec(text))) {
      const handle = match[1];
      const did = await resolveHandle(sessionToken, handle);
      facets.push({
        index: { byteStart: match.index, byteEnd: match.index + handle.length + 1 }, // +1 for '@'
        features: [{ $type: 'app.bsky.richtext.facet#mention', did: did }],
      });
    }

    while ((match = hashtagRegex.exec(text))) {
      const hashtag = match[1];
      facets.push({
        index: { byteStart: match.index, byteEnd: match.index + hashtag.length + 1 }, // +1 for '#'
        features: [{ $type: 'app.bsky.richtext.facet#tag', tag: hashtag }],
      });
    }

    // Create the post with website preview
    const response = await axios.post(
      'https://bsky.social/xrpc/com.atproto.repo.createRecord',
      {
        collection: 'app.bsky.feed.post',
        repo: process.env.BLUESKY_DID, // Use your DID (not handle)
        record: {
          text: text,
          facets: facets.length > 0 ? facets : undefined,
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: websiteUrl,
              title: 'bskyheck - Verified handle tracker', // Title of the website
              description: 'Live tracking of Bluesky AT Protocol! Keep an eye on new user sign-ups and users who have just registered their domain handle. Tracking .com, .edu, .com, .org...', // Description of the website
              thumb: thumbnailBlob, // Use the uploaded thumbnail blob
            },
          },
          createdAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    console.log('Post created successfully:', response.data);
    logMessage('Post created successfully:', response.data);
  } catch (error) {
    console.error('Error creating post:', error.response?.data || error.message);
    logMessage('Error creating post:', error.response?.data || error.message);
  }
}

// Function to count characters in the post and iteratively remove the oldest handle until the post is less than 300 characters
function trimPostText(postText, tables) {
  while (postText.length > 300) {
    // Find the oldest handle across all tables
    let oldestHandle = null;
    let oldestTableIndex = -1;

    tables.forEach((table, tableIndex) => {
      if (table.handles.length > 0) {
        // The oldest handle is the first one in the array
        oldestHandle = table.handles[0];
        oldestTableIndex = tableIndex;
      }
    });

    if (oldestHandle) {
      // Remove the oldest handle from its table
      tables[oldestTableIndex].handles.shift();

      // Rebuild the post text
      postText = `New or updated #bluesky handles from gov, edu, com or org:\n\n`;
      tables.forEach(table => {
        postText += `${table.name}:\n${table.handles.join('\n')}\n`;
      });
    } else {
      // If no more handles can be removed, break the loop
      break;
    }
  }

  return postText;
}

// Main function
(async () => {
  // Load credentials from environment variables
  const username = process.env.BLUESKY_USERNAME; // Set BLUESKY_USERNAME in your .env file
  const password = process.env.BLUESKY_PASSWORD; // Set BLUESKY_PASSWORD in your .env file
  const yourDID = process.env.BLUESKY_DID; // Set BLUESKY_DID in your .env file

  if (!username || !password || !yourDID) {
    console.error('Please set BLUESKY_USERNAME, BLUESKY_PASSWORD, and BLUESKY_DID in your .env file');
    logMessage('Please set BLUESKY_USERNAME, BLUESKY_PASSWORD, and BLUESKY_DID in your .env file');
    return;
  }

  try {
    // Authenticate and get session token
    const sessionToken = await authenticate(username, password);

    // Fetch handles from SQL tables
    const handles = await fetchHandles();

    // Resolve handles and get the 3 most recent resolved handles (or fewer), excluding handles longer than 32 characters
    const resolvedGovHandles = await resolveHandles(sessionToken, handles.gov);
    const resolvedComHandles = await resolveHandles(sessionToken, handles.com);
    const resolvedEduHandles = await resolveHandles(sessionToken, handles.edu);
    const resolvedOrgHandles = await resolveHandles(sessionToken, handles.org);

    // Randomize the order of the tables
    const tables = [
      { name: 'Gov', handles: resolvedGovHandles },
      { name: 'Com', handles: resolvedComHandles },
      { name: 'Edu', handles: resolvedEduHandles },
      { name: 'Org', handles: resolvedOrgHandles },
    ];
    tables.sort(() => Math.random() - 0.5);

    // Format the post text
    let postText = `New or updated #bluesky handles from gov, edu, com or org:\n\n`;
    tables.forEach(table => {
      postText += `${table.name}:\n${table.handles.join('\n')}\n`;
    });

    // Trim the post text if it exceeds 300 characters (removing the oldest handle)
    postText = trimPostText(postText, tables);

    // Upload the thumbnail image
    const thumbnailBlob = await uploadMedia(sessionToken, '/var/www/html/thumbnail.png'); // Replace with the actual path to your thumbnail

    // Create a post with text and website preview
    await createPost(sessionToken, postText, 'http://www.bskycheck.com', thumbnailBlob);

    console.log('Post made successfully with resolved handles, hashtags, and website preview.');
    logMessage('Post made successfully with resolved handles, hashtags, and website preview.');
  } catch (error) {
    console.error('Failed to complete the script:', error.message);
    logMessage('Failed to complete the script:', error.message);
  }
})();