// LW004-PB_V3 Payload Decoder rule
// Creation time: 2023-07-12
// Creator: Valentin Kim, based on V3 ChirpStack decoder code
// Suitable firmware versions: LW004-PB V3.x.x
// Programming languages: Javascript
// Suitable platforms: Chirpstack v4.x

var packet_type = ["event", "sys_open", "sys_close", "heart", "low_battery", "work_gps_fix_success", "work_gps_fix_false", "work_ble_fix_success", "work_ble_fix_false", "helper_gps_fix_success", "helper_gps_fix_false", "helper_ble_fix_success", "helper_ble_fix_false"];
var dev_mode = ["off", "Standby Mode", "Timing Mode", "Periodic Mode", "Motion Mode On Stationary", "Motion Mode On Start", "Motion Mode In Trip", "Motion Mode On End"];
var dev_status = ["No", "Downlink", "Man Down", "Alert", "SOS"];
var event_type = ["Motion On Start", "Motion In Trip", "Motion On End", "SOS Start", "SOS End", "Alert Start", "Alert End", "Man Down Start", "Man Down End", "Downlink Report"];
var restart_reason = ["ble_cmd_restart", "lorawan_cmd_restart", "key_restart", "power_restart"];

function substringBytes(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push("0x" + bytes[start + i].toString(16) < 0X10 ? ("0" + bytes[start + i].toString(16)) : bytes[start + i].toString(16));
	}
	return char.join("");
}
function BytestoInt(bytes, start) {
	var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}
