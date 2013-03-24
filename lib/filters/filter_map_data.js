var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterMapData() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'MapData',
    host_field: 'field_name',
    required_params: ['regex', 'source_field', 'map', 'defaultValue']
  }
}

util.inherits(FilterMapData, base_filter.BaseFilter);

FilterMapData.prototype.afterLoadConfig = function(callback) {
  this.regex = new RegExp(this.regex);
  this.map = JSON.parse(this.map);

  logger.info('Initializing data mapper, regex : ' + this.regex + ', source ' + this.source_field);

  callback();
}

FilterMapData.prototype.process = function(data) {
  if (data['@fields'] && data['@fields'][this.source_field] && !data['@fields'][this.field_name]) {
	logger.debug('Trying to match data in url, input', data['@fields'][this.source_field]);

    var result = data['@fields'][this.source_field].match(this.regex);

	if (result && result.length > 0) {
		logger.debug('Match result:', result[result.length - 1]);

		data['@fields'][this.field_name] = this.map[result[result.length - 1]] || this.defaultValue;
	}
  }

  return data;
}

exports.create = function() {
  return new FilterMapData();
}