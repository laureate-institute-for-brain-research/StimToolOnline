// Unit Test for Wave2.js

const test = require('tape')
const wave2 = require('.././wave2')

test('Testing the processForm',function(t) {
    var result = wave2.processForm('sdf','sdf');
    var expected = {}

    t.ok(result)
    t.deepEqual(result,expected)

    t.end();
});

