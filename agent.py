import requests
import psutil
import platform
import time
import json
import socket
import os

# --- CONFIGURATION ---
API_URL = "http://34.133.36.174:8080" # Your Cloud IP
USERNAME = "admin"
PASSWORD = "password"
REPORT_INTERVAL = 10 # Seconds

class MotoAgent:
    def __init__(self):
        self.token = None
        self.user_id = None

    def login(self):
        print(f"[*] Authenticating with {API_URL}...")
        try:
            res = requests.post(f"{API_URL}/login", json={
                "username": USERNAME,
                "password": PASSWORD
            })
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

    def report(self):
        if not self.token:
            if not self.login(): return

        metrics = self.get_system_metrics()
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            res = requests.post(
                f"{API_URL}/agent/report", 
                json={"metrics": metrics}, 
                headers=headers
            )
            if res.status_code == 200:
                print(f"[OK] Reported Stats: CPU {metrics['cpuUsage']:.1%}, RAM Free: {metrics['freeMemory']:.0f}MB / {metrics['totalMemory']:.0f}MB")
            elif res.status_code == 401:
                print("[!] Token expired, re-logging...")
                self.token = None
        except Exception as e:
            print(f"[-] Report failed: {e}")

    def run(self):
        print("=== Moto-Moto Local Agent Started ===")
        print(f"Target Server: {API_URL}")
        while True:
            self.report()
            time.sleep(REPORT_INTERVAL)

if __name__ == "__main__":
    agent = MotoAgent()
    agent.run()
