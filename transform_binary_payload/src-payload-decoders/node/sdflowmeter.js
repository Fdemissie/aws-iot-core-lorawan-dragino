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
   //var bytes = handlerHexToBytes("24168f2f97a51402a2050100000b2d0b00000b2d1a003b330000230119");
    var caseStr, tempStr, funcEnumObj;
    tempStr = handlerBytesToHex(bytes);
    var dataObj = {
        dateVersion: "20241230",
        payload: "",
        pulseConstant: 1,
        serverTimestamp: Date.now()
    };
    dataObj.payload = tempStr;
    var sizeEnumObj = {
        valveState: {
            0: "Open valve",
            1: "Close valve",
        },
        pulseConstant: {
            0: 0.5,
            1: 1,
            2: 10,
            3: 100,
            4: 1000,
            5: 10000,
        },
        LoRaWANWorkingMode: {
            0: "Class A;",
            1: "Class B;Being in Class A",
            2: "Class B;Being in Class A",
            3: "Dual mode",
            17: "Class B;Being in Class B",
            34: "Class C;Being in Class C",
        },
        valveType: {
            0: "Two-wire valve",
            1: "Five-wire valve",
            2: "No valve",
            3: "Angle valve",
            4: "Four-wire valve",
        },
        meterType: {
            0: "Water meter",
            1: "Gas meter",
            2: "Heat meter",
            3: "Electric meter",
            4: "Gas sensor",
            5: "Smoke sensor",
            6: "Electromagnetic flowmeter sensor",
        },
        meteringMode: {
            0: "Double reed",
            1: "Single reed",
            2: "Double hall",
            3: "Direct reading",
            4: "Non-magnetic inductance",
            5: "Non-magnetic coil",
            6: "Three hall",
            7: "Single Hall",
            8: "EDC-U pulse",
            9: "IUW pulse",
            10: "EDC-B1 pulse",
            11: "EDC-B2 pulse",
            12: "IUW-NFC pulse",
            13: "ADC acquisition",
            14: "Near-end camera direct reading",
            15: "Remote camera direct reading",
            16: "light-sensitive metering",
        },
        triggerSource: {
            0: "Magnetic trigger",
            1: "Routine report",
            2: "Magnetic attack",
            3: "Valve control",
            4: "Read sensor information",
            5: "Read software version information",
            6: "Set software parameters",
            7: "Monthly freeze",
            8: "Annual freeze",
            9: "Successful networking",
            10: "Dredge valve",
            11: "Set network access parameters",
            12: "Set device parameters",
            13: "Upgrade softwar",
            14: "Interval periodic upload",
            15: "Non-magnetic induction alarm",
            16: "Dense sampling period",
            17: "Q3",
            18: "Start LoRaWAN",
            19: "Abnormal status reporting",
            20: "Modify working mode",
            21: "Status feedback",
            22: "Button trigger reporting",
            23: "Modify parameter reporting",
        },
        statusWord: {
            1: {
                1: "Disassembly alarm",
                3: "DER error",
                4: "Battery disassembly",
                5: "Magnetic attack alarm",
                6: "Battery low voltage",
                7: "Valve failure",
            },
            2: {
                0: "Remote status",
                1: "Historical magnetic attack warning",
                2: "PipeBurst alarm",
                3: "Drip alarm",
                4: "Empty pipeline alarm",
                5: "Historical demolition alarm",
                6: "Water flow reverse alarm",
                7: "Water seepage warning",
            },
        },
    };
    funcEnumObj = {
        '01': handlerDataToInt(4, "currentCoolingFlow"),
        '02': handlerDataToInt(4, "currentHeaFlow"),
        '03': handlerDataToInt(4, "heatPower"),
        '04': handlerDataToInt(4, "concurrentFlow"),
        '05': placeholderLength(1),
        '06': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 2 * 2 + 2;
            f_count = parseInt(tempStr.slice(2, fc), 16);
            if (f_count > Math.pow(2, 15) - 1) {
                f_value = f_count - Math.pow(2, 16);
            } else {
                f_value = f_count;
            }
            tempObjOne.waterSupplyTemperature = Math.round(f_value / 100);
            return [tempStr.slice(fc), tempObjOne]
        },
        '07': handlerDataToInt(3, "returnWaterTemperature"),
        '08': handlerDataToInt(3, "cumulativeWorkingTime"),
        '09': handlerDataToIntEnu(1, "LoRaWANWorkingMode"),
        '0A': handlerDataToInt(2, "sensorVoltage"),
        '0B': handlerDataToIntByPN(4, "meterReading"),
        '0C': handlerDataToIntByPN(4, "settlementCumulativeFlow"), //
        '0D': handlerDataToIntByPN(4, "monthlyFrozenCumulativeFlow"), //
        '0E': handlerDataToIntByPN(4, "annualFrozenCumulativeFlow"), //
        '0F': placeholderLength(1),
        '10': placeholderLength(1),
        '11': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 1 * 2 + 2;
            tempObjOne.classBDownlinkCycle = parseInt(122880 / (128 / (Math.power(2, parseInt(tempStr.slice(2, fc))))));
            return [tempStr.slice(fc), tempObjOne]
        },
        '12': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 1 * 2 + 2;
            tempObjOne.meteringMode = sizeEnumObj.meteringMode[parseInt(tempStr.slice(2, fc), 16)];
            return [tempStr.slice(fc), tempObjOne]
        },
        '13': handlerDataToIntByPN(4, "maximumMeteringValue"),
        '14': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 1 * 2 + 2;
            tempObjOne.pulseConstant = sizeEnumObj.pulseConstant[parseInt(tempStr.slice(2, fc), 16)];
            return [tempStr.slice(fc), tempObjOne]
        },
        '15': handlerDataToSInt(1, "RSSI", 1),
        '16': handlerDataToString(4, "deviceMeterNo"),
        '17': handlerDataToIntEnu(1, "valveType"),
        '98': function (tempStr, sizeEnumObj, tempObjOne) {
            var devLengthTMP1 = parseInt(tempStr.slice(2, 4), 16);
            fc = ((tempStr.length - 4) >= devLengthTMP1) ? devLengthTMP1 * 2 + 4 : tempStr.length;
            var tmpList = [];
            var tStr = tempStr.slice(4, fc);
            for (i = 0; i < tStr.length; i += 2) {
                tmpList.push(String.fromCharCode(parseInt(tStr.slice(i, i + 2), 16)));
            }
            tempObjOne.deviceVersion = tmpList.join("");
            return [tempStr.slice(fc), tempObjOne]
        },
        '19': handlerDataToInt(1, "packetSequence"),
        '1A': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 2 * 2 + 2;
            var tInt = parseInt(parseInt(tempStr.slice(2, fc), 16) / 16.4 * 1000);
            tempObjOne.batteryVoltage = tInt;
            if (tInt > 3600) {
                tInt = "100%";
            } else if (tInt > 3210) {
                tInt = ((tInt - 3200) / 4).toString() + "%";
            } else {
                tInt = "1%";
            }
            tempObjOne.batteryVoltageRatio = tInt;
            return [tempStr.slice(fc), tempObjOne]
        },
        '1B': handlerDataToIntEnu(1, "meterType"),
        '1C': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 6 * 2 + 2;
            var tmpList = [];
            for (i = 2; i <= 12; i += 2) { tmpList.push(("00" + String(parseInt(tempStr.slice(i, i + 2), 16))).slice(-2)); };
            tempObjOne.moduleTime = "20" + tmpList.slice(0, 3).join("-") + " " + tmpList.slice(3).join(":");
            return [tempStr.slice(fc), tempObjOne]
        },
        '1D': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 3 * 2 + 2;
            var tmpList = [];
            for (i = 2; i <= 6; i += 2) { tmpList.push(("00" + String(parseInt(tempStr.slice(i, i + 2), 16))).slice(-2)); };
            tempObjOne.dataFreezingDate = "20" + tmpList.join("-");
            return [tempStr.slice(fc), tempObjOne]
        },
        '1E': handlerDataToOriginString(8, "devEUI"),
        '1F': placeholderLength(1),
        '20': placeholderLength(1),
        '21': placeholderLength(4),
        'A2': function (tempStr, sizeEnumObj, tempObjOne) {
            var tempPN = tempObjOne.pulseConstant;
            var devLengthTMP2 = parseInt(tempStr.slice(2, 4), 16);
            fc = (tempStr.length - 4 >= devLengthTMP2) ? devLengthTMP2 * 2 + 4 : tempStr.length;
            var historicalFlowRecord = {};
            var period = parseInt(tempStr.slice(4, 6), 16);
            period = period <= 144 ? period * 5 : (144 * 5 + (period - 144) * 10);
            historicalFlowRecord.intervalPeriod = period;
            if (devLengthTMP2 >= 5) {
                var tObj = {};
                var initialValue = parseInt(parseInt(tempStr.slice(6, 14), 16) * tempPN);
                var tPeriod = (period < 60) ? period : 60;
                var tDate = new Date();
                var time1 = Date.now() - (((tDate.getMinutes() % tPeriod) * 60 + tDate.getSeconds()) * 1000 + tDate.getMilliseconds());
                if (devLengthTMP2 < 7) {
                    tObj[time1.toString()] = initialValue;
                }
                if (devLengthTMP2 >= 7) {
                    var tStr = tempStr.slice(14, fc);
                    var initialTime = time1 - parseInt(tStr.length / 4) * period * 60 * 1000;
                    var tmpInitValue = 0;
                    tObj[initialTime.toString()] = initialValue;
                    initialTime += period * 60 * 1000;
                    for (i = 0; i <= tStr.length - 4; i += 4) {
                        tmpInitValue = parseInt(tStr.slice(i, i + 4), 16);
                        tmpInitValue = tmpInitValue > 32767 ? 32767 + 1 - tmpInitValue : tmpInitValue;
                        initialValue = parseInt(tmpInitValue * tempPN + initialValue);
                        tObj[initialTime.toString()] = initialValue;
                        initialTime += period * 60 * 1000;
                    }
                    historicalFlowRecord.valueList = tObj;
                }
            }
            tempObjOne.historicalFlowRecord = historicalFlowRecord;
            return [tempStr.slice(fc), tempObjOne]
        },
        '23': handlerDataToIntEnu(1, "triggerSource"),
        '24': placeholderLength(1),
        '25': handlerDataToInt(4, "timingReportingInterval"),
        '26': placeholderLength(4),
        '27': placeholderLength(4),
        '28': placeholderLength(4),
        '29': placeholderLength(4),
        '2A': placeholderLength(4),
        '2B': handlerDataToInt(1, "reportingStartTime"),
        '2C': handlerDataToInt(2, "denseSamplingPeriod"),
        '2D': placeholderLength(2),
        '2E': placeholderLength(1),
        '2F': placeholderLength(8),
        '30': placeholderLength(2),
        '31': placeholderLength(2),
        '33': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 2 * 2 + 2;
            var t1 = parseInt(tempStr.slice(2, 4), 16);
            tempObjOne.valveState = sizeEnumObj.valveState[(t1 & 0x04) >> 2];
            var t1ObjTMP1 = sizeEnumObj.statusWord[1];
            var tmpBytes = [];
            if ((t1 & 0x02) >> 1) tmpBytes.push(t1ObjTMP1[1]);
            if ((t1 & 0x08) >> 3) tmpBytes.push(t1ObjTMP1[3]);
            if ((t1 & 0x10) >> 4) tmpBytes.push(t1ObjTMP1[4]);
            if ((t1 & 0x20) >> 5) tmpBytes.push(t1ObjTMP1[5]);
            if ((t1 & 0x40) >> 6) tmpBytes.push(t1ObjTMP1[6]);
            if ((t1 & 0x80) >> 7) tmpBytes.push(t1ObjTMP1[7]);

            var t2 = parseInt(tempStr.slice(4, 6), 16);
            var t2ObjTMP2 = sizeEnumObj.statusWord[2];
            if ((t2 & 0x01) >> 0) tmpBytes.push(t2ObjTMP2[0]);
            if ((t2 & 0x02) >> 1) tmpBytes.push(t2ObjTMP2[1]);
            if ((t2 & 0x04) >> 2) tmpBytes.push(t2ObjTMP2[2]);
            if ((t2 & 0x08) >> 3) tmpBytes.push(t2ObjTMP2[3]);
            if ((t2 & 0x10) >> 4) tmpBytes.push(t2ObjTMP2[4]);
            if ((t2 & 0x20) >> 5) tmpBytes.push(t2ObjTMP2[5]);
            if ((t2 & 0x40) >> 6) tmpBytes.push(t2ObjTMP2[6]);
            if ((t2 & 0x80) >> 7) tmpBytes.push(t2ObjTMP2[7]);

            var tmpAlarm = tmpBytes.join(";");
            if (tmpAlarm != "") tempObjOne.statusWord = tmpAlarm;
            return [tempStr.slice(fc), tempObjOne]
        },
        '34': handlerDataToOriginString(8, "APPEUI"),
        '35': handlerDataToOriginString(16, "APPKEY"),
        '36': placeholderLength(2),
        '37': placeholderLength(1),
        '38': placeholderLength(4),
        '39': placeholderLength(2),
        '3A': placeholderLength(2),
        '3B': placeholderLength(2),
        '3C': placeholderLength(2),
        '3D': placeholderLength(2),
        '3E': placeholderLength(2),
        '3F': placeholderLength(1),
        '40': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 2 * 2 + 2;
            tempObjOne.pressureValue = parseInt(tempStr.slice(2, fc), 16);
            return [tempStr.slice(fc), tempObjOne]
        },
        '41': placeholderLength(4),
        '42': placeholderLength(5),
        '43': function (tempStr, sizeEnumObj, tempObjOne) {
            fc = 9 * 2 + 2;
            var tmpList = [];
            for (i = 2; i <= 8; i += 2) {
                tmpList.push(("00" + String(parseInt(tempStr.slice(i, i + 2), 16))).slice(-2));
            }
            tempObjOne.frozenDataDate =
                "20" + tmpList.slice(0, 3).join("-") + " " + tmpList.slice(2).join(":") + ":00";
            tempObjOne.frozenDataValue = parseInt(tempStr.slice(10, 18), 16);
            return [tempStr.slice(fc), tempObjOne]
        },
        '44': placeholderLength(4),
        '45': placeholderLength(1),
        '46': placeholderLength(4),
        '47': placeholderLength(16),
        '48': placeholderLength(16),
        '49': placeholderLength(4),
        '4A': placeholderLength(6),
        '4B': function (tempStr, sizeEnumObj, tempObjOne) {
            var tempPN = tempObjOne.pulseConstant;
            var devLengthTMP2 = parseInt(tempStr.slice(2, 4), 16);
            fc = (tempStr.length - 4 >= devLengthTMP2) ? devLengthTMP2 * 2 + 4 : tempStr.length;
            var denseFrozenFlow = {};
            var period = parseInt(tempStr.slice(4, 6), 16);
            period = period <= 144 ? period * 5 : (144 * 5 + (period - 144) * 10);
            denseFrozenFlow.intervalPeriod = period;
            if (devLengthTMP2 >= 5) {
                var tObj = {};
                var initialValue = parseInt(parseInt(tempStr.slice(6, 14), 16) * tempPN);
                var tPeriod = (period < 60) ? period : 60;
                var tDate = new Date();
                var time1 = Date.now() - (((tDate.getMinutes() % tPeriod) * 60 + tDate.getSeconds()) * 1000 + tDate.getMilliseconds());
                if (devLengthTMP2 < 7) { tObj[time1.toString()] = initialValue; }
                if (devLengthTMP2 >= 7) {
                    var tStr = tempStr.slice(14, fc);
                    var initialTime = time1 - parseInt(tStr.length / 4) * period * 60 * 1000;
                    var tmpInitValue = 0;
                    tObj[initialTime.toString()] = initialValue;
                    initialTime += period * 60 * 1000;
                    for (i = 0; i <= tStr.length - 2; i += 2) {
                        tmpInitValue = parseInt(tStr.slice(i, i + 2), 16);
                        if (tmpInitValue > 127) {
                            var b6 = getBit(tmpInitValue, 6, 2);
                            var b1 = getBit(tmpInitValue, 1, 0);
                            for (k = 0; k <= b6 - 1; k += 1) {
                                tObj[initialTime.toString()] = b1;
                                initialTime += period * 60 * 1000;
                            };
                        } else {
                            var b6 = getBit(tmpInitValue, 6, 6);
                            var b5 = getBit(tmpInitValue, 5, 5);
                            var b0 = getBit(tmpInitValue, 4, 0);
                            var bValue = 0;
                            if (b6 >= 1) {
                                i = i + 2;
                                var bf = parseInt(tStr.slice(i, i + 2), 16);
                                var bf0 = getBit(bf, 6, 0);
                                var bf7 = getBit(bf, 7, 7);
                                if (bf7 >= 1) {
                                    i = i + 2;
                                    var bs = parseInt(tStr.slice(i, i + 2), 16);
                                    var bs0 = getBit(bs, 6, 0);
                                    bValue = b0 * Math.pow(2, 14) + bf0 * Math.pow(2, 7) + bs0;
                                } else {
                                    bValue = b0 * Math.pow(2, 7) + bf0;
                                };
                            } else {
                                bValue = b0;
                            };
                            bValue = b5 >= 1 ? (0 - bValue) : bValue;
                            tObj[initialTime.toString()] = bValue;
                            initialTime += period * 60 * 1000;
                        };
                    }
                    denseFrozenFlow.valueList = tObj;
                }
            }
            tempObjOne.denseFrozenFlow = denseFrozenFlow;
            return [tempStr.slice(fc), tempObjOne]
        },
        '51': placeholderLength(1),
        '52': handlerDataToInt(2, "batteryLife"),
        '53': placeholderLength(1),
        '54': placeholderLength(4),
        'default': function (tempStr, sizeEnumObj, tempObjOne) {
            return [tempStr.slice(tempStr.length), tempObjOne]
        },
    };
    caseStr = tempStr.slice(2, -2);
    while (caseStr.length) {
        var caseheaderStr = caseStr.slice(0, 2);
        caseheaderStr = (caseheaderStr in funcEnumObj) ? caseheaderStr : "default";
        caseObj = funcEnumObj[caseheaderStr](caseStr, sizeEnumObj, dataObj);
        caseStr = caseObj[0];
        dataObj = caseObj[1];
    }
    function placeholderLength(bitLength) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            return [tempStr.slice(bitLength * 2 + 2), tempObjOne];
        };
    };
    function handlerDataToInt(bitLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            tempObjOne[fName] = parseInt(tempStr.slice(2, fc), 16);
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function handlerDataToIntByPN(bitLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            tempObjOne[fName] = parseInt(parseInt(tempStr.slice(2, fc), 16) * tempObjOne.pulseConstant);
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function handlerDataToString(bitLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            tempObjOne[fName] = parseInt(tempStr.slice(2, fc), 16).toString();
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function handlerDataToIntEnu(bitLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            tempObjOne[fName] = sizeEnumObj[fName][parseInt(tempStr.slice(2, fc), 16)];
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function handlerDataToOriginString(bitLength, fName) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            tempObjOne[fName] = tempStr.slice(2, fc);
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function handlerBytesToHex(bytesData) {
        return bytesData.map(function (byte) {
            return ("00" + (byte & 0xff).toString(16)).slice(-2);
        }).join("").toUpperCase();
    };
    function handlerHexToBytes(hexString) {
        var tBytes = [];
        for (i = 0; i <= hexString.length - 2; i += 2) {
            tBytes.push(parseInt(hexString.slice(i, i + 2), 16));
        }
        return tBytes;
    };
    function sumCalculation(tStr) {
        // var tStr = "262500005460";  262500005460FF
        var tInt = 0;
        for (i = 0; i < tStr.length; i += 2) {
            tInt += parseInt(tStr.slice(i, i + 2), 16);
        };
        return ("00" + tInt.toString(16)).toUpperCase().slice(-2); // FF
    };
    function toHexString(tInt, tc) {
        tc = 2;
        return ("0".repeat(tc) + tInt.toString(16)).toUpperCase().slice(-tc); // FF
    };
    function reverseString(tStr) {
        tc = 2;
        if (tStr.length > tc) {
            var tms = ""
            for (i = 0; i < tStr.length; i += tc) {
                tms = tStr.slice(i, i + tc) + tms;
            };
            tStr = tms;
        };
        return tStr // FF
    };
    function handlerDataToSInt(bitLength, fName, bitC) {
        return function (tempStr, sizeEnumObj, tempObjOne) {
            fc = bitLength * 2 + 2;
            var fInt = parseInt(tempStr.slice(2, fc), 16);
            if (fInt > Math.pow(2, (8 * bitC - 1) - 1)) { fInt = fInt - Math.pow(2, 8 * bitC) };
            tempObjOne[fName] = fInt;
            return [tempStr.slice(fc), tempObjOne]
        };
    };
    function hexTobytes(hStr) {
        tc = 2;
        var tBytes = [];
        if (hStr.length > tc) {
            for (i = 0; i < hStr.length; i += tc) {
                tBytes.push(parseInt(hStr.slice(i, i + tc)));
            };
        } else {
            tBytes.push(parseInt(hStr, 16));
        };
        return tBytes // FF
    };
    function getBit(tInt, ec, sc) {
        var eInt = 0
        for (ib = sc; ib < ec + 1; ib += 1) {
            eInt += Math.pow(2, ib);
        };
        return (tInt & eInt) >> sc
    };

    return dataObj;

    
}
