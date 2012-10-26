var base_input = require('../lib/base_input'),
    util = require('util'),
    logger = require('log4node'),
    Tail = require('tail').Tail,
    Glob = require('glob').Glob;

function MonitoredDir(path, pattern, fn, interval) {
    var monitor = this;

    monitor.filelist = [];
    monitor.monitors = [];

    this.pole = setInterval(function() {
        var g = new Glob(pattern, { cwd: path })
            .on('match', function (file) {
                if (monitor.filelist.indexOf(file) < 0) {
                    monitor.filelist.push(file);

                    fn.call(monitor, file);
                }
            });
    }, interval);
}

MonitoredDir.monitor = function(path, pattern, fn, interval) {
    return new MonitoredDir(path, pattern, fn, interval);
}

MonitoredDir.prototype = {
    close: function(callback) {
        clearInterval(this.poll);

        this.monitors.forEach(function(monitor) {
            monitor.unwatch();
        });

        this.monitors = [];

        callback();

        return this;
    }
}

/* actual plugin */

function InputDirectory() {
  base_input.BaseInput.call(this);

  this.config = {
    name: 'Directory',
    host_field: 'directory',
    required_params: ['pattern', 'poll_rate'],
    optional_params: ['type'],
  }
}

util.inherits(InputDirectory, base_input.BaseInput);

InputDirectory.prototype.afterLoadConfig = function(callback) {
  var inpuDir = this;

  logger.info('Starting monitoring on directory', inpuDir.directory);

  inpuDir.dir_monitor = MonitoredDir.monitor(inpuDir.directory, inpuDir.pattern, function(file) {
      logger.info('Start input on file', file);

      var monitor = new Tail(inpuDir.directory + '/' + file)
          .on('line', function(data) {
            try {
              var parsed = JSON.parse(data);

              if (!parsed['@message']) {
                throw new Error();
              }

              inpuDir.emit('data', parsed);
            }
            catch(e) {
              inpuDir.emit('data', {
                '@message': data,
                '@source': file,
                '@type': inpuDir.type,
              });
            }
          });

      this.monitors.push(monitor);

  }, inpuDir.poll_rate);

  callback();
}

InputDirectory.prototype.close = function(callback) {
  logger.info('Stopping monitoring on directory', this.directory);

  this.dir_monitor.close(callback);
}

exports.create = function() {
  return new InputDirectory();
}