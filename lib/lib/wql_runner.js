(function() {

var util = require('util'),
	events = require("events"),
	wmi = require('wmi');

function WqlRunner(server, root) {
	this.server = server;
	this.root = root;

	events.EventEmitter.call(this);
}

util.inherits(WqlRunner, events.EventEmitter);

WqlRunner.prototype.query = function(q, callback) {
	wmi.connect(this.server, this.root, function(err, wmi) {
		if (err) {
			this.emit('error', err);

			callback(err);

			return;
		}

		wmi.query(q, function(err, results) {
			if (err) {
				this.emit('error', err);

				callback(err);

				return;
			}

			this.emit('message', results);

			callback(err, results);

			wmi.dispose();
		}.bind(this));
	}.bind(this));

	return this;
};

WqlRunner.create = function(server, root, interval) {
	return new WqlRunner(server, root, interval);
};

module.exports.WqlRunner = WqlRunner;
module.exports.create = WqlRunner.create;

})();