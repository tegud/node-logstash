(function() {

var util = require('util'),
	events = require("events"),
	fs = require("fs"),
    Glob = require('glob').Glob;

function WatchedFile(dir, path, mtime, fn) {
	this.dir = dir || '';
	this.path = path || '';
	this.mtime = mtime || new Date(0);
	this.fn = fn || function(){};
	this.tail = { unwatch: function(){} };
}

function getCurrentWatchedFile(dir, watchedfiles) {
	return watchedfiles.map(function(watchedfile) {
		if (watchedfile.dir == dir) {
			return watchedfile;
		}
	})[0] || new WatchedFile(dir);
};

function DirectoryMonitor(dir, pattern, fn, interval) {
    var monitor = this, ready = true;

    monitor.watchedFiles = [];

    this.pole = setInterval(function() {
		if (ready) {
			ready = false;

			var currentfile = getCurrentWatchedFile(dir, monitor.watchedFiles),
				mostrecentfile = currentfile,
				newfile = false,
				g = new Glob(pattern, { cwd: dir, nosort: true });

			g.on('match', function(file) {
				var mapped = dir + '/' + file;

				fs.stat(mapped, function(err, stats) {
					if (err) {
						if (err.Error == 'ECONNRESET') {
							return;
						}

						monitor.emit('error', 'could not read stats for ' + mapped);
						return;
					}

					var currentmtime = Date.parse(stats.mtime);
					if (currentmtime > mostrecentfile.mtime) {
						mostrecentfile = new WatchedFile(dir, mapped, currentmtime, fn);
						newfile = true;
					}
				});
			});

			g.on('end', function (foundfiles) {
				if (newfile) {
					monitor.stop(currentfile);
					monitor.start(mostrecentfile);
				}

				ready = true;
			});
		}
    }, interval);

	events.EventEmitter.call(monitor);
}

util.inherits(DirectoryMonitor, events.EventEmitter);

DirectoryMonitor.prototype.getExistingFilenames =  function() {
	return this.watchedFiles.map(function(m) { return m.path; });
};

DirectoryMonitor.prototype.close =  function(callback) {
    var monitor = this,
		existingfiles = monitor.getExistingFilenames();

	clearInterval(monitor.poll);

	existingfiles.forEach(function(path) {
		monitor.stop(path);
	});

	monitor.watchedFiles = [];

	callback();

	return monitor;
};

DirectoryMonitor.prototype.start =  function(watched) {
	watched.tail = watched.fn.call(this, watched.path);

	this.watchedFiles.push( watched );

	this.emit('start', watched.path);

	return this;
};

DirectoryMonitor.prototype.stop =  function(watched) {
	this.watchedFiles.forEach(function(m, i, watchedFiles) {
		if (m.path == watched.path) {
			m.tail.unwatch();

			watchedFiles.splice(i, 1);
		}
	});

	this.emit('stop', watched.path);

	return this;
};

DirectoryMonitor.monitor = function(path, pattern, fn, interval) {
    return new DirectoryMonitor(path, pattern, fn, interval);
}

module.exports.DirectoryMonitor = DirectoryMonitor;
module.exports.monitor = DirectoryMonitor.monitor;

})();