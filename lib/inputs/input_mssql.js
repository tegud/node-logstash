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
	var that = this;
	
	logger.info('Start monitor of MS SQL DB ', this.server);

	this.monitor = monitor_mssql.create(this.server, this.user, this.password, this.db, this.interval);

	this.monitor.on('error', function( err ) {
		this.emit('error', err);
	}.bind(this));

	this.monitor.on('message', function( data ) {
		that.emit('data', {
			'@message': (data.isBookingError ? 'Booking ' : '') + 'Error occurred on ' + data.url,
			'@timestamp': data.timestamp,
			'@source': data.source || that.server,
			'@type': that.type,
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