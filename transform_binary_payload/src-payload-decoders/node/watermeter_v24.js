// Decoder for LoRaWAN smart water meter, protocol version 2412 ("v24.x")
// Based on vendor document "LoraWan water meter agreement sample description (2412)"
//
// Uplink report frame layout:
//   24 <TAG><VALUE> <TAG><VALUE> ... <CS>
//   - Byte 0 (0x24) is the fixed frame head for a data report.
//   - The last byte is a checksum: the low byte of the sum of every
//     preceding byte in the frame.
//   - Everything in between is a sequence of TAG(1 byte) + VALUE(N bytes)
//     fields; the tags present (and therefore the frame length) vary
//     with meter class (A/B), trigger source and configured options.

function decodeUplink(input) {
    var bytes = input.bytes;
    return { data: decodeUP(bytes) };
}

function Decode(fPort, bytes) {
    return decodeUP(bytes);
}

function Decoder(bytes, port, uplink_info) {
    return decodeUP(bytes);
}

function decodeUP(bytes) {
    var tempStr = handlerBytesToHex(bytes);

    var dataObj = {
        dateVersion: "2412",
        payload: tempStr,
        pulseConstant: 1,
        serverTimestamp: Date.now()
    };

    var sizeEnumObj = {
        valveState: {
            0: "Open",
            1: "Close"
        },
        pulseConstant: {
            1: 1,
            2: 10,
            3: 100,
            4: 1000
        },
        meterType: {
            0: "Water meter"
        },
        meteringMode: {
            0: "Double reed",
            1: "Single reed",
            2: "Double hall"
        },
        LoRaWANWorkingMode: {
            0: "Class A",
            17: "Class B;current state Class B",
            34: "Class C;current state Class C"
        },
        // Codes 0, 1, 10 and 20 are explicitly documented; the rest are
        // common codes from this vendor's wider meter protocol family.
        triggerSource: {
            0: "Magnetic trigger report",
            1: "Routine report",
            2: "Magnetic attack",
            3: "Valve control",
            4: "Read sensor information",
            5: "Read software version information",
            6: "Set software parameters",
            7: "Monthly freeze",
            8: "Annual freeze",
            9: "Successful networking",
            10: "Timing dredge valve",
            11: "Set network access parameters",
            12: "Set device parameters",
            13: "Upgrade software",
            14: "Interval periodic upload",
            15: "Non-magnetic induction alarm",
            16: "Dense sampling period",
            18: "Start LoRaWAN",
            19: "Abnormal status reporting",
            20: "LoRaWAN work mode modification and report",
            21: "Status feedback",
            22: "Button trigger reporting",
            23: "Modify parameter reporting"
        },
        // State word table 1 (status byte 1) - bit -> alarm description
        statusWord1: {
            1: "Metering fault (disassembly)",
            2: "Valve status: Close",
            3: "DER error",
            4: "Battery off (removed)",
            5: "Magnetic attack",
            6: "Battery status: undervoltage",
            7: "Valve failure"
        },
        // State word table 2 (status byte 2) - bit -> alarm description
        statusWord2: {
            0: "Far-end sign: far-end data",
            1: "Historical magnetic attack",
            2: "Leak through booster",
            3: "Dropping",
            4: "Meter end status: blank pipe",
            5: "Flow alarm (historical disassembly)",
            6: "Backwater alarm",
            7: "Water penetration alarm"
        },
        // Documented example: report code 0x07 -> 122880ms downlink communication cycle
        classBDownlinkCycleMs: {
            7: 122880
        }
    };

    var funcEnumObj = {
        '19': handlerDataToInt(1, "packetSequence"),
        '16': handlerDataToDecimalString(4, "deviceMeterNo"),
        '14': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 1 * 2 + 2;
            tempObjOne.pulseConstant = sizeEnumObj.pulseConstant[parseInt(tempStr.slice(2, fc), 16)];
            return [tempStr.slice(fc), tempObjOne];
        },
        '1B': handlerDataToIntEnu(1, "meterType"),
        '12': handlerDataToIntEnu(1, "meteringMode"),
        '0B': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 4 * 2 + 2;
            var pulseCount = parseInt(tempStr.slice(2, fc), 16);
            tempObjOne.pulseCount = pulseCount;
            tempObjOne.meterReading = pulseCount * tempObjOne.pulseConstant;
            return [tempStr.slice(fc), tempObjOne];
        },
        '1A': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 2 * 2 + 2;
            var raw = parseInt(tempStr.slice(2, fc), 16);
            tempObjOne.batteryVoltage = Math.round((raw / 16.4) * 100) / 100;
            return [tempStr.slice(fc), tempObjOne];
        },
        '33': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 2 * 2 + 2;
            var b1 = parseInt(tempStr.slice(2, 4), 16);
            var b2 = parseInt(tempStr.slice(4, 6), 16);

            tempObjOne.valveState = sizeEnumObj.valveState[(b1 >> 2) & 0x01];

            var alarms = [];
            [1, 3, 4, 5, 6, 7].forEach(function (bit) {
                if ((b1 >> bit) & 0x01) alarms.push(sizeEnumObj.statusWord1[bit]);
            });
            [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (bit) {
                if ((b2 >> bit) & 0x01) alarms.push(sizeEnumObj.statusWord2[bit]);
            });
            tempObjOne.statusWord = alarms.join(";");

            return [tempStr.slice(fc), tempObjOne];
        },
        '23': handlerDataToIntEnu(1, "triggerSource"),
        '09': handlerDataToIntEnu(1, "LoRaWANWorkingMode"),
        '11': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 1 * 2 + 2;
            var code = parseInt(tempStr.slice(2, fc), 16);
            tempObjOne.classBDownlinkCycleCode = code;
            tempObjOne.classBDownlinkCycleMs = sizeEnumObj.classBDownlinkCycleMs[code];
            return [tempStr.slice(fc), tempObjOne];
        },
        '25': handlerDataToInt(4, "timingReportingInterval"),
        '2B': handlerDataToInt(1, "reportingStartTime"),
        '1C': function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = 6 * 2 + 2;
            var parts = [];
            for (var i = 2; i <= 12; i += 2) {
                parts.push(("0" + String(parseInt(tempStr.slice(i, i + 2), 16))).slice(-2));
            }
            tempObjOne.moduleTime = "20" + parts.slice(0, 3).join("-") + " " + parts.slice(3).join(":");
            return [tempStr.slice(fc), tempObjOne];
        },
        'default': function (tempStr, sizeEnumObj, tempObjOne) {
            // Unknown/undocumented tag: stop parsing rather than guess a length.
            return [tempStr.slice(tempStr.length), tempObjOne];
        }
    };

    var csInfo = verifyChecksum(tempStr);
    dataObj.csValid = csInfo.valid;
    dataObj.csReceived = csInfo.received;
    dataObj.csExpected = csInfo.expected;

    var caseStr = tempStr.slice(2, -2);
    while (caseStr.length) {
        var tag = caseStr.slice(0, 2);
        tag = (tag in funcEnumObj) ? tag : "default";
        var result = funcEnumObj[tag](caseStr, sizeEnumObj, dataObj);
        caseStr = result[0];
        dataObj = result[1];
    }

    return dataObj;

    function handlerDataToInt(byteLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = byteLength * 2 + 2;
            tempObjOne[fName] = parseInt(tempStr.slice(2, fc), 16);
            return [tempStr.slice(fc), tempObjOne];
        };
    }

    function handlerDataToIntEnu(byteLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = byteLength * 2 + 2;
            tempObjOne[fName] = sizeEnumObj[fName][parseInt(tempStr.slice(2, fc), 16)];
            return [tempStr.slice(fc), tempObjOne];
        };
    }

    function handlerDataToDecimalString(byteLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            var fc = byteLength * 2 + 2;
            tempObjOne[fName] = parseInt(tempStr.slice(2, fc), 16).toString();
            return [tempStr.slice(fc), tempObjOne];
        };
    }

    function verifyChecksum(hexStr) {
        var sum = 0;
        for (var i = 0; i < hexStr.length - 2; i += 2) {
            sum += parseInt(hexStr.slice(i, i + 2), 16);
        }
        var expected = ("0" + (sum & 0xff).toString(16)).slice(-2).toUpperCase();
        var received = hexStr.slice(-2).toUpperCase();
        return { valid: expected === received, expected: expected, received: received };
    }

    function handlerBytesToHex(bytesData) {
        if (typeof bytesData === "string") {
            return bytesData.toUpperCase();
        }
        return bytesData.map(function (byte) {
            return ("0" + (byte & 0xff).toString(16)).slice(-2);
        }).join("").toUpperCase();
    }
}
