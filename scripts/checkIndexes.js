const mongoose = require('mongoose');
require('dotenv').config();

const checkIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = ['users', 'deposits', 'withdrawals', 'transactions', 'kycs'];

    for (const collectionName of collections) {
      console.log(`\n📊 ${collectionName.toUpperCase()} Collection Indexes:`);
      
      const indexes = await db.collection(collectionName).indexes();
      indexes.forEach((index, i) => {
        console.log(`${i + 1}. ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
      });
      
      const stats = await db.collection(collectionName).stats();
      console.log(`   Documents: ${stats.count.toLocaleString()}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('\n✅ Index check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    process.exit(1);
  }
};

checkIndexes();