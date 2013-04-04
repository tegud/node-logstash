(function() {

var util = require('util'),
	events = require("events"),
	sql_runner = require('./sql_runner'),
	stacktrace_parser = require('./stacktrace_parser');

function MonitorMSSQL(server, user, password, db, interval) {
	this.server = server;
	this.user = user;
	this.password = password;
	this.db = db;
	this.interval = interval;

	this.ids = [];

	events.EventEmitter.call(this);
}

util.inherits(MonitorMSSQL, events.EventEmitter);

function formatResults( row ) {
	var data = {};
	
	for (var column in row) {
		switch(column.toLowerCase()) {
			case 'timestamp':
				data.timestamp = new Date(row.timestamp).toISOString();
			break;

			case 'url':
				var matches = /server=([^&|^$]+).*$/ig.exec(row.url);

				if (matches && matches.length > 0) {
					data.source = matches[1] || matches[0] || '';
				}
				
				data[column] = row[column];
			break;

			default:
				data[column] = row[column];
			break;
		}
	}
	
	return data;
}

MonitorMSSQL.prototype.query = function(q, callback) {
	var task = function() {
		console.log('task');

		if (this.runners) {
			return;
		}

		this.runners = {};
		this.results = [];
		this.totalqueries = 0;
		this.returnedqueries = 0;

		this.runners[q] = sql_runner.create(this.server, this.user, this.password, this.db);

		this.runners[q].on('error', function(err) {
			this.emit('error', err);
		}.bind(this));

		this.runners[q].query(q, this.interval, function(err, data) {
			this.returnedqueries++;

			console.log('query', q);

			if (err) {
				this.emit('error', err);
			} else {
				if (data && data.length > 0){
					data.forEach(function(item) {
						if (this.ids.indexOf(item.id) < 0) {
							this.ids.push(item.id);

							var formatted = formatResults(item);

							this.results.push( formatted );

							this.emit('message', formatted);
						}
					}.bind(this));
				}
			}

			if (this.returnedqueries === this.totalqueries) {
				this.emit('end', this.results);

				if (callback) {
					callback(this.results);
				}

				this.reset();
			}
		}.bind(this));

		this.totalqueries++;
	}.bind(this);

	this.task = setInterval(task, this.interval);

	this.emit('start', this.server);

	task();

	return this;
};

MonitorMSSQL.prototype.stop = function(callback) {
	clearInterval(this.task);

	return this.reset(callback);

	delete this.task;
};

MonitorMSSQL.prototype.reset = function(callback) {
	delete this.results;
	delete this.runners;
	delete this.totalqueries;
	delete this.returnedqueries;

	if (callback) {
		callback();
	}

	return this;
};

MonitorMSSQL.create = function(server, user, password, db, interval) {
	return new MonitorMSSQL(server, user, password, db, interval);
};

module.exports.MonitorMSSQL = MonitorMSSQL;
module.exports.create = MonitorMSSQL.create;

})();