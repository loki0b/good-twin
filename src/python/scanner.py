import json
import sys
import time
import threading
import subprocess
from scapy.all import sniff, Dot11Beacon, Dot11ProbeResp, Dot11Elt

aps = {}
stop_event = threading.Event()

def setup_interfaces():
    target_mac = "90:de:80:15:22:6e"
    out = subprocess.run(["iw", "dev"], capture_output=True, text=True).stdout
    
    phy_id = None
    current_phy = None
    
    for line in out.splitlines():
        if line.startswith("phy#"):
            current_phy = line.strip().replace("phy#", "")
        if target_mac in line.lower() and current_phy:
            phy_id = current_phy
            break
            
    if not phy_id:
        sys.exit(1)
        
    subprocess.run(f"iw phy phy{phy_id} interface add mon0 type monitor 2>/dev/null", shell=True)
    subprocess.run(f"iw phy phy{phy_id} interface add ap0 type managed 2>/dev/null", shell=True)
    subprocess.run("ip link set mon0 up 2>/dev/null", shell=True)

def get_channel(pkt):
    try:
        el = pkt[Dot11Elt]
        while isinstance(el, Dot11Elt):
            if el.ID == 3: 
                return int(el.info[0])
            el = el.payload
    except:
        pass
    return 0

def packet_handler(pkt):
    if pkt.haslayer(Dot11Beacon) or pkt.haslayer(Dot11ProbeResp):
        bssid = pkt.addr3
        if bssid and bssid not in aps:
            try:
                essid = pkt[Dot11Elt].info.decode()
            except:
                essid = "<HIDDEN>"
            
            channel = get_channel(pkt)
            freq = 2412 + (channel - 1) * 5 if channel > 0 else 0

            aps[bssid] = {
                "bssid": bssid,
                "essid": essid,
                "channel": channel,
                "frequency": freq
            }

def channel_hopper():
    channels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    idx = 0
    while not stop_event.is_set():
        subprocess.run(["iw", "dev", "mon0", "set", "channel", str(channels[idx])], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        idx = (idx + 1) % len(channels)
        time.sleep(0.4) 

if __name__ == "__main__":
    setup_interfaces()
    
    hopper_thread = threading.Thread(target=channel_hopper, daemon=True)
    hopper_thread.start()

    sniff(iface="mon0", prn=packet_handler, timeout=5, store=0)
    
    stop_event.set()

    print(json.dumps(list(aps.values())))