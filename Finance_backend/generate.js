const crypto = require('crypto');

// Generate a 64-byte hex secret key
const secretKey = crypto.randomBytes(64).toString('hex');
console.log(secretKey);