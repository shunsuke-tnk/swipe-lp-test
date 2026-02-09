const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node scripts/generate-password-hash.js <password>');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nPassword hash generated successfully!\n');
  console.log('Add this to your .env.local or Netlify environment variables:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
});
