import os
import requests
import psutil
import platform
import time
import socket
import subprocess
import json

# --- CONFIGURATION ---
API_URL = os.getenv("API_URL", "http://34.133.36.174:8080")
USERNAME = os.getenv("AGENT_USERNAME", "admin")
PASSWORD = os.getenv("AGENT_PASSWORD", "password")
REPORT_INTERVAL = 10 # Seconds

class MotoAgent:
    def __init__(self):
        self.token = None

    def login(self):
        print(f"[*] Authenticating with {API_URL}...")
        try:
            res = requests.post(f"{API_URL}/login", json={
                "username": USERNAME,
                "password": PASSWORD
            }, timeout=10)
            if res.status_code == 200:
                self.token = res.json().get("token")
                print("[+] Login successful!")
                return True
            else:
                print(f"[-] Login failed: {res.status_code} - {res.text}")
                return False
        except Exception as e:
            print(f"[-] Connection error during login: {e}")
            return False

    def get_system_metrics(self):
        try:
            mem = psutil.virtual_memory()
            cpu_usage = psutil.cpu_percent(interval=1) / 100.0
            
            return {
                "cpuUsage": cpu_usage,
                "freeMemory": mem.available / (1024 * 1024),
                "totalMemory": mem.total / (1024 * 1024),
                "hostname": socket.gethostname(),
                "platform": platform.system(),
                "isAgent": True
            }
        except Exception as e:
            print(f"[-] Error collecting metrics: {e}")
            return None

    def run_local_scan(self, target):
        print(f"[*] Starting local network scan on {target}...")
        try:
            cmd = ["nmap", "-sn", "-oX", "-", target]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                print(f"[-] Nmap error: {result.stderr}")
                return None

            print(f"[+] Scan complete. Results collected.")
            return [] # Logic to parse XML could go here
        except FileNotFoundError:
            print("[-] Error: 'nmap' not found. Please install it.")
            return None
        except Exception as e:
            print(f"[-] Scan failed: {e}")
            return None

    def report(self, scan_results=None, scan_target=None):
        if not self.token:
            if not self.login(): return

        metrics = self.get_system_metrics()
        if not metrics: return

        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {"metrics": metrics}
        if scan_results is not None:
            payload["scanResults"] = scan_results
            payload["target"] = scan_target

        try:
            res = requests.post(
                f"{API_URL}/agent/report", 
                json=payload, 
                headers=headers,
                timeout=20 # Increased timeout
            )
            if res.status_code == 200:
                data = res.json()
                print(f"[OK] Reported Stats. RAM Free: {metrics['freeMemory']:.0f}MB")
                
                pending_target = data.get("pendingScan")
                if pending_target:
                    results = self.run_local_scan(pending_target)
                    if results is not None:
                        self.report(scan_results=results, scan_target=pending_target)

            elif res.status_code == 401:
                print("[!] Token expired, re-logging...")
                self.token = None
            else:
                print(f"[-] Report failed with status {res.status_code}: {res.text}")
        except requests.exceptions.Timeout:
            print("[-] Report failed: Connection timed out.")
        except requests.exceptions.ConnectionError as e:
            print(f"[-] Report failed: Connection refused or host unreachable. ({e})")
        except Exception as e:
            print(f"[-] Report failed: {e}")

    def run(self):
        print("=== Moto-Moto Local Agent (V2.1) Started ===")
        print(f"Target Server: {API_URL}")
        while True:
            if not self.token:
                if self.login():
                    time.sleep(5) # Short delay after login
                else:
                    time.sleep(10)
                    continue
            self.report()
            time.sleep(REPORT_INTERVAL)

if __name__ == "__main__":
    agent = MotoAgent()
    agent.run()
