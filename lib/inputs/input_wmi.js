var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_wmi = require('../lib/monitor_wmi');

function InputWmi() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'WMI',
    host_field: 'server',
	optional_params: ['type', 'root'],
	required_params: ['class', 'metrics'],
    default_values: {
      'root': 'root/cimv2'
    }
  }
}

util.inherits(InputWmi, base_input.BaseInput);

InputWmi.prototype.afterLoadConfig = function(callback) {
	logger.info('Start monitor of WMI class ', this.class);

	this.monitor = monitor_wmi.create(this.server, this.root, 500);

	this.monitor.on('error', function( err ) {
		this.emit('error', err);
	}.bind(this));

	var q = 'SELECT ' + this.metrics + ' FROM ' + this.class;

	this.monitor.query( q, function( data ) {
		this.emit('data', {
			'@message': JSON.stringify(data),
			'@source': this.server,
			'@type': this.type,
			'@fields': data
		});
	}.bind(this));

	callback();
}

InputWmi.prototype.close = function(callback) {
  logger.info('Stopping monitot of WMI class ', this.class);
  this.monitor.close(callback);
}

exports.create = function() {
  return new InputWmi();
}