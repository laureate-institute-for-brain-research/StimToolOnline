// MTurk Unit Test

const test = require('tape')
const mturk = require('./mkturk-1.js')

test('testing the send email', function(t){
    const result = mturk.sendEmailRemind('JT1', hours_away=0,study='wave1');
    t.ok(result)
    t.deepEqual(result,undefined);
    t.end();
});

