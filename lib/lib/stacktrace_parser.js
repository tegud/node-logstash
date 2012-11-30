(function() {

var stacktraceline_parser = require('../lib/stacktraceline_parser.js');

function parseErrorText(exceptionText) {
	var data = {
		type: '',
		error: 'An Unknown Exception Occured',
		exception: '',
		breakdown: {}
	};

	var lines = exceptionText.split('\r\n'), firstline = '';

	if (lines.length > 0) {
		data.error = lines.shift().trim();
		firstline = lines[0].toLowerCase();
	}

	if (lines.length > 1) {
		if (lines[0].trim() === '') {
			lines.shift();

			firstline = lines[0].toLowerCase();
		}

		if (data.error.toLowerCase().indexOf('dynamic view compilation failed') >= 0) {
			data.type = 'DynamicViewCompilationFailure';

			var info = lines.shift().trim().split(':');
			if (info.length > 0) {
				data.error = (info[3] || '').trim();
			}
		}

		if (firstline.indexOf('exception:') >= 0) {
			var msg = firstline.split('exception:');

			data.type = msg.shift().trim() + 'Exception';
			data.error = msg.join('Exception:').trim();
		}

		data.exception = lines.join('\r\n').trim();

		data.breakdown = lines.map(function(line) {
			var ln = '';

			stacktraceline_parser.parse(line, function(linedata) { ln = linedata; });

			return ln;
		});
	}

	return data;
}

function StackTraceParser(stacktrace, callback) {
	var ex = parseErrorText(stacktrace);

	callback(ex);
}

StackTraceParser.parse = function(stacktrace, callback) {
	return new StackTraceParser(stacktrace, callback);
};

module.exports.StackTraceParser = StackTraceParser;
module.exports.parse = StackTraceParser.parse;

})();