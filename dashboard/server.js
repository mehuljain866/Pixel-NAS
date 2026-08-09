const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Serve the Next.js static export
app.use(express.static(path.join(__dirname, 'out')));

// Cache to hold the last fetched telemetry data
let lastData = {
    status: 'idle',
    batteryLevel: 0,
    isCharging: false,
    storageUsedGB: 0,
    storageTotalGB: 128, // Default for Pixel 1 128GB
    lastUpdated: new Date().toISOString()
};

// Function to run shell commands in Termux
const runCommand = (command) => {
    return new Promise((resolve) => {
        exec(command, (error, stdout) => {
            if (error) {
                resolve('');
                return;
            }
            resolve(stdout.trim());
        });
    });
};

// Background task to update telemetry every 5 seconds
const fetchTelemetry = async () => {
    try {
        // 1. Battery Check using Termux API or dumpsys
        // termux-battery-status or dumpsys battery
        const batteryOutput = await runCommand('termux-battery-status');
        if (batteryOutput) {
            try {
                const batt = JSON.parse(batteryOutput);
                lastData.batteryLevel = batt.percentage || lastData.batteryLevel;
                lastData.isCharging = batt.status === 'CHARGING' || batt.status === 'FULL';
            } catch(e) {}
        } else {
            // Fallback to dumpsys if termux-api isn't installed/working
            const dump = await runCommand('dumpsys battery');
            const levelMatch = dump.match(/level: (\d+)/);
            const statusMatch = dump.match(/status: (\d+)/); // 2 is charging
            if (levelMatch) lastData.batteryLevel = parseInt(levelMatch[1], 10);
            if (statusMatch) lastData.isCharging = statusMatch[1] === '2';
        }

        // 2. Storage Check (df)
        const dfOutput = await runCommand('df /sdcard | tail -1');
        const dfParts = dfOutput.replace(/\s+/g, ' ').split(' ');
        if (dfParts.length >= 4) {
            // df outputs 1K-blocks by default. We want GB.
            const total = parseInt(dfParts[1], 10) / 1024 / 1024;
            const used = parseInt(dfParts[2], 10) / 1024 / 1024;
            lastData.storageTotalGB = Math.round(total);
            lastData.storageUsedGB = parseFloat(used.toFixed(1));
        }

        // 3. Backup Status (Improved Heuristics)
        // Since notifications are unreliable, we check for actual background upload service activity
        // We look for Google Photos processes, specifically if they are actively doing background work.
        // We will run a few checks:
        // A. Is Resilio Sync actively receiving files?
        const resilioOutput = await runCommand('top -n 1 -m 15 | grep com.resilio.sync');
        let isSyncing = !!resilioOutput;
        
        // B. Is Google Photos actively uploading? 
        // We check if the upload service is active or if there are recent upload logs.
        // NOTE: For logcat to work, you must run: adb shell pm grant com.termux android.permission.READ_LOGS
        const logcatOutput = await runCommand('logcat -d -t 100 -s "MediaUploader","UploadTracker","Photos" | grep -i "upload"');
        const photosTopOutput = await runCommand('top -n 1 -m 15 | grep com.google.android.apps.photos');
        
        let isUploading = false;
        if (logcatOutput && logcatOutput.trim().length > 0) {
            isUploading = true;
        } else if (photosTopOutput) {
            // Fallback: if it's heavily using CPU, it might be uploading
            isUploading = true; 
        }

        if (isUploading) {
            lastData.status = 'uploading';
        } else if (isSyncing) {
            lastData.status = 'syncing';
        } else {
            lastData.status = 'idle';
        }

        // 4. Storage Auto-Kill Switch (The 55GB Limit)
        // If storage goes above 55GB, we ping MacroDroid to kill Resilio Sync.
        if (lastData.storageUsedGB >= 55 && lastData.status !== 'storage_full') {
            console.log("CRITICAL: Storage exceeded 55GB. Triggering MacroDroid to STOP Resilio Sync.");
            try {
                // Hitting local MacroDroid webhook
                await fetch('http://localhost:5000/webhook/stop-resilio').catch(() => {});
            } catch(e) {}
            lastData.status = 'storage_full';
        }

        // We removed the auto-restart webhook here because the user relies on
        // existing MacroDroid hooks (like charger plug-in or Google Photos notifications)
        // to handle the restart logic natively.
        if (lastData.storageUsedGB < 50 && lastData.status === 'storage_full') {
            // Just clear the status so it can trigger the kill switch again next time it fills up
            lastData.status = 'idle'; 
        }

        lastData.lastUpdated = new Date().toISOString();
    } catch (e) {
        console.error("Error fetching telemetry:", e);
    }
};

// Poll in the background every 5 seconds
setInterval(fetchTelemetry, 5000);
// Initial fetch
fetchTelemetry();

// API endpoint that the PWA will hit
app.get('/api/status', (req, res) => {
    // Instantly return the cached background data (no delay!)
    res.json(lastData);
});

// Fallback for PWA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, () => {
    console.log(\`Pixel-NAS On-Demand Server running at http://localhost:\${PORT}\`);
    console.log(\`Serving static dashboard from ./out\`);
});
