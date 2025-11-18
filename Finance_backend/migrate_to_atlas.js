/**
 * Migration Script: Local MongoDB to MongoDB Atlas
 * 
 * This script migrates all data from local MongoDB (financeDB) to MongoDB Atlas
 * 
 * Usage: node migrate_to_atlas.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Local MongoDB connection
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/financeDB';
// Atlas MongoDB connection (from .env)
const ATLAS_MONGODB_URI = process.env.MONGODB_URI;

if (!ATLAS_MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

// Collections to migrate
const COLLECTIONS = [
  'users',
  'transactions',
  'categories',
  'savingsgoals',
  'reports',
  'userbudgets',
  'usersettings',
  'userinputs',
  'passwordresets'
];

async function migrateCollection(localDb, atlasDb, collectionName) {
  try {
    console.log(`\n📦 Migrating collection: ${collectionName}...`);
    
    // Get all documents from local database
    const documents = await localDb.collection(collectionName).find({}).toArray();
    
    if (documents.length === 0) {
      console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
      return { count: 0, skipped: true };
    }
    
    console.log(`   📊 Found ${documents.length} documents`);
    
    // Insert into Atlas (with error handling for duplicates)
    let inserted = 0;
    let skipped = 0;
    
    for (const doc of documents) {
      try {
        // Remove _id to let MongoDB generate new ones, or keep existing _id
        await atlasDb.collection(collectionName).insertOne(doc, { ordered: false });
        inserted++;
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - document already exists
          skipped++;
        } else {
          console.error(`   ❌ Error inserting document: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ Migrated ${inserted} documents, skipped ${skipped} duplicates`);
    return { count: inserted, skipped };
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}: ${error.message}`);
    return { count: 0, error: error.message };
  }
}

async function migrate() {
  let localConnection, atlasConnection;
  let localDb, atlasDb;
  
  try {
    console.log('🚀 Starting migration from Local MongoDB to MongoDB Atlas...\n');
    
    // Connect to local MongoDB
    console.log('📡 Connecting to local MongoDB...');
    localConnection = await mongoose.createConnection(LOCAL_MONGODB_URI).asPromise();
    localDb = localConnection.db;
    console.log('✅ Connected to local MongoDB');
    
    // Connect to Atlas MongoDB
    console.log('📡 Connecting to MongoDB Atlas...');
    atlasConnection = await mongoose.createConnection(ATLAS_MONGODB_URI).asPromise();
    atlasDb = atlasConnection.db;
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get collection counts before migration
    console.log('\n📊 Current Atlas database state:');
    for (const collectionName of COLLECTIONS) {
      try {
        const count = await atlasDb.collection(collectionName).countDocuments();
        console.log(`   ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`   ${collectionName}: 0 documents (new collection)`);
      }
    }
    
    // Migrate each collection
    const results = {};
    for (const collectionName of COLLECTIONS) {
      results[collectionName] = await migrateCollection(localDb, atlasDb, collectionName);
    }
    
    // Summary
    console.log('\n📈 Migration Summary:');
    console.log('='.repeat(50));
    let totalMigrated = 0;
    let totalSkipped = 0;
    
    for (const [collectionName, result] of Object.entries(results)) {
      if (result.skipped && result.count === 0) {
        console.log(`   ${collectionName}: ⚠️  Empty (skipped)`);
      } else {
        console.log(`   ${collectionName}: ✅ ${result.count} migrated, ${result.skipped || 0} skipped`);
        totalMigrated += result.count;
        totalSkipped += result.skipped || 0;
      }
    }
    
    console.log('='.repeat(50));
    console.log(`\n✅ Migration completed!`);
    console.log(`   Total documents migrated: ${totalMigrated}`);
    console.log(`   Total duplicates skipped: ${totalSkipped}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (localConnection) {
      await localConnection.close();
      console.log('\n🔌 Closed local MongoDB connection');
    }
    if (atlasConnection) {
      await atlasConnection.close();
      console.log('🔌 Closed Atlas MongoDB connection');
    }
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

