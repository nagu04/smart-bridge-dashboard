import argparse
import json
import socket
import time
import urllib.request
import urllib.error
import sys

def parse_line(line):
    line = line.strip()
    if not line:
        return None
    # Accept your ESP32 wireless comma-separated values: weight,stress,tilt,vibration
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
        with urllib.request.urlopen(request, timeout=5) as response:
            body = response.read().decode('utf-8', errors='replace')
            return response.getcode(), body
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode('utf-8', errors='replace')
    except Exception as exc:
        return None, str(exc)


def main():
    parser = argparse.ArgumentParser(description='ESP32 Wireless UDP Bridge to stream.php')
    parser.add_argument('--ip', default='0.0.0.0', help='IP address to bind the UDP server (0.0.0.0 listens to all interfaces)')
    parser.add_argument('--port', type=int, default=9999, help='UDP Port your laptop listens on (matches remotePort in ESP32 code)')
    # Adjust target dashboard URL if your XAMPP directory folder name matches your README ("Micro Project")
    parser.add_argument('--url', default='http://localhost/Micro%20Project/src/api/stream.php', help='Target stream URL')
    args = parser.parse_args()

    # Create and bind the wireless UDP network socket
    print(f"Opening wireless UDP socket on {args.ip}:{args.port}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.bind((args.ip, args.port))
    except Exception as exc:
        print(f'Failed to bind UDP port: {exc}')
        sys.exit(1)

    print(f'Listening for wireless ESP32 data and sending to {args.url}')
    while True:
        try:
            # Listen for network data packets from your ESP32
            data, addr = sock.recvfrom(1024) 
            raw_line = data.decode('utf-8', errors='ignore')
        except Exception as exc:
            print(f'UDP Network read error: {exc}')
            time.sleep(1)
            continue

        if not raw_line:
            continue

        payload = parse_line(raw_line)
        if payload is None:
            print(f'Skipping invalid packet from {addr}: {raw_line.strip()}')
            continue

        # Forward the data directly to your local PHP/SQL app stack
        code, body = post_reading(args.url, payload)
        if code is None:
            print(f'Dashboard POST error: {body}')
            continue

        print(f'Wireless Data from {addr[0]} -> POST {code}: {payload}')


if __name__ == '__main__':
    main()