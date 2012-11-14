var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterExtractQuery() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'ExtractQuery',
    host_field: 'field_name'
  }
}

util.inherits(FilterExtractQuery, base_filter.BaseFilter);

FilterExtractQuery.prototype.afterLoadConfig = function(callback) {
  logger.info('Initializing query extraction, source ' + this.source_field);

  callback();
}

FilterExtractQuery.prototype.process = function(data) {
  if (data['@fields'] && data['@fields'][this.field_name]) {
	logger.debug('Trying to extract data from query, input', data['@fields'][this.field_name]);

    var result = data['@fields'][this.field_name].split('&');

	if (result && result.length > 0) {
		result.forEach(function(keyvalue) {
			logger.debug('Match result:', keyvalue);

			var item = keyvalue.split('=');

			data['@fields'][item[0]] = item[1] || '';
		});

	}
  }

  return data;
}

exports.create = function() {
  return new FilterExtractQuery();
}