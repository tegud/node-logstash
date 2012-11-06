var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
	wmi = require('wmi');

function InputWmi() {
	base_input.BaseInput.call(this);

	this.config = {
		name: 'Wmi',
		host_field: 'host',
		required_params: ['query', 'timeout'],
		optional_params: ['type', 'interval']
	}
}

util.inherits(InputWmi, base_input.BaseInput);

InputWmi.prototype.afterLoadConfig = function(callback) {
	var input = this;

	logger.info('Begining WMI Query [' + input.query + '] for ' + input.host);

	input.ready = true;

	input.heartbeat = setInterval(function() {
		if (input.ready) {
			input.wmi = wmi.connect(input.host, 'root/cimv2', function(err, wmi) {
				wmi.query(input.query, function(err, data) {
					if (err) {
						input.emit('init_error', err);
					}

					data['@message'] = input.query;
					data['@source'] = 'wmi_' + input.host;
					data['@type'] = 'wmi_' + input.type;

					input.emit('data', data);
				});
			});

			setTimeout(function() {
				if (input.wmi) {
					input.wmi.dispose();

					delete input.wmi;

					input.emit('init_error', 'Timeout of WMI Query [' + input.query + '] for ' + input.host);
				}
			}, input.timeout);
		}

		callback();
	}, input.interval || 1000);
}

InputWmi.prototype.close = function(callback) {
  logger.info('Closing WMI Query [' + this.query + '] for ' + this.host);

  if (this.wmi) {
	this.wmi.dispose();
  }

  callback();
}

exports.create = function() {
  return new InputWmi();
}