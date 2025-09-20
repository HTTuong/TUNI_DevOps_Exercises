
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
    fs.appendFileSync(filePath, record + '\n');
}

app.get('/status', async (req, res) => {
    try {
        // Step 1: Create Service1 record
        const record1 = createService1Record();
        
        // Step 2: Send to Storage
        await axios.post(STORAGE_URL, record1, {
            headers: {'Content-Type': 'text/plain'}
        });
        
        // Step 3: Write to vStorage
        writeToVStorage(record1);
        
        // Step 4: Forward to Service2
        const response = await axios.get(SERVICE2_URL);
        const record2 = response.data;
        
        // Step 9: Combine and return
        res.type('text/plain').send(`${record1}\n${record2}`);
        
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

app.get('/log', async (req, res) => {
    try {
        // Forward to Storage
        const response = await axios.get(STORAGE_URL);
        res.type('text/plain').send(response.data);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Service1 running on port ${PORT}`);
});
