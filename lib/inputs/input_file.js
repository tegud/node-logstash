var base_input = require('../lib/base_input'),
    util = require('util'),
    path = require('path'),
    logger = require('log4node'),
    directory_detector = require('../lib/directory_detector'),
    monitor_file = require('../lib/monitor_file'),
    tail = require('../lib/tail_file');

function InputFile() {
  base_input.BaseInput.call(this);
  this.config = {
    name: 'File',
    host_field: 'file',
    optional_params: ['type', 'buffer_size', 'buffer_encoding', 'wait_delay_after_renaming', 'start_index', 'use_tail'],
    default_values: {
      use_tail: false,
    }
  }
}

util.inherits(InputFile, base_input.BaseInput);

InputFile.prototype.afterLoadConfig = function(callback) {
  logger.info('Start input on file', this.file);

  if (this.start_index) {
    this.start_index = parseInt(this.start_index);
  }

  var parent = path.dirname(this.file);
  this.detector = new directory_detector.DirectoryDetector();

  this.detector.on('error', function(err) {
    this.emit('init_error', err);
  }.bind(this));

  this.detector.on('exists', function() {
    logger.info('Parent directory exists', parent, 'for reading', this.file);

    if (this.use_tail) {
      this.monitor = tail.tail(this.file);
    }
    else {
      this.monitor = monitor_file.monitor(this.file, {
        buffer_size: this.buffer_size,
        buffer_encoding: this.buffer_encoding,
        wait_delay_after_renaming: this.wait_delay_after_renaming,
      });
    }

    this.monitor.on('error', function(err) {
      this.emit('error', err);
    }.bind(this));

    this.monitor.on('init_error', function(err) {
      this.emit('error', err);
    }.bind(this));

    this.monitor.on('data', function(data) {
      this.extract_json_logstash_event(data, function(parsed) {
        this.emit('data', parsed);
      }.bind(this), function(data) {
        this.emit('data', {
          '@message': data,
          '@source': this.file,
          '@type': this.type,
        });
      }.bind(this));
    }.bind(this));

    this.monitor.start(this.start_index);

  }.bind(this));

  this.detector.start(parent);

  callback();
}

InputFile.prototype.close = function(callback) {
  logger.info('Closing input file', this.file);

  if (this.detector) {
    this.detector.close();
    delete this.detector;
  }
  if (this.monitor) {
    this.monitor.close(function() {
      delete this.monitor;
      callback();
    }.bind(this));
  }
  else {
    callback();
  }
}

exports.create = function() {
  return new InputFile();
}