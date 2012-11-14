(function() {

var util = require('util'),
	events = require("events");

function WmiScavenger(server, root) {
	this.server = server;
	this.root = root;

	events.EventEmitter.call(this);
}

util.inherits(WmiScavenger, events.EventEmitter);

WmiScavenger.prototype.start = function() {
	var scavenger = this;

	var monitor = monitor_directory.monitor(scavenger.server, scavenger.root, function(path) {
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

			scavenger.emit( 'data', data );
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

WmiScavenger.prototype.stop = function(callback) {
	this.monitor.close(callback);

	return this;
};

WmiScavenger.monitor = function(path, pattern) {
	return new WmiScavenger(path, pattern);
};

module.exports.WmiScavenger = WmiScavenger;
module.exports.monitor = WmiScavenger.monitor;

})();