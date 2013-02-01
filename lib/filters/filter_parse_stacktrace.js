var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node'),
	stacktrace_parser = require('../lib/stacktrace_parser');

function FilterParseStacktrace() {
	base_filter.BaseFilter.call(this);

	this.config = {
		name: 'parse_stacktrace',
		host_field: 'field',
		default_values: {
			field: '@message'
		}
	}
}

util.inherits(FilterParseStacktrace, base_filter.BaseFilter);

FilterParseStacktrace.prototype.afterLoadConfig = function(callback) {
	logger.info('Initialized Stacktrace Parser filter with field: ' + this.field);

	callback();
}

FilterParseStacktrace.prototype.process = function(data) {
	var value = data[this.field] || data['@fields'][this.field];

	if (value) {
		if (!data['@fields']) {
			data['@fields'] = {};
		}

		data['@fields']['stacktrace'] = stacktrace_parser(value);
	}

	return data;
}

exports.create = function() {
	return new FilterParseStacktrace();
}