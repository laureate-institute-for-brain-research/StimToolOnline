// MTurk Unit Test

const test = require('tape')
const mturk = require('./mkturk-1.js')

test('testing the send email', function(t){
    const result = mturk.sendEmails('JT1', '1','wave1');
    t.ok(result)
    t.deepEqual(result,undefined);
    t.end();
});

