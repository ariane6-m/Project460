import requests
import psutil
import platform
import time
import socket
import subprocess
import json

# --- CONFIGURATION ---
API_URL = "http://34.133.36.174:8080" # Your Cloud IP
USERNAME = "admin"
PASSWORD = "password"
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
                print(f"[-] Login failed: {res.text}")
                return False
        except Exception as e:
            print(f"[-] Connection error: {e}")
            return False

    def get_system_metrics(self):
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

    def run_local_scan(self, target):
        print(f"[*] Starting local network scan on {target}...")
        # Note: This requires 'nmap' to be installed on your 1TB computer
        try:
            # -F for fast scan, -sn for ping scan (faster), -oX - for XML output
            cmd = ["nmap", "-sn", "-oX", "-", target]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"[-] Nmap error: {result.stderr}")
                return None

            # We'll use a simple parser or just send the raw results if needed
            # For simplicity, we'll just report that we found devices for now
            # In a real app, we'd parse the XML like we do in the API
            print(f"[+] Scan complete. Sending results back to server.")
            return [] # In a real implementation, parse XML to list of dicts
        except FileNotFoundError:
            print("[-] Error: 'nmap' not found on this computer. Please install it.")
            return None
        except Exception as e:
            print(f"[-] Scan failed: {e}")
            return None

    def report(self, scan_results=None, scan_target=None):
        if not self.token:
            if not self.login(): return

        metrics = self.get_system_metrics()
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
                timeout=15
            )
            if res.status_code == 200:
                data = res.json()
                print(f"[OK] Reported Stats. RAM Free: {metrics['freeMemory']:.0f}MB")
                
                # Check if server wants us to run a scan
                pending_target = data.get("pendingScan")
                if pending_target:
                    results = self.run_local_scan(pending_target)
                    if results is not None:
                        # Immediately report scan results back
                        self.report(scan_results=results, scan_target=pending_target)

            elif res.status_code == 401:
                print("[!] Token expired, re-logging...")
                self.token = None
        except Exception as e:
            print(f"[-] Report failed: {e}")

    def run(self):
        print("=== Moto-Moto Local Agent (V2) Started ===")
        print(f"Target Server: {API_URL}")
        while True:
            self.report()
            time.sleep(REPORT_INTERVAL)

if __name__ == "__main__":
    agent = MotoAgent()
    agent.run()
