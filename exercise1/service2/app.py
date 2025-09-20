from flask import Flask
import psutil
from datetime import datetime
import requests
import os

app = Flask(__name__)

def create_service2_record():
    timestamp = datetime.utcnow().isoformat() + 'Z'
    uptime = psutil.boot_time()
    current_time = datetime.now().timestamp()
    uptime_hours = (current_time - uptime) / 3600
    disk_usage = psutil.disk_usage('/')
    free_disk_mb = disk_usage.free / (1024 * 1024)
    
    return f"{timestamp}: uptime {uptime_hours:.2f} hours, free disk in root: {free_disk_mb:.2f} MBytes"

def write_to_vstorage(record):
    file_path = '/vstorage/log.txt'
    with open(file_path, 'a') as f:
        f.write(record + '\n')

@app.route('/status', methods=['GET'])
def status():
    try:
        # Step 5: Create Service2 record
        record = create_service2_record()
        
        # Step 6: Send to Storage
        storage_url = 'http://storage:3002/log'
        requests.post(storage_url, data=record, headers={'Content-Type': 'text/plain'})
        
        # Step 7: Write to vStorage
        write_to_vstorage(record)
        
        # Step 8: Return response
        return record, 200, {'Content-Type': 'text/plain'}
        
    except Exception as e:
        return str(e), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)
