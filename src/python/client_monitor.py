import subprocess
import json
import re

def get_clients():
    try:
        iw_out = subprocess.check_output(["iw", "dev", "ap0", "station", "dump"], stderr=subprocess.STDOUT).decode()
    except subprocess.CalledProcessError:
        return []

    try:
        arp_out = subprocess.check_output(["ip", "neigh", "show", "dev", "ap0"], stderr=subprocess.STDOUT).decode()
    except subprocess.CalledProcessError:
        arp_out = ""
        
    arp_map = {}
    for line in arp_out.splitlines():
        parts = line.split()
        if "lladdr" in parts:
            idx = parts.index("lladdr")
            if idx + 1 < len(parts):
                ip = parts[0]
                mac = parts[idx + 1].lower()
                arp_map[mac] = ip

    clients = []
    index = 0

    for line in iw_out.splitlines():
        mac_match = re.search(r"Station ([0-9a-fA-F:]+) \(on", line)
        if mac_match:
            mac = mac_match.group(1).lower()
            clients.append({
                "index": index,
                "mac": mac,
                "ip": arp_map.get(mac, "Unknown")
            })
            index += 1

    return clients

if __name__ == "__main__":
    print(json.dumps(get_clients()))