function parseStackTraceLine(ln) {
	var line = ln.trim();

	var data = {
		value: line,
		method: '',
		src: '',
		line: 0
	};

	if (line.indexOf(':line ') >= 0) {
		var t1 = line.split(':line ');
		data.line = t1[1].trim();
		line = t1[0].trim();
	}

	if (line.indexOf(' in ') >= 0) {
		var t2 = line.split(' in ');
		data.src = t2[1].trim();
		line = t2[0].trim();
	}

	if (line.indexOf('at ') === 0) {
		data.method = line.substr(2).trim();
	}

	return data;
}

function parseErrorText(exceptionText) {
	var data = {
		type: '',
		error: 'An Unknown Exception Occured',
		exception: '',
		breakdown: {}
	};

	var lines = exceptionText.split('\r\n'), firstline = '';

	if (lines.length > 0) {
		data.error = lines.shift().trim();

		if (data.error.toLowerCase().indexOf(':') >= 0) {
			firstline = data.error;
		} else {
			firstline = (lines[0] || '');
		}
	}

	if (lines.length > 1) {
		if ((lines[0] || '').trim() === '') {
			lines.shift();

			firstline = (lines[0] || '');
		}

		if (data.error.toLowerCase().indexOf('dynamic view compilation failed') >= 0) {
			data.type = 'DynamicViewCompilationFailure';

			var info = lines.shift().trim().split(':');
			if (info.length > 0) {
				data.error = (info[3] || '').trim();
			}
		}

		if (firstline.toLowerCase().indexOf(':') >= 0) {
			var msg = firstline.split(/:/i);

			data.type = msg.shift().trim();
			data.error = msg.join(':').trim();
		}

		if (lines[0] === 'Stacktrace:') {
			lines.shift();
		}

		data.exception = lines.join('\r\n').trim();

		data.breakdown = lines.map(function(line) {
			return parseStackTraceLine(line);
		});
	}

	return data;
}

module.exports = parseErrorText;