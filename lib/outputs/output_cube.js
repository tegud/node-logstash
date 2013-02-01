var base_output = require('../lib/base_output'),
    util = require('util'),
    dgram = require('dgram'),
    logger = require('log4node'),
    error_buffer = require('../lib/error_buffer');

function OutputCube() {
  base_output.BaseOutput.call(this);

  this.config = {
    name: 'Cube',
    host_field: 'host',
    port_field: 'port',
    optional_params: ['error_buffer_delay', 'type'],
    default_values: {
      'error_buffer_delay': 2000,
      'type': '#{@type}'
    }
  }
}

util.inherits(OutputCube, base_output.BaseOutput);

OutputCube.prototype.afterLoadConfig = function(callback) {
  logger.info('Start output to Cube Collector', this.host + ':' + this.port);

  this.socket = dgram.createSocket('udp4');

  this.error_buffer = error_buffer.create('output to Cube Collector ' + this.host + ':' + this.port, this.error_buffer_delay, this);

  callback();
}

OutputCube.prototype.process = function(data) {
  var d = extend({ source_host: data['@source_host'] }, data['@fields']);

  var m = {
    type: this.replaceByFields(data, this.type) || 'no_type',
	time: data['@timestamp'],
	data: d
  };

  logger.debug('Sending Data', m);

  var message = new Buffer(JSON.stringify(m));

  this.socket.send(message, 0, message.length, this.port, this.host, function(err, bytes) {
    if (err || bytes != message.length) {
      this.error_buffer.emit('error', new Error('Error while send data to ' + this.host + ':' + this.port + ':' + err));
    }
  }.bind(this));
}

OutputCube.prototype.close = function(callback) {
  logger.info('Closing output to Cube collector', this.host + ':' + this.port);

  this.socket.close();

  callback();
}

exports.create = function() {
  return new OutputCube();
}

var extend = (function(){

    var toString = Object.prototype.toString,
        obj = '[object Object]';

    return function extend( deep /*, obj1, obj2, obj3 */ ) {
        // take first argument, if its not a boolean
        var args = arguments,
            i = deep === true ? 1 : 0,
            key,
            target = args[i];

        for ( ++i; i < args.length; ++i ) {
            for (key in args[i]) {
				var targetKey = key.replace(/-/ig, '_');

                if ( deep === true &&
                     target[targetKey] &&
                     // if not doing this check you may end in
                     // endless loop if using deep option
                     toString.call(args[i][key]) === obj &&
                     toString.call(target[targetKey]) === obj ) {

                    extend( deep, target[targetKey], args[i][key] );
                } else {
                    target[targetKey] = args[i][key];
                }
            }
        }

        return target;
    };
}());
