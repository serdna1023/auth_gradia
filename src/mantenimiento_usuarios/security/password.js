const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;
const hash = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
const compare = (plain, hashed) => bcrypt.compare(plain, hashed);
module.exports = { hash, compare };
