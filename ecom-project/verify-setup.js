#!/usr/bin/env node

/**
 * E-COM MongoDB Setup Verification Script
 * Automatically checks if everything is set up correctly
 */

const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════════════╗');
console.log('║   E-Com MongoDB Setup Verification              ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('\n');

let allGood = true;

// Check Node.js version
console.log('✓ Checking Node.js version...');
const nodeVersion = process.version;
console.log(`  Node: ${nodeVersion}\n`);

// Check required files
const requiredFiles = [
  'server.js',
  'package.json',
  '.env.example',
  'api-endpoints.js',
  'index.html',
  'style.css'
];

console.log('✓ Checking required files:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});
console.log('');

// Check .env file
console.log('✓ Checking configuration:');
const envExists = fs.existsSync(path.join(__dirname, '.env'));
if (envExists) {
  console.log('  ✅ .env file exists');
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  if (envContent.includes('MONGODB_URI')) {
    console.log('  ✅ MONGODB_URI configured');
  } else {
    console.log('  ⚠️  MONGODB_URI not found in .env');
    allGood = false;
  }
} else {
  console.log('  ❌ .env file not found');
  console.log('     Run: cp .env.example .env');
  allGood = false;
}
console.log('');

// Check package.json
console.log('✓ Checking package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = ['express', 'mongoose', 'cors'];
  requiredDeps.forEach(dep => {
    const has = pkg.dependencies && pkg.dependencies[dep];
    console.log(`  ${has ? '✅' : '❌'} ${dep}`);
    if (!has) allGood = false;
  });
} catch (e) {
  console.log('  ❌ Error reading package.json');
  allGood = false;
}
console.log('');

// Summary
console.log('╔════════════════════════════════════════════════╗');
if (allGood) {
  console.log('║  ✅ Setup looks good!                          ║');
  console.log('║  Ready to run: npm install && npm start        ║');
} else {
  console.log('║  ⚠️  Some issues found. See above.             ║');
  console.log('║  Fix issues, then run: npm install && npm start ║');
}
console.log('╚════════════════════════════════════════════════╝');
console.log('\n');

process.exit(allGood ? 0 : 1);
