(function() {

function StackTraceLineParser(line, callback) {
	var line = line.trim();

	var data = {
		value: line,
		method: '',
		src: '',
		line: 0
	};

	if (line.indexOf(':line ') >= 0) {
		var temp = line.split(':line ');
		data.line = temp[1].trim();
		line = temp[0].trim();
	}

	if (line.indexOf(' in ') >= 0) {
		var temp = line.split(' in ');
		data.src = temp[1].trim();
		line = temp[0].trim();
	}

	if (line.indexOf('at ') == 0) {
		data.method = line.substr(2).trim();
	}

	callback(data);
}

StackTraceLineParser.parse = function(line, callback) {
	return new StackTraceLineParser(line, callback);
};

module.exports.StackTraceLineParser = StackTraceLineParser;
module.exports.parse = StackTraceLineParser.parse;

})();