var fs = require('fs');
var gulp = require('gulp');
var numberman = require('../tools/numberman.js');

// Generate the Worm data
gulp.task('generate-data', function() {
  var data = numberman('data/worm.json', 'data/patterns.txt');
  fs.writeFileSync('app/data.json', data);
});
