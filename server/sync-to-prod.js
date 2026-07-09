/**
 * Sync local MongoDB → Atlas MongoDB
 * Reads live data from local MongoDB (localhost:27018) and upserts to Atlas.
 * Usage: node sync-to-prod.js
 *
 * Requires both URIs to be set in server/.env:
 *   MONGODB_URI_LOCAL=mongodb://localhost:27018/workflowlive
 *   MONGODB_URI=mongodb+srv://flowlive:...@cluster0.../workflowlive
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const LOCAL_URI  = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27018/workflowlive';
const REMOTE_URI = process.env.MONGODB_URI_PROD  || process.env.MONGODB_URI;

if (!REMOTE_URI || REMOTE_URI === LOCAL_URI) {
  console.error('Set MONGODB_URI_PROD (or MONGODB_URI) to the Atlas connection string in server/.env');
  process.exit(1);
}

async function syncCollection(localConn, remoteConn, name) {
  const docs = await localConn.collection(name).find({}).toArray();
  if (docs.length === 0) { console.log(`  ⏭  ${name}: empty, skipped`); return 0; }

  const remoteCol = remoteConn.collection(name);
  let upserted = 0;
  for (const doc of docs) {
    await remoteCol.replaceOne({ _id: doc._id }, doc, { upsert: true });
    upserted++;
  }
  console.log(`  ✓ ${name}: ${upserted} document(s) synced`);
  return upserted;
}

async function run() {
  console.log('Connecting to local MongoDB…');
  const localConn  = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connecting to Atlas…');
  const remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
  console.log('Both connected.\n');

  const collections = ['users', 'departments', 'projects', 'notifications', 'invitations', 'leaves'];
  for (const col of collections) {
    await syncCollection(localConn.db, remoteConn.db, col);
  }

  console.log('\nSync complete.');
  await localConn.close();
  await remoteConn.close();
}

run().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
