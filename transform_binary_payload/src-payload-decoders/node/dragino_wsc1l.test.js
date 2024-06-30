// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// Permission is hereby granted, free of charge, to any person obtaining a copy of this
// software and associated documentation files (the "Software"), to deal in the Software
// without restriction, including without limitation the rights to use, copy, modify,
// merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
// PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const DECODER_NAME = "dragino_wsc1l"
const decoder = require("./" + DECODER_NAME)
test_definition = [
    {
        "description": "Test 1",
        "input": Uint8Array.from(Buffer.from("AQMAAAACAwslDQMCACkEAQAFAgIEBgIAigcCA7EIAh4mCQIAYgoCAGgLAgCFDQIAFA==", 'base64')),
        "fport": 2,
        "expected_output": {
                    "wind_speed": 0,
                    "wind_speed_level": 0,
                    "wind_direction_angle": 285.3,
                    "wind_direction": "WNW",
                    "illumination": 410,
                    "rain_snow": 0,
                    "CO2": 516,
                    "TEM": 13.8,
                    "HUM": 94.5,
                    "pressure": 771.8,
                    "rain_gauge": 9.8,
                    "PM2_5": 104,
                    "PM10": 133,
                    "TSR": 2

        }
    }
]


for (var i = 0; i < test_definition.length; i++) {
    test_event = test_definition[i];
   // console.log(test_event);
    actual_output = decoder.decodeUplink({
        "bytes": test_event.input,
        "fPort": test_event.fport
    })
    console.log(actual_output);
    console.log("Running test " + test_event.description)
    console.log("------------------------------------------")
    for (var key in test_event.expected_output) {
        if (typeof (test_event.expected_output[key]) != typeof (actual_output.data[key])) {
            console.log("ERROR: type missmatch for attribute " + key + ": expected " + typeof (test_event.expected_output[key]) + " but received " + typeof (actual_output.data[key]) + ". Dump of actual output:" + JSON.stringify(actual_output.data) + ", dump of expected output: " + JSON.stringify(test_event.expected_output))

        }
        else if (test_event.expected_output[key] == actual_output.data[key]) {
            console.log("OK: attribute " + key + " has an expected value of " + actual_output.data[key])
        } else {
            console.log("ERROR: for attribute " + key + ": expected " + test_event.expected_output[key] + " but received " + actual_output.data[key] + ". Dump of actual output:" + JSON.stringify(actual_output.data) + ", dump of expected output: " + JSON.stringify(test_event.expected_output))
        }

    }

}
