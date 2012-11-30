(function() {

var util = require('util'),
	events = require("events"),
    Connection = require('tedious').Connection,
	Request = require('tedious').Request,
	TYPES = require('tedious').TYPES;

function SqlRunner(server, user, password, db) {
	this.server = server;
	this.user = user;
	this.password = password;
	this.db = db;

	events.EventEmitter.call(this);
}

util.inherits(SqlRunner, events.EventEmitter);

SqlRunner.prototype.query = function(q, timeout, callback) {
	var config = {
		userName: this.user,
		password: this.password,
		server: this.server,
		options: {
			database: this.db,
			connectTimeout: timeout,
			requestTimeout: timeout
		}
	};

	var conn = new Connection(config);

	conn.on('connect', function(err) {
		if (err) {
			this.emit('error', err);

			callback( err );

			return;
		}

		var rows = [];

		var req = new Request(q, function(err, rowCount) {
			if (err) {
				this.emit( 'error', err, rows );

				callback( err, rows );

				return;
			}

			callback( null, rows );
		}.bind(this));

		if (q.toLowerCase().indexOf('@since')) {
			var since = new Date();
			since.setMilliseconds(since.getMilliseconds() - timeout);

			req.addParameter('since', TYPES.DateTime, since);
		}

		req.on('row', function(columns) {
			var row = {};

			columns.forEach(function(column) {
				row[column.metadata.colName] = column.value;
			});

			rows.push(row);

			this.emit( 'message', null, row );
		}.bind(this));

		conn.execSql(req);
	}.bind(this));

	return this;
};

SqlRunner.create = function(server, user, password, db) {
	return new SqlRunner(server, user, password, db);
};

module.exports.SqlRunner = SqlRunner;
module.exports.create = SqlRunner.create;

})();