import argparse
import json
import time
import urllib.request
import urllib.error
import sys

try:
    import serial
except ImportError:
    print('Missing dependency: pyserial. Install with: pip install pyserial')
    sys.exit(1)


def parse_line(line):
    line = line.strip()
    if not line:
        return None
    # Accept comma-separated values: weight,stress,tilt,vibration
    parts = [p.strip() for p in line.split(',') if p.strip()]
    if len(parts) < 4:
        return None
    try:
        weight = float(parts[0])
        stress = float(parts[1])
        tilt = float(parts[2])
        vibration = float(parts[3])
    except ValueError:
        return None
    result = {
        'weight': weight,
        'stress': stress,
        'tilt': tilt,
        'vibration': vibration,
    }
    if len(parts) >= 5:
        result['gate_status'] = parts[4]
    if len(parts) >= 6:
        result['system_status'] = parts[5]
    return result


def post_reading(url, payload):
    data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(url, data=data, method='POST')
    request.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            body = response.read().decode('utf-8', errors='replace')
            return response.getcode(), body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode('utf-8', errors='replace')
    except Exception as exc:
        return None, str(exc)


def main():
    parser = argparse.ArgumentParser(description='ESP32 serial bridge to stream.php')
    parser.add_argument('--port', required=True, help='Serial port (e.g. COM3)')
    parser.add_argument('--baud', type=int, default=115200, help='Serial baud rate')
    parser.add_argument('--url', default='http://localhost/smart-bridge-dashboard-main/src/api/stream.php', help='Target stream URL')
    args = parser.parse_args()

    print(f'Opening serial port {args.port} at {args.baud} baud...')
    try:
        ser = serial.Serial(args.port, args.baud, timeout=1)
    except Exception as exc:
        print(f'Failed to open serial port: {exc}')
        sys.exit(1)

    print(f'Reading lines and sending to {args.url}')
    while True:
        try:
            raw_line = ser.readline().decode('utf-8', errors='ignore')
        except Exception as exc:
            print(f'Serial read error: {exc}')
            time.sleep(1)
            continue

        if not raw_line:
            continue

        payload = parse_line(raw_line)
        if payload is None:
            print(f'Skipping invalid line: {raw_line.strip()}')
            continue

        code, body = post_reading(args.url, payload)
        if code is None:
            print(f'POST error: {body}')
            time.sleep(1)
            continue

        print(f'POST {code}: {payload} -> {body}')
        time.sleep(0.2)


if __name__ == '__main__':
    main()
