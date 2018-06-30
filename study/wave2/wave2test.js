// MTurk Wave2 Unit Test

const test = require('tape')
const wave2 = require('./wave2.js')

test('testing the send email', function(t){
    const result = wave2.sendEmails('JTCTTEST', '2',study='wave2');
    t.ok(result)
    t.deepEqual(result,undefined);
    t.end();
});

