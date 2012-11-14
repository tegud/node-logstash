var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    monitor_iislogs = require('../lib/monitor_iislogs');

function InputIISLog() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'IISLog',
    host_field: 'directory',
	required_params: ['pattern'],
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming'],
  }
}

util.inherits(InputIISLog, base_input.BaseInput);

InputIISLog.prototype.afterLoadConfig = function(callback) {
  logger.info('Start input on log folder', this.directory);

  this.monitor = monitor_iislogs.monitor(this.directory, this.pattern, {
    buffer_size: this.buffer_size,
    buffer_encoding: this.buffer_encoding,
    wait_delay_after_renaming: this.wait_delay_after_renaming,
  });

  this.monitor.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));

  this.monitor.on('init_error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.monitor.on('data', function(data) {
	this.emit('data', {
		'@message': data['cs-uri-stem'] + (data['cs-uri-query'] != '-' ? '?' + data['cs-uri-query'] : ''),
		'@source': this.directory,
		'@type': this.type,
		'@fields': data,
		'@timestamp': data['date'] + 'T' + data['time'] + '.000Z'
	});
  }.bind(this));

  this.monitor.start();

  callback();
}

InputIISLog.prototype.close = function(callback) {
  logger.info('Closing listening log folder', this.directory);
  this.monitor.close(callback);
}

exports.create = function() {
  return new InputIISLog();
}