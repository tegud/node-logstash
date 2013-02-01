
function fill0(s, k) {
  return s.length == k ? s : '0' + fill0(s, k -1);
}

function formatDate(d) {
  var now = d;
  var year = now.getFullYear();
  var month = fill0((now.getMonth() + 1) + '', 2);
  var day = fill0((now.getDate()) + '', 2);
  return year + '.' + month + '.' + day;
}

exports.computePath = function(data_type, timestamp) {
  var fdate = timestamp ? new Date(timestamp) : new Date();

  return '/logstash-' + formatDate(fdate) + '/' + data_type;
}
