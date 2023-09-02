import json

def zxc(num):
    if int(num) < 10:
        num = '0' + num
    return num

def decode(fPort, bytes, variables):
    if fPort == 2 and bytes[0] < 0xE0:
        direction = {
            0: "N", 1: "NNE", 2: "NE", 3: "ENE", 4: "E", 5: "ESE", 6: "SE", 7: "SSE",
            8: "S", 9: "SSW", 10: "SW", 11: "WSW", 12: "W", 13: "WNW", 14: "NW", 15: "NNW"
        }
        dic = {}
        sensor = [
            "bat", "wind_speed", "wind_direction_angle", "illumination",
            "rain_snow", "CO2", "TEM", "HUM", "pressure",
            "rain_gauge", "PM2_5", "PM10", "PAR", "TSR", "SHT31_TEM", "SHT31_HUM"
        ]
        sensor_diy = ["A1", "A2", "A3", "A4"]
        algorithm = [
            0x03, 0x01, 0x01, 0x11,
            0x20, 0x20, 0x01, 0x01, 0x01,
            0x01, 0x20, 0x20, 0x20, 0x01, 0x0A, 0x0A
        ]
        i = 0
        while i < len(bytes):
            sensor_type = bytes[i]
            len_bytes = bytes[i + 1]
            if sensor_type < 0xA1:
                operation = algorithm[sensor_type] >> 4
                count = algorithm[sensor_type] & 0x0F
                
                if operation == 0:
                    if sensor_type == 0x06 or sensor_type == 0x0E:  # TEM
                        if bytes[i + 2] & 0x80:
                            dic[sensor[sensor_type]] = (((bytes[i + 2] << 8) | bytes[i + 3]) - 0xFFFF) / (count * 10.0)  # < 0
                        else:
                            dic[sensor[sensor_type]] = ((bytes[i + 2] << 8) | bytes[i + 3]) / (count * 10.0)
                    else:
                        dic[sensor[sensor_type]] = ((bytes[i + 2] << 8) | bytes[i + 3]) / (count * 10.0)
                    
                    # Handling non-finite values
                    if not isfinite(dic[sensor[sensor_type]]):
                        dic[sensor[sensor_type]] = None

                    # Handling specific values
                    if dic[sensor[1]] == 20:
                        dic[sensor[sensor_type]] = "No sensor"

                    # More specific value handling can be added here

                elif operation == 1:
                    dic[sensor[sensor_type]] = ((bytes[i + 2] << 8) | bytes[i + 3]) * (count * 10)
                else:
                    if sensor_type == 0x04:  # RAIN_SNOW
                        dic[sensor[sensor_type]] = bytes[i + 2]
                    else:
                        dic[sensor[sensor_type]] = (bytes[i + 2] << 8) | bytes[i + 3]

                    # Handling non-finite values
                    if not isfinite(dic[sensor[sensor_type]]):
                        dic[sensor[sensor_type]] = None

            else:
                dic[sensor_diy[bytes[i] - 0xA1]] = (bytes[i + 2] << 8) | bytes[i + 3]

                # Handling non-finite values
                if not isfinite(dic[sensor_diy[bytes[i] - 0xA1]]):
                    dic[sensor_diy[bytes[i] - 0xA1]] = None

            i = i + 2 + len_bytes

        return dic

def decodeUplink(input):
    return { 
        "data": decode(input["fPort"], input["bytes"], input["variables"])
    }

def decodeFrequency(fPort, bytes):
    frequency = {
        1: "EU868", 2: "US915", 3: "IN865", 4: "AU915", 5: "KZ865", 6: "RU864",
        7: "AS923", 8: "AS923-1", 9: "AS923-2", 10: "AS923-3"
    }
    info = {}
    node = bytes[0]
    if node == 13:
        info["node"] = "WSC1-L"
    version1 = bytes[1]
    version2 = bytes[2] >> 4
    version3 = bytes[2] & 0x0f
    info["version"] = "V" + "." + str(version1) + "." + str(version2) + "." + str(version3)
    values = bytes[3]
    info["frequency_band"] = frequency[values]
    info["sub_band"] = bytes[4]
    info["bat"] = (bytes[5] << 8 | bytes[6]) / 1000
    info["weather_sensor_types"] = bytes[7].to_bytes(2, byteorder="big").hex() + zxc(hex(bytes[8])) + bytes[9].to_bytes(2, byteorder="big").hex()

    return info

# ... (The rest of the code remains the same)
