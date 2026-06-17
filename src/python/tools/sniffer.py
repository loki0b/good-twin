import sys
import json
from scapy.all import sniff, Dot11, Dot11Beacon, Dot11Elt

networks = {}

def packet_handler(packet):
    if len(networks) >= 5:
        return

    if packet.haslayer(Dot11Beacon):
        bssid = packet[Dot11].addr3
        
        if bssid not in networks:
            essid = "Hidden"
            if packet.info:
                essid = packet.info.decode("utf-8", "ignore") or "Hidden"

            channel = 0
            elt = packet[Dot11Elt]
            while isinstance(elt, Dot11Elt):
                if elt.ID == 3:
                    channel = int.from_bytes(elt.info, byteorder='little')
                    break
                elt = elt.payload

            freq = 0
            if channel > 0:
                if channel <= 14:
                    freq = 2407 + (channel * 5)
                    if channel == 14: freq = 2484
                else:
                    freq = 5000 + (channel * 5)

            networks[bssid] = {
                "essid": essid,
                "mac": bssid,
                "bssid": bssid,
                "channel": channel,
                "frequency": freq
            }