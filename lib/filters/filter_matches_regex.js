var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterMatchesRegex() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'MatchesRegex',
    host_field: 'field_name',
    required_params: ['source_field', 'regex']
  }
}

util.inherits(FilterMatchesRegex, base_filter.BaseFilter);

FilterMatchesRegex.prototype.afterLoadConfig = function(callback) {
  //this.regex = alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|nagios|postrank|pingdom|slurp|spider|yahoo!;
  this.regex = new RegExp(this.regex);
  
  logger.info('Initializing MatchesRegex, regex : ' + this.regex + ', source ' + this.source_field);

  callback();
}

FilterMatchesRegex.prototype.process = function(data) {
  data['@fields'][this.field_name] = this.regex.test(data['@fields'][this.source_field]);

  return data;
}

exports.create = function() {
  return new FilterMatchesRegex();
}