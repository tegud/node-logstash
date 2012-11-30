var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_mssql = require('../lib/monitor_mssql');

function InputMSSql() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'MSSQL',
    host_field: 'server',
	required_params: ['user', 'password', 'db', 'query'],
	optional_params: ['interval', 'type'],
    default_values: {
      'interval': 1000
    }
  }
}

util.inherits(InputMSSql, base_input.BaseInput);

InputMSSql.prototype.afterLoadConfig = function(callback) {
	logger.info('Start monitor of MS SQL DB ', this.server);

	this.monitor = monitor_mssql.create(this.server, this.user, this.password, this.db, this.interval);

	this.monitor.on('error', function( err ) {
		this.emit('error', err);
	}.bind(this));

	this.monitor.on('message', function( data ) {
		this.emit('data', {
			'@message': (data.type ? data.type + ': ' : '') + data.error,
			'@timestamp': data.timestamp,
			'@source': data.source || this.server,
			'@type': this.type,
			'@fields': data
		});
	});

	this.monitor.query( this.query );

	callback();
}

InputMSSql.prototype.close = function(callback) {
  logger.info('Stopping monitor of MS SQL DB ', this.server);

  this.monitor.stop(callback);
}

exports.create = function() {
  return new InputMSSql();
}