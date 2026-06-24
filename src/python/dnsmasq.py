import argparse
import os
import subprocess
import textwrap
import time

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--captive", action="store_true", help="Redirect all DNS traffic to 10.0.0.1")
    args = parser.parse_args()

    conf_path = "/tmp/dnsmasq_good_twin.conf"
    
    conf_content = """
        interface=ap0
        bind-interfaces
        except-interface=lo
        dhcp-range=10.0.0.10,10.0.0.250,12h
        dhcp-option=3,10.0.0.1
        dhcp-option=6,10.0.0.1
        server=8.8.8.8
        log-queries
        log-dhcp
    """
    
    if args.captive:
        conf_content += "address=/#/10.0.0.1\n"

    conf_content = textwrap.dedent(conf_content).strip()

    with open(conf_path, "w") as f:
        f.write(conf_content)

    my_pid = os.getpid()
    try:
        pids = subprocess.check_output(["pidof", "dnsmasq"]).decode().split()
        for pid in pids:
            if int(pid) != my_pid:
                subprocess.run(["kill", "-9", pid])
    except Exception:
        pass

    for _ in range(20):
        if subprocess.run("ip link show ap0", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            break
        time.sleep(0.5)

    os.execvp("dnsmasq", ["dnsmasq", "-C", conf_path, "-d"])