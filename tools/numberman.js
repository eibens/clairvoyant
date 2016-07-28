var fs = require('fs');

module.exports = function(wormFile, patternFile) {
  return generate(wormFile, patternFile);
};

// Generates the JSON data used by Clairvoyant.
function generate(wormFile, patternFile) {
  var worm = readWorm(wormFile);
  var patterns = readPatterns(patternFile);

  var wordSeparator = /[\s\\"'.!?,;:\u201C\u201D]+/;
  var arcs = worm.arcs.map(function(arc) {
    // Combine the text of all chapters.
    arc.text = arc.chapters.reduce(function(result, chapter) {
      return result + " " + chapter.text;
    }, "");

    // Count total words.
    arc.words = arc.text.split(wordSeparator).filter(function(x) {
      return !!(x.trim());
    }).length;

    return arc;
  });

  // Calculate the number of matches per arc for each pattern.
  patterns = patterns.map(function(pattern) {
    pattern.matches = arcs.map(function(arc) {
      var regex = new RegExp(pattern.expression);
      var matches = arc.text.match(regex);
      return !matches ? 0 : matches.length;
    });
    pattern.count = pattern.matches.reduce(function(sum, x) {
      return sum + x;
    }, 0);
    return pattern;
  });

  // Build the result object.
  return JSON.stringify({
    sections: arcs.map(function(arc) {
      return {
        title: arc.title,
        words: arc.words
      }
    }),
    patterns: patterns.map(function(pattern) {
      return {
        name: pattern.name,
        expression: pattern.expression,
        matches: pattern.matches,
        count: pattern.count
      }
    })
  });
}

// Read the scraped Worm content.
function readWorm(file) {
  var text = fs.readFileSync(file, 'utf8');
  return JSON.parse(text);
}

// Read the patterns from a pattern file.
function readPatterns(file) {
  var text = fs.readFileSync(file, 'utf8');
  // http://stackoverflow.com/a/5035058/925580
  var lines = text.match(/[^\r\n]+/g);
  return lines.map(parsePattern);
}

// Parses a pattern.
//
// Patterns are regular expressions with an optional name. Name and expression
// are separated by an '=' character. If there is no '=' character, the
// expression itself is used as the pattern's name.
function parsePattern(line) {
  if (!line) throw new Error('Line must not be empty.');
  var pattern = {
    name: line,
    expression: line
  };
  var separator = '=';
  var splitIndex = line.indexOf(separator);
  if (splitIndex >= 0) {
    pattern.name = line.substring(0, splitIndex);
    pattern.expression = line.substring(splitIndex + 1);
  }
  return pattern;
}
