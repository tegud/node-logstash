(function() {

var util = require('util'),
	events = require("events"),
	wql_runner = require('./wql_runner.js');

function WmiScavenger(server, root, interval, mapNsTo) {
	this.server = server;
	this.root = root;
	this.interval = interval;
	this.mapNsTo = mapNsTo;

	events.EventEmitter.call(this);
}

util.inherits(WmiScavenger, events.EventEmitter);

function processStats(obj, namespace, i, stats, mapNsTo) {
	for (var stat in stats) {
		var metric = stats[stat],
			index = i;

		var ns = namespace || '';

		if (stats.Name && stats.Name.toLowerCase().indexOf('total') >= 0) {
			index = '_Total'
		}

		if (index || index === 0) {
			ns = ns + '.' + index;
		}

		obj[(mapNsTo || ns) + '_' + stat] = metric;
	}
}

function formatResults( data, mapNsTo ) {
	var formatted = {};

	for (var name in data) {
		var stats = data[name],
			len = stats.length,
			i = 0;

		if (len > 1) {
			for (; i < len; i++) {
				processStats(formatted, name, i, stats[i], mapNsTo);
			}

			continue;
		}

		processStats(formatted, name, null, stats[0], mapNsTo);
	}

	return formatted;
}

WmiScavenger.prototype.query = function(q, callback) {
	var task = function() {
		if (this.runners) {
			return;
		}

		this.runners = {};
		this.results = {};
		this.totalqueries = 0;
		this.returnedqueries = 0;

		this.runners[q] = wql_runner.create(this.server, this.root);

		this.runners[q].query(q, function(err, data) {
			if (err) {
				this.emit('error', err);

				return;
			}

			var fromIndex = q.toLowerCase().indexOf(' from ') + 6;

			this.results[q.substring(fromIndex, q.length)] = data;

			this.returnedqueries++;

			if (this.returnedqueries === this.totalqueries) {
				this.emit('end', this.results);

				var formatted = formatResults(this.results, this.mapNsTo);

				callback(formatted);

				this.reset();
			}
		}.bind(this));

		this.totalqueries++;
	}.bind(this);

	this.task = setInterval(task, this.interval);

	task();

	return this;
};

WmiScavenger.prototype.stop = function(callback) {
	clearInterval(this.task);

	return this.reset(callback);

	delete this.task;
};

WmiScavenger.prototype.reset = function(callback) {
	delete this.results;
	delete this.runners;
	delete this.totalqueries;
	delete this.returnedqueries;

	if (callback) {
		callback();
	}

	return this;
};

WmiScavenger.create = function(server, root, interval, mapNsTo) {
	return new WmiScavenger(server, root, interval, mapNsTo);
};

module.exports.WmiScavenger = WmiScavenger;
module.exports.create = WmiScavenger.create;

})();