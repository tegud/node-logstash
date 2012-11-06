var base_input = require('../lib/base_input'),
    util = require('util'),
    rabbit = require('rabbit.js'),
    logger = require('log4node');

function InputRabbitMQ() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'Tcp',
    host_field: 'target',
  }
}

util.inherits(InputRabbitMQ, base_input.BaseInput);

InputRabbitMQ.prototype.afterLoadConfig = function(callback) {
	logger.info('Start listening on rabbitmq', this.target);

	var context = rabbit.createContext('amqp://' + this.target);

	this.socket = context.socket('SUB');
	this.socket.setEncoding('utf8');

	logger.info('Rabbitmq ready on ' + this.target);
	this.emit('init_ok');

	this.socket.on('data', function(data) {
		try {
			var parsed = JSON.parse(data);
			this.emit('data', parsed);
		}
		catch(e) {
			this.emit('error', 'Unable to parse data ' + data);
		}
	}.bind(this));

	this.socket.connect('logstash');
}

InputRabbitMQ.prototype.close = function(callback) {
  logger.info('Closing input rabbitmq', this.target);

  this.socket.destroy();

  callback();
}

exports.create = function() {
  return new InputRabbitMQ();
}
