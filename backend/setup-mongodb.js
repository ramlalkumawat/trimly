const fs = require('fs');
const path = require('path');

// Helper script that prints Atlas setup steps and creates a starter .env template.
// MongoDB Atlas Setup Instructions
console.log('🚀 MongoDB Atlas Setup for Trimly Provider Dashboard\n');

console.log('📋 STEPS TO CONFIGURE MONGODB ATLAS:\n');

console.log('1. Create MongoDB Atlas Account:');
console.log('   - Go to: https://www.mongodb.com/atlas');
console.log('   - Sign up for free account\n');

console.log('2. Create a New Cluster:');
console.log('   - Click "Build a Database"');
console.log('   - Choose "FREE" plan (M0 Sandbox)');
console.log('   - Select a cloud provider and region\n');

console.log('3. Get Connection String:');
console.log('   - Click "Connect" on your cluster');
console.log('   - Select "Drivers"');
console.log('   - Copy the connection string\n');

console.log('4. Update .env file:');
console.log('   - Create backend/.env file');
console.log('   - Add your connection string like:');
console.log('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/trimly\n');

console.log('5. Create Database User:');
console.log('   - In Atlas: Database Access → Add New User');
console.log('   - Username: trimlyuser');
console.log('   - Password: Generate strong password\n');

console.log('6. Whititelist IP Address:');
console.log('   - Network Access → Add IP Address');
console.log('   - Select "Allow Access from Anywhere" (0.0.0.0/0)\n');

// Create .env template if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# MongoDB Configuration
MONGO_URI=your-mongodb-atlas-connection-string-here

# JWT Configuration  
JWT_SECRET=trimly-super-secret-jwt-key-for-development

# Server Configuration
PORT=5000

# Environment
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file template');
  console.log('📝 Please update MONGO_URI with your actual MongoDB Atlas connection string');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Complete MongoDB Atlas setup');
console.log('2. Update .env file with your connection string');
console.log('3. Run: npm start');
console.log('4. Run: node create_sample_data.js (to populate initial data)');

console.log('\n📚 For help, visit: https://docs.mongodb.com/manual/reference/connection-string/');
