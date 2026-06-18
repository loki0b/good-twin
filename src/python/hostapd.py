import argparse
import subprocess
import sys
import os
import time
import textwrap

def setup_interfaces():
    target_mac = "90:de:80:15:22:6e"
    
    subprocess.run("rfkill unblock wifi", shell=True)
    
    out = subprocess.run(["iw", "dev"], capture_output=True, text=True).stdout
    
    phy_id = None
    current_phy = None
    interfaces_to_delete = []
    
    for line in out.splitlines():
        if line.startswith("phy#"):
            current_phy = line.strip().replace("phy#", "")
        if "Interface " in line and current_phy:
            iface = line.split("Interface ")[1].strip()
            interfaces_to_delete.append((current_phy, iface))
        if target_mac in line.lower() and current_phy:
            phy_id = current_phy
            
    if not phy_id:
        print("Adapter not found", file=sys.stderr)
        sys.exit(1)
        
    for phy, iface in interfaces_to_delete:
        if phy == phy_id:
            subprocess.run(f"nmcli dev set {iface} managed no 2>/dev/null", shell=True)
            subprocess.run(f"ip link set {iface} down 2>/dev/null", shell=True)
            subprocess.run(f"iw dev {iface} del 2>/dev/null", shell=True)
            
    time.sleep(0.5)
    
    subprocess.run(f"iw phy phy{phy_id} interface add mon0 type monitor", shell=True)
    subprocess.run(f"iw phy phy{phy_id} interface add ap0 type managed", shell=True)
    
    subprocess.run("nmcli dev set ap0 managed no 2>/dev/null", shell=True)
    subprocess.run("nmcli dev set mon0 managed no 2>/dev/null", shell=True)
    
    time.sleep(0.5)
    subprocess.run("ip link set mon0 up 2>/dev/null", shell=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ssid", required=True, help="Network name (ESSID)")
    parser.add_argument("--channel", type=int, required=True, help="Wi-Fi Channel")
    parser.add_argument("--band", choices=["2.4", "5"], default="2.4", help="Frequency band")
    parser.add_argument("--password", help="WPA2 password (min 8 chars). Leave empty for open network.")
    args = parser.parse_args()

    if args.password and len(args.password) < 8:
        print("Password must be at least 8 characters", file=sys.stderr)
        sys.exit(1)

    setup_interfaces()

    subprocess.run("ip addr flush dev ap0 2>/dev/null", shell=True)
    subprocess.run("ip addr add 10.0.0.1/24 dev ap0", shell=True)
    subprocess.run("ip link set ap0 up", shell=True)

    hw_mode = "a" if args.band == "5" else "g"

    conf_content = f"""
        interface=ap0
        driver=nl80211
        ssid={args.ssid}
        channel={args.channel}
        hw_mode={hw_mode}
        macaddr_acl=0
        auth_algs=1
        ignore_broadcast_ssid=0
    """

    if args.password:
        conf_content += f"""
            wpa=2
            wpa_passphrase={args.password}
            wpa_key_mgmt=WPA-PSK
            rsn_pairwise=CCMP
        """

    conf_content = textwrap.dedent(conf_content).strip()

    conf_path = "/tmp/hostapd_good_twin.conf"
    with open(conf_path, "w") as f:
        f.write(conf_content)

    time.sleep(0.5)
    os.execvp("hostapd", ["hostapd", conf_path])