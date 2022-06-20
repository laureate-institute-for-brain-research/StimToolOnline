// Task Runner to change .js in public to minified version
var gulp = require('gulp')
// var watch = require('gulp-watch')
const { watch } = require('gulp');
var rename = require("gulp-rename");
const terser = require('gulp-terser');

async function compress() {
    var a = new Date()
    console.log('comressing! ' + a.toString() )
    return gulp.src(['lib/*.js', 'lib/*.mjs'])
        .pipe(terser())
        .pipe(rename(function (path) {
            // Updates the object in-place
            // path.dirname += "/ciao";
            path.basename += '-min';
            // path.extname = ".md";
          }))
        .pipe(gulp.dest('public/js/tasks/'))
       
}

function watching () {
    return watch('lib/tasks/*/*.js', compress)
}

function defaultTask (cb) {
    // place code for your default task here
    watching()
}

exports.default = defaultTask
