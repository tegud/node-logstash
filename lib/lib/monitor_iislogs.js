(function() {

var util = require('util'),
	events = require("events"),
	monitor_directory = require('./monitor_directory'),
	iislog_parser = require('./iislog_parser');

function IISLogScavenger(path, pattern) {
	this.path = path;
	this.pattern = pattern;

	events.EventEmitter.call(this);
}

util.inherits(IISLogScavenger, events.EventEmitter);

IISLogScavenger.prototype.start = function() {
	var scavenger = this;

	var monitor = monitor_directory.monitor(scavenger.path, scavenger.pattern, function(path) {
		return iislog_parser.parse(path, function(line, fields) {
			var values = line.trim().split(' ');

			if (values.length !== fields.length) {
				scavenger.emit( 'error', 'Number of Values does not match Number of Fields' );

				return;
			}

			var data = {}, len = fields.length, i = 0;
			for (; i < len; i++) {
				var v = values[i];

				if (v.match(/^[0-9]+$/)) {
					v = parseInt(v);
				}
				else if (v.match(/^[0-9]+[\.,][0-9]+$/)) {
					v = parseFloat(v.replace(',', '.'));
				}

				data[fields[i]] = v;
			}

			scavenger.emit( 'data', data, line.trim() );
		});
	}, 500);

	monitor.on('start', function(file) {
		scavenger.emit('start', file);
	});

	monitor.on('stop', function(file) {
		scavenger.emit('stop', file);
	});

	scavenger.monitor = monitor;

	return this;
};

IISLogScavenger.prototype.stop = function(callback) {
	this.monitor.close(callback);

	return this;
};

IISLogScavenger.monitor = function(path, pattern) {
	return new IISLogScavenger(path, pattern);
};

module.exports.IISLogScavenger = IISLogScavenger;
module.exports.monitor = IISLogScavenger.monitor;

})();