var base_input = require('../lib/base_input'),
    util = require('util'),
    rabbitmq = require('rabbit.js'),
    logger = require('log4node');

function InputRabbitMQ() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'Rabbitmq',
    host_field: 'target',
	required_params: ['socket']
  }
}

util.inherits(InputRabbitMQ, base_input.BaseInput);

InputRabbitMQ.prototype.afterLoadConfig = function(callback) {
	logger.info('Start listening on rabbitmq', this.target + ', socket: ' + this.socket);

	var context = rabbitmq.createContext('amqp://' + this.target);

	context.on('ready', function() {
		this.mq = context.socket('SUB');

		this.mq.setEncoding('utf8');

		this.mq.on('error', function(err) {
			this.emit('error', err);
		}.bind(this));

		this.mq.on('data', function(data) {
			try {
				var parsed = JSON.parse(data);

				this.emit('data', parsed);
			}
			catch(e) {
				this.emit('error', 'Unable to parse data ' + data);
			}
		}.bind(this));

		this.mq.connect(this.socket);

		this.emit('init_ok');

		logger.info('Rabbitmq ready on ' + this.target + ', socket: ' + this.socket);

		callback();
	}.bind(this));

	context.on('error', function(err) {
		this.emit('init_error', err);
	}.bind(this));
}

InputRabbitMQ.prototype.close = function(callback) {
  logger.info('Closing input rabbitmq', this.target);

  this.mq.destroy();

  callback();
}

exports.create = function() {
  return new InputRabbitMQ();
}
