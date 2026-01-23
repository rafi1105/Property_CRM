import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'property-crm-15bca-firebase.json');
const outputPath = join(__dirname, 'firebase-base64.txt');

try {
  // Check if file exists
  const serviceAccount = readFileSync(serviceAccountPath, 'utf8');
  
  // Encode to base64
  const base64 = Buffer.from(serviceAccount).toString('base64');
  
  // Write to file
  writeFileSync(outputPath, base64);
  
  console.log('✅ Firebase service account encoded successfully!');
  console.log('📁 Output saved to: firebase-base64.txt');
  console.log('\n📋 Base64 string:');
  console.log(base64);
  console.log('\n💡 Next steps:');
  console.log('1. Copy the base64 string above');
  console.log('2. Update FIREBASE_SERVICE_ACCOUNT_BASE64 in .env file');
  console.log('3. For Vercel: vercel env add FIREBASE_SERVICE_ACCOUNT_BASE64');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ Error: property-crm-15bca-firebase.json not found!');
    console.log('\n📝 Instructions:');
    console.log('1. Go to: https://console.firebase.google.com/project/property-crm-15bca/settings/serviceaccounts/adminsdk');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the downloaded file as: property-crm-15bca-firebase.json');
    console.log('4. Place it in the server directory');
    console.log('5. Run this script again: node encode-firebase-service-account.js');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
}
