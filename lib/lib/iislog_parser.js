(function() {

var linestream = require('linestream'),
	Tail = require('tail').Tail;

function LogParser(path, callback) {
	var parser = this, fields = [];

	var stream = linestream.create(path, {
		filter: function(line) {
			return line.indexOf('#Fields:') === 0;
		}
	});

	stream.on('data', function(line, isEnd) {
		fields = line.replace('#Fields:', '').trim().split(' ');
	});

	return new Tail(path).on('line', function(line) {
		if (line.indexOf('#') == 0) {
			if (line.indexOf('#Fields:') === 0) {
				fields = line.replace('#Fields:', '').trim().split(' ');
			}

			return;
		}

		callback(line, fields);
	});
}

LogParser.prototype.process = function(values) {
	return {};
}

LogParser.parse = function(path, callback) {
	return new LogParser(path, callback);
};

module.exports.LogParser = LogParser;
module.exports.parse = LogParser.parse;

})();