import argparse
import subprocess
import sys
import os
import time
import textwrap
import signal
import shutil

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
        print("No adapter supporting AP and Monitor modes found", file=sys.stderr)
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
    subprocess.run("iw dev ap0 del 2>/dev/null", shell=True)
    subprocess.run("iw dev mon0 del 2>/dev/null", shell=True)
    for name, if_type in backup:
        subprocess.run(f"iw phy {phy_id} interface add {name} type {if_type} 2>/dev/null", shell=True)
        subprocess.run(f"ip link set {name} up 2>/dev/null", shell=True)
        if shutil.which("nmcli"):
            subprocess.run(f"nmcli dev set {name} managed yes 2>/dev/null", shell=True)

if __name__ == "__main__":
    if not shutil.which("iw"):
        print("Error: 'iw' is required but not installed.", file=sys.stderr)
        sys.exit(1)

    parser = argparse.ArgumentParser()
    parser.add_argument("--ssid", required=True, help="Network name (ESSID)")
    parser.add_argument("--channel", type=int, required=True, help="Wi-Fi Channel")
    parser.add_argument("--band", choices=["2.4", "5"], default="2.4", help="Frequency band")
    parser.add_argument("--password", help="WPA2 password (min 8 chars). Leave empty for open network.")
    args = parser.parse_args()

    if args.password and len(args.password) < 8:
        print("Password must be at least 8 characters", file=sys.stderr)
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
    
    subprocess.run(f"iw phy {phy_id} interface add mon0 type monitor", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(f"iw phy {phy_id} interface add ap0 type managed", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    if shutil.which("nmcli"):
        subprocess.run("nmcli dev set ap0 managed no 2>/dev/null", shell=True)
        subprocess.run("nmcli dev set mon0 managed no 2>/dev/null", shell=True)
    
    time.sleep(0.5)
    subprocess.run("ip link set mon0 up 2>/dev/null", shell=True)
    subprocess.run("ip addr flush dev ap0 2>/dev/null", shell=True)
    subprocess.run("ip addr add 10.0.0.1/24 dev ap0", shell=True)
    subprocess.run("ip link set ap0 up", shell=True)

    link_out = subprocess.run("ip link show ap0", shell=True, capture_output=True, text=True)
    if "does not exist" in link_out.stderr:
        print("Interface ap0 was not created successfully.", file=sys.stderr)
        cleanup(phy_id, backup)
        sys.exit(1)

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

    conf_path = "/tmp/hostapd_good_twin.conf"
    with open(conf_path, "w") as f:
        f.write(textwrap.dedent(conf_content).strip())

    def handle_signal(sig, frame):
        sys.exit(0)
        
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    process = subprocess.Popen(["hostapd", conf_path])

    try:
        process.wait()
    except SystemExit:
        process.terminate()
        process.wait()
    finally:
        cleanup(phy_id, backup)