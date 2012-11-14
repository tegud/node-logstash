var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_wmi = require('../lib/monitor_wmi');

function InputWmi() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'WMI',
    host_field: 'server'
  }
}

util.inherits(InputWmi, base_input.BaseInput);

InputWmi.prototype.afterLoadConfig = function(callback) {
  logger.info('Start input on log folder', this.directory);

  this.monitor = monitor_wmi.monitor(this.server);

  this.monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.monitor.on('init_error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.monitor.on('data', function(data) {
	this.emit('data', {
		'@message': JSON.stringify(data),
		'@source': this.server,
		'@type': this.type,
		'@fields': data
	});
  }.bind(this));

  this.monitor.start();

  callback();
}

InputWmi.prototype.close = function(callback) {
  logger.info('Closing listening log folder', this.directory);
  this.monitor.close(callback);
}

exports.create = function() {
  return new InputWmi();
}