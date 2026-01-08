const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixBudgetIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financeDB');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('userbudgets');
    
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
    });
    
    console.log('\n🔧 Fixing indexes...');
    
    // Drop the problematic unique index on userId alone
    try {
      await collection.dropIndex('userId_1');
      console.log('✅ Dropped problematic index: userId_1');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index userId_1 does not exist (already dropped)');
      } else {
        throw err;
      }
    }
    
    // Ensure compound unique index exists
    try {
      await collection.createIndex(
        { userId: 1, currentMonth: 1 },
        { unique: true, name: 'userId_1_currentMonth_1' }
      );
      console.log('✅ Created/verified compound unique index: userId_1_currentMonth_1');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Compound index already exists');
      } else {
        throw err;
      }
    }
    
    // Ensure query index exists (non-unique)
    try {
      await collection.createIndex(
        { userId: 1, currentMonth: -1 },
        { name: 'userId_1_currentMonth_-1' }
      );
      console.log('✅ Created/verified query index: userId_1_currentMonth_-1');
    } catch (err) {
      if (err.code === 85) {
        console.log('ℹ️  Query index already exists');
      } else {
        throw err;
      }
    }
    
    console.log('\n📋 Final indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique || false})`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Index fix completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing indexes:', err);
    process.exit(1);
  }
}

fixBudgetIndexes();


