var base_output = require('../lib/base_output'),
    util = require('util'),
    rabbitmq = require('rabbit.js'),
    logger = require('log4node');

function OutputRabbitMQ() {
  base_output.BaseOutput.call(this);
  this.config = {
    name: 'Rabbitmq',
    host_field: 'target',
	required_params: ['socket']
  }
}

util.inherits(OutputRabbitMQ, base_output.BaseOutput);

OutputRabbitMQ.prototype.afterLoadConfig = function(callback) {
	logger.info('Start output to rabbitmq', this.target + ', socket: ' + this.socket);

	var context = rabbitmq.createContext('amqp://' + this.target);

	context.on('ready', function() {
		this.mq = context.socket('PUB');

		this.mq.connect(this.socket);

		callback();
	}.bind(this));

	context.on('error', function(err) {
		this.emit('init_error', err);
	}.bind(this));
}

OutputRabbitMQ.prototype.process = function(data) {
  this.mq.write(JSON.stringify(data), 'utf8');
}

OutputRabbitMQ.prototype.close = function(callback) {
  logger.info('Closing output to rabbitmq', this.target);

  this.mq.destroy();

  callback();
}

exports.create = function() {
  return new OutputRabbitMQ();
}
