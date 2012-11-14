var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterExtractData() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'ExtractData',
    host_field: 'field_name',
    required_params: ['regex', 'source_field']
  }
}

util.inherits(FilterExtractData, base_filter.BaseFilter);

FilterExtractData.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.regex);

  logger.info('Initializing data extraction, regex : ' + this.regex + ', source ' + this.source_field);

  callback();
}

FilterExtractData.prototype.process = function(data) {
  if (data['@fields'] && data['@fields'][this.source_field] && !data['@fields'][this.field_name]) {
	logger.debug('Trying to match data in url, input', data['@fields'][this.source_field]);

    var result = data['@fields'][this.source_field].match(this.regex);

	if (result && result.length > 0) {
		logger.debug('Match result:', result[result.length - 1]);

		data['@fields'][this.field_name] = result[result.length - 1];
	}
  }

  return data;
}

exports.create = function() {
  return new FilterExtractData();
}