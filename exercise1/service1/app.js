
import { PORT, SERVICE2_URL, STORAGE_URL } from './constants.js';

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const os = require('os');

const app = express();


// Create status record for Service1
function createService1Record() {
    const timestamp = new Date().toISOString();
    const uptime = (os.uptime() / 3600).toFixed(2);
    const freeDisk = (os.freemem() / (1024 * 1024)).toFixed(2);
    
    return `${timestamp}: uptime ${uptime} hours, free disk in root: ${freeDisk} MBytes`;
}

// Write to vStorage volume
function writeToVStorage(record) {
    const filePath = '/vstorage/log.txt';
    try {
        fs.appendFileSync(filePath, record + '\n');
    } catch (error) {
        console.error('Error writing to vstorage:', error);
    }
}

app.get('/status', async (req, res) => {
    try {
        // Step 1: Create Service1 record
        const record1 = createService1Record();
        console.log('Service1 record:', record1);
        
        // Step 2: Send to Storage
        try {
            await axios.post(STORAGE_URL, record1, {
                headers: {'Content-Type': 'text/plain'},
                timeout: 5000
            });
        } catch (storageError) {
            console.error('Error sending to storage:', storageError.message);
        }
        
        // Step 3: Write to vStorage
        writeToVStorage(record1);
        
        // Step 4: Forward to Service2 with error handling
        let record2;
        try {
            const response = await axios.get(SERVICE2_URL, {timeout: 5000});
            record2 = response.data;
        } catch (service2Error) {
            console.error('Error calling Service2:', service2Error.message);
            record2 = 'Service2 unavailable';
        }
        
        // Step 9: Combine and return
        res.type('text/plain').send(`${record1}\n${record2}`);
        
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Error: ' + error.message);
    }
});

app.get('/log', async (req, res) => {
    try {
        // Forward to Storage
        const response = await axios.get(STORAGE_URL, {timeout: 5000});
        res.type('text/plain').send(response.data);
    } catch (error) {
        console.error('Error getting log:', error);
        res.status(500).send('Error retrieving log');
    }
});

app.listen(PORT, () => {
    console.log(`Service1 running on port ${PORT}`);
});