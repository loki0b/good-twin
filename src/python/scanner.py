import json
import sys
import time
import threading
import subprocess
import signal
import shutil
from scapy.all import sniff, Dot11Beacon, Dot11ProbeResp, Dot11Elt, conf

aps = {}
stop_event = threading.Event()

def get_capable_phy_and_backup():
    out_phy = subprocess.run(["iw", "phy"], capture_output=True, text=True).stdout
    phy_id = None
    current_phy = None
    modes = []
    
    for line in out_phy.splitlines():
        line = line.strip()
        if line.startswith("Wiphy"):
            if current_phy and "AP" in modes and "monitor" in modes:
                phy_id = current_phy
                break
            current_phy = line.split()[1]
            modes = []
        elif current_phy and line.startswith("*"):
            modes.append(line.replace("* ", ""))
    
    if not phy_id and current_phy and "AP" in modes and "monitor" in modes:
        phy_id = current_phy
        
    if not phy_id:
        sys.exit(1)
        
    out_dev = subprocess.run(["iw", "dev"], capture_output=True, text=True).stdout
    backup = []
    current_dev_phy = None
    iface_name = None
    
    for line in out_dev.splitlines():
        line = line.strip()
        if line.startswith("phy#"):
            current_dev_phy = "phy" + line.replace("phy#", "")
        elif current_dev_phy == phy_id and line.startswith("Interface"):
            iface_name = line.split()[1]
        elif current_dev_phy == phy_id and line.startswith("type") and iface_name:
            backup.append((iface_name, line.split()[1]))
            iface_name = None
            
    return phy_id, backup

def cleanup(phy_id, backup):
    subprocess.run("iw dev mon0 del 2>/dev/null", shell=True)
    for name, if_type in backup:
        subprocess.run(f"iw phy {phy_id} interface add {name} type {if_type} 2>/dev/null", shell=True)
        subprocess.run(f"ip link set {name} up 2>/dev/null", shell=True)
        if shutil.which("nmcli"):
            subprocess.run(f"nmcli dev set {name} managed yes 2>/dev/null", shell=True)

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
    if not shutil.which("iw"):
        sys.exit(1)

    if shutil.which("rfkill"):
        subprocess.run("rfkill unblock wifi", shell=True)
        time.sleep(0.5)
        
    phy_id, backup = get_capable_phy_and_backup()

    for name, _ in backup:
        if shutil.which("nmcli"):
            subprocess.run(f"nmcli dev set {name} managed no 2>/dev/null", shell=True)
            
        if shutil.which("wpa_cli"):
            try:
                subprocess.run(f"wpa_cli -i {name} terminate", shell=True, timeout=1, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except subprocess.TimeoutExpired:
                pass
        
        if shutil.which("wpa_supplicant"):
            try:
                ps_out = subprocess.check_output(["ps", "-e", "-o", "pid,args"]).decode()
                for line in ps_out.splitlines():
                    if "wpa_supplicant" in line and name in line:
                        pid = line.strip().split()[0]
                        subprocess.run(["kill", "-9", pid])
            except Exception:
                pass

        subprocess.run(f"ip link set {name} down 2>/dev/null", shell=True)
        subprocess.run(f"iw dev {name} del 2>/dev/null", shell=True)

    time.sleep(1)
    
    res = subprocess.run(f"iw phy {phy_id} interface add mon0 type monitor", shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        cleanup(phy_id, backup)
        sys.exit(1)
    
    if shutil.which("nmcli"):
        subprocess.run("nmcli dev set mon0 managed no 2>/dev/null", shell=True)
        
    subprocess.run("ip link set mon0 up 2>/dev/null", shell=True)
    
    link_out = subprocess.run("ip link show mon0", shell=True, capture_output=True, text=True)
    if "does not exist" in link_out.stderr:
        cleanup(phy_id, backup)
        sys.exit(1)
    
    time.sleep(1)
    
    hopper_thread = threading.Thread(target=channel_hopper, daemon=True)
    hopper_thread.start()

    def handle_signal(sig, frame):
        stop_event.set()
        cleanup(phy_id, backup)
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    try:
        conf.ifaces.reload()
        sniff(iface="mon0", prn=packet_handler, timeout=1, store=0, monitor=True)
    except Exception as e:
        print(f"Scapy error: {str(e)}", file=sys.stderr)
    finally:
        stop_event.set()
        cleanup(phy_id, backup)
        print(json.dumps(list(aps.values())))