/**
 * Ensure correct indexes on userbudgets collection
 * This prevents the duplicate key error when creating budgets for different months
 */

const mongoose = require('mongoose');

async function ensureBudgetIndexes() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('⚠️  Database not connected, skipping index check');
      return;
    }

    const collection = db.collection('userbudgets');
    
    // Get all indexes
    const indexes = await collection.indexes();
    
    // Check for problematic unique index on userId alone
    const problematicIndex = indexes.find(
      idx => idx.key.userId && !idx.key.currentMonth && idx.unique
    );
    
    if (problematicIndex) {
      console.log(`⚠️  Found problematic unique index: ${problematicIndex.name}`);
      try {
        await collection.dropIndex(problematicIndex.name);
        console.log(`✅ Dropped problematic index: ${problematicIndex.name}`);
      } catch (err) {
        console.error(`❌ Failed to drop index ${problematicIndex.name}:`, err.message);
      }
    }
    
    // Ensure compound unique index exists
    const compoundIndex = indexes.find(
      idx => idx.key.userId && idx.key.currentMonth && idx.unique
    );
    
    if (!compoundIndex) {
      try {
        await collection.createIndex(
          { userId: 1, currentMonth: 1 },
          { unique: true, name: 'userId_1_currentMonth_1' }
        );
        console.log('✅ Created compound unique index');
      } catch (err) {
        console.error('❌ Failed to create compound index:', err.message);
      }
    }
    
    // Ensure query index exists
    const queryIndex = indexes.find(
      idx => idx.key.userId && idx.key.currentMonth === -1 && !idx.unique
    );
    
    if (!queryIndex) {
      try {
        await collection.createIndex(
          { userId: 1, currentMonth: -1 },
          { name: 'userId_1_currentMonth_-1' }
        );
        console.log('✅ Created query index');
      } catch (err) {
        console.error('❌ Failed to create query index:', err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error ensuring budget indexes:', err.message);
  }
}

module.exports = ensureBudgetIndexes;


