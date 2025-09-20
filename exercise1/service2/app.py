from flask import Flask
from datetime import datetime
import requests
import os
import subprocess
import time

app = Flask(__name__)

def get_container_uptime():
    """
    Simple uptime using /proc/uptime only
    """
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
        return uptime_seconds
    except:
        # Fallback: use a reasonable default
        return 3600  # 1 hour as fallback

def get_disk_space():
    """
    Get free disk space using df command
    """
    try:
        result = subprocess.run(
            ['df', '/', '--block-size=1M'], 
            capture_output=True, 
            text=True, 
            timeout=5
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 4:
                    return int(parts[3])
        return 0
    except:
        return 0

def create_service2_record():
    timestamp = datetime.utcnow().isoformat() + 'Z'
    uptime_seconds = get_container_uptime()
    uptime_hours = uptime_seconds / 3600.0
    free_disk_mb = get_disk_space()
    
    return f"{timestamp}: uptime {uptime_hours:.2f} hours, free disk in root: {free_disk_mb} MBytes"

def write_to_vstorage(record):
    file_path = '/vstorage/log.txt'
    try:
        with open(file_path, 'a') as f:
            f.write(record + '\n')
    except:
        pass

@app.route('/status', methods=['GET'])
def status():
    try:
        record = create_service2_record()
        
        # Send to Storage
        try:
            requests.post('http://storage:3002/log', data=record, 
                         headers={'Content-Type': 'text/plain'}, timeout=5)
        except:
            pass
        
        # Write to vStorage
        write_to_vstorage(record)
        
        return record, 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)