var base_filter = require('../lib/base_filter'),
    util = require('util'),
    logger = require('log4node');

function FilterLateroomsSetPageType() {
  base_filter.BaseFilter.call(this);
  this.config = {
    name: 'LateroomsSetPageType',
    host_field: 'field_name',
    required_params: ['source_field']
  }
}

util.inherits(FilterLateroomsSetPageType, base_filter.BaseFilter);

FilterLateroomsSetPageType.prototype.afterLoadConfig = function(callback) {
  this.pageRegexs = [{
	regex: /\/((k[0-9]+_[a-z-]+)|(r[0-9]+_hotels-in-[a-z-]+)|((H|h)otels))\.aspx$/,
	page: 'search'
  },
  {
	regex: /\/hotel-(reservations|directions|facilities|pictures|videos|reviews|special-offers)\//,
	page: 'hotel-details'
  },
  {
	regex: /\/Booking\/Online\//,
	page: 'booking-form'
  },
  {
    regex: /\/PhoneReservation\/Open\//,
	page: 'telephone-booking'
  }];

  logger.info('Initializing laterooms set page type, source ' + this.source_field);

  callback();
}

FilterLateroomsSetPageType.prototype.process = function(data) {
  if (data['@fields'] && data['@fields'][this.source_field] && !data['@fields'][this.field_name]) {
    var regexsLength = this.pageRegexs.length,
		x = 0;

	for(;x < this.pageRegexs.length;x++) {
		if(data['@fields'][this.source_field].match(this.pageRegexs[x].regex)) {
			data['@fields'][this.field_name] = this.pageRegexs[x].page;
			break;
		}
	}
  }

  return data;
}

exports.create = function() {
  return new FilterLateroomsSetPageType();
}