function decodeUplink(input) {
	/* 
		Decodes an uplink message from the input and return an object containing the decoded data.
	*/
	var bytes = input.bytes;
	var fPort = input.fPort;
	var variables = input.variables;
	var data = {};
	data.port = fPort;
	data.hex_format_payload = bytesToHexString(bytes, 0, bytes.length);
	if (fPort == 1 || fPort == 2 || fPort == 3 || fPort == 4
		|| fPort == 5 || fPort == 6 || fPort == 7 || fPort == 8 || fPort == 9 || fPort == 10 || fPort == 11 || fPort == 12 || fPort == 13) {
		data.charging_status = bytes[0] & 0x80 ? "charging" : "no charging";
		data.batt_level = (bytes[0] & 0x7F) + "%";
	}

	var dev_info = {};
	dev_info.pack_type = packet_type[fPort - 1];

	function parse_battery_charging_state(bytes) {
		return ((bytes[0] >> 7) & 0x01);
	}
	function parse_battery_level(bytes) {
		return (bytes[0] & 0x7F); // 0~100
	}
	function parse_timezone(bytes, start) {
		return bytes[start];
	}
	function parse_firmware(bytes) {
		return "v" + bytes[2] + "." + bytes[3] + "." + bytes[4]; // v1.0.0
	}
	function parse_hardware(bytes) {
		return "v" + bytes[5] + "." + bytes[6]; // v3.0
	}
	function decode_lon(bytes) {
		var lon = BytestoInt(bytes, 3) / 1000000;
		if (lon > 0x80000000)
			lon = lon - 0x100000000;
		return lon / 10000000;
	}
	function decode_lat(bytes) {
		var lat = BytestoInt(bytes, 7) / 1000000;
		if (lat > 0x80000000)
			lat = lat - 0x100000000;
		return lat / 10000000;
	}
	function decode_signal_gps(bytes) {
		var parse_len = 4;
		var signal = []
		for (var i = 0; i < ((bytes.length - 4) / 7); i++) {
			var data = {};
			data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			data.rssi = bytes[parse_len++] - 256;
			signal.push(data);
		}
		return signal;
	}
	function decode_signal_bluetooth(bytes) {
		var parse_len = 3;
		var signal = []
		for (var i = 0; i < ((bytes.length - 3) / 7); i++) {
			var data = {};
			data.mac = substringBytes(bytes, parse_len, 6);
			parse_len += 6;
			data.rssi = bytes[parse_len++] - 256;
			signal.push(data);
		}
		return signal;
	}

	switch (fPort) {
		case (1):
			data.payload_type = 'Event message';
			data.time = parse_time(bytesToInt(bytes, 2, 4), bytes[1] * 0.5);
			data.event_type = event_type[bytes[6]];
			return data;
		case (2):
			data.payload_type = 'Device information';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.parse_firmware = parse_firmware[bytes];
			data.parse_timezone = parse_timezone(bytes, 7);
			data.alarm = bytes[8];
			return data;
		case (3):
			data.payload_type = 'Shut Down';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.parse_timezone = parse_timezone(bytes, 7);
			data.time = parse_time(bytesToInt(bytes, 3, 5), bytes[2] * 0.5);
			data.restart_reason = restart_reason[bytes[7]];
			return data;
		case (4):
			data.payload_type = 'Heartbeat';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.parse_timezone = parse_timezone(bytes, 2);
			data.time = parse_time(bytesToInt(bytes, 3, 5), bytes[2] * 0.5);
			data.restart_reason = restart_reason[bytes[7]];
			return data;
		case (5):
			data.payload_type = 'Low power';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.parse_timezone = parse_timezone(bytes, 2);
			data.time = parse_time(bytesToInt(bytes, 3, 5), bytes[2] * 0.5);
			data.low_power_level = bytes[7];
			return data;
		case (6):
		case (10):
			data.payload_type = 'Location';
			data.dev_mode = dev_mode[(bytes[1] >> 5) & 0x07];
			data.dev_status = dev_status[(bytes[1] >> 2) & 0x07];
			data.age = (bytes[1] & 0x03) << 8 | bytes[2]
			data.longitude = decode_lon(bytes);
			data.latitude = decode_lat(bytes)
			return data;
		case (7):
		case (11):
			var gps_fix_false_reason = ["hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "gps_fix_tech_timeout", "gps_fix_timeout", "alert_short_time", "sos_short_time", "pdop_limit", "motion_start_interrupt", "motion_stop_interrupt"];
			data.payload_type = 'Location Failure';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.failure = gps_fix_false_reason[bytes[2]];
			data.fix_cn0 = bytes[3];
			data.fix_cn1 = bytes[4];
			data.fix_cn2 = bytes[5];
			data.fix_cn3 = bytes[6];
			return data;
		case (8):
		case (12):
			data.payload_type = 'Bluetooth Location';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.age = (bytes[2]) << 8 | bytes[3];
			data.signal = decode_signal_gps(bytes);
			return data;
		case (9):
		case (13):
			var ble_fix_false_reason = ["none", "hardware_error", "down_request_fix_interrupt", "mandown_fix_interrupt", "alarm_fix_interrupt", "ble_fix_timeout", "ble_adv", "motion_start_interrupt", "motion_stop_interrupt"];
			data.payload_type = 'Bluetooth Location';
			data.dev_mode = dev_mode[(bytes[1] >> 4) & 0x0F];
			data.dev_status = dev_status[bytes[1] & 0x0F];
			data.age = (bytes[2]) << 8 | bytes[3];
			data.failure = ble_fix_false_reason[bytes[2]];
			data.signal = decode_signal_bluetooth(bytes);
			return data;
	}
}


function bytesToHexString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		var data = bytes[start + i].toString(16);
		var dataHexStr = ("0x" + data) < 0x10 ? ("0" + data) : data;
		char.push(dataHexStr);
	}
	return char.join("");
}

function bytesToString(bytes, start, len) {
	var char = [];
	for (var i = 0; i < len; i++) {
		char.push(String.fromCharCode(bytes[start + i]));
	}
	return char.join("");
}

function bytesToInt(bytes, start, len) {
	var value = 0;
	for (var i = 0; i < len; i++) {
		var m = ((len - 1) - i) * 8;
		value = value | bytes[start + i] << m;
	}
	// var value = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | (bytes[start + 3]));
	return value;
}

function timezone_decode(tz) {
	var tz_str = "UTC";
	tz = tz > 128 ? tz - 256 : tz;
	if (tz < 0) {
		tz_str += "-";
		tz = -tz;
	} else {
		tz_str += "+";
	}

	if (tz < 20) {
		tz_str += "0";
	}

	tz_str += String(parseInt(tz / 2));
	tz_str += ":"

	if (tz % 2) {
		tz_str += "30"
	} else {
		tz_str += "00"
	}

	return tz_str;
}

function parse_time(timestamp, timezone) {
	timezone = timezone > 64 ? timezone - 128 : timezone;
	timestamp = timestamp + timezone * 3600;
	if (timestamp < 0) {
		timestamp = 0;
	}

	var d = new Date(timestamp * 1000);
	//d.setUTCSeconds(1660202724);

	var time_str = "";
	time_str += d.getUTCFullYear();
	time_str += "-";
	time_str += formatNumber(d.getUTCMonth() + 1);
	time_str += "-";
	time_str += formatNumber(d.getUTCDate());
	time_str += " ";

	time_str += formatNumber(d.getUTCHours());
	time_str += ":";
	time_str += formatNumber(d.getUTCMinutes());
	time_str += ":";
	time_str += formatNumber(d.getUTCSeconds());

	return time_str;
}

function formatNumber(number) {
	return number < 10 ? "0" + number : number;
}

String.prototype.format = function () {
	if (arguments.length == 0)
		return this;
	for (var s = this, i = 0; i < arguments.length; i++)
		s = s.replace(new RegExp("\\{" + i + "\\}", "g"), arguments[i]);
	return s;
};

function signedHexToInt(hexStr) {
	var twoStr = parseInt(hexStr, 16).toString(2); // 将十六转十进制，再转2进制
	var bitNum = hexStr.length * 4; // 1个字节 = 8bit ，0xff 一个 "f"就是4位
	if (twoStr.length < bitNum) {
		while (twoStr.length < bitNum) {
			twoStr = "0" + twoStr;
		}
	}
	if (twoStr.substring(0, 1) == "0") {
		// 正数
		twoStr = parseInt(twoStr, 2); // 二进制转十进制
		return twoStr;
	}
	// 负数
	var twoStr_unsign = "";
	twoStr = parseInt(twoStr, 2) - 1; // 补码：(负数)反码+1，符号位不变；相对十进制来说也是 +1，但这里是负数，+1就是绝对值数据-1
	twoStr = twoStr.toString(2);
	twoStr_unsign = twoStr.substring(1, bitNum); // 舍弃首位(符号位)
	// 去除首字符，将0转为1，将1转为0   反码
	twoStr_unsign = twoStr_unsign.replace(/0/g, "z");
	twoStr_unsign = twoStr_unsign.replace(/1/g, "0");
	twoStr_unsign = twoStr_unsign.replace(/z/g, "1");
	twoStr = -parseInt(twoStr_unsign, 2);
	return twoStr;
}
function getData(hex) {
	var length = hex.length;
	var datas = [];
	for (var i = 0; i < length; i += 2) {
		var start = i;
		var end = i + 2;
		var data = parseInt("0x" + hex.substring(start, end));
		datas.push(data);
	}
	console.log(datas);
	return datas;
}

// var datas = [2F, 01, 79, 51, 2B, 00, 77, 66, 51, 00, D9, 19, 4D, 75, 0B, 33, BF, 00, D0, 00, 6C, 03, A2,	00, 0E];

//console.log(getData("2F0179512B0077665100D9194D750B33BF00D0006C03A2000E"));
var input = {};
input.fPort = 8;
input.bytes = getData("64340800000000");
console.log(input.bytes[6]);
console.log(decodeUplink(input));