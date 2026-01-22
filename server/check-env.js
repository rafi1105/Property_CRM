// Quick environment check script
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables Check ===\n');

const required = [
  'JWT_SECRET',
  'MONGODB_URI',
  'FIREBASE_SERVICE_ACCOUNT_BASE64',
  'CLIENT_URL',
  'NODE_ENV'
];

let allPresent = true;

required.forEach(key => {
  const exists = !!process.env[key];
  const status = exists ? '✅' : '❌';
  const value = exists ? (key.includes('SECRET') || key.includes('BASE64') ? '[HIDDEN]' : process.env[key]) : 'MISSING';
  console.log(`${status} ${key}: ${value}`);
  if (!exists) allPresent = false;
});

console.log('\n=== Summary ===');
if (allPresent) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('\n⚠️  Add missing variables to Vercel:');
  console.log('   1. Go to https://vercel.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Add each missing variable');
  console.log('   5. Redeploy');
}
