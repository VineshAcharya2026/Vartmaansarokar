const bcrypt = require('bcryptjs');
const pw = 'PassworD@2026';
console.log(bcrypt.hashSync(pw, 10));
console.log(bcrypt.hashSync(pw, 10));
console.log(bcrypt.hashSync(pw, 10));
