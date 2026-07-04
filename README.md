# Pixel-NAS

**A fully automated, zero-subscription, End-to-End Encrypted (E2E) cloud backup pipeline built from a salvaged Android phone.**

Pixel-NAS transforms a legacy Google Pixel device into an always-on, invisible backup node. It silently syncs photos, videos, and files from your daily devices directly to Google Photos' infinite cloud storage—for free. No monthly subscriptions, no expensive NAS hardware, and zero manual maintenance.

*Currently managing a pipeline of **~80,000 photos and videos (~1.5 TB)** across multiple devices seamlessly.*

---

## The Philosophy & Evolution

This project was born out of frustration. Our digital memories were scattered across old phones, SD cards, and hard drives, creating an unmanageable mess that was vulnerable to hardware failure. While cloud storage solves this, paying a permanent monthly rent to keep memories alive felt flawed.

### The Journey
* **V1 (The Cumbersome Phase):** Started with a salvaged Pixel 2 XL. Backing up meant connecting a phone to a laptop, moving files manually, trickling them down to the Pixel, and dealing with crashes when the storage filled up. It was essentially an "expensive paperweight."
* **V2 (The Automation Phase):** We introduced a fluid system using Resilio Sync over Wi-Fi. This proved the concept by effortlessly backing up 80GB of 4K drone/camera footage without any cables.
* **V3 (The Intervention-Free Phase):** The current architecture. Leveraging Smart Home integrations, geofencing, and advanced automation, the system now runs perpetually without any human intervention. Data flows like a self-cleaning pipe.

---

## How It Works (The Architecture)

This system acts as a **digital funnel**. Your modern phone (iPhone/Android) or tablet securely pours data into the "Pixel Funnel" over your local Wi-Fi. The Pixel then "spoofs" the source of the data, allowing it to flow into the infinite ocean of Google Photos using its legacy unlimited backup benefit.

1. **Secure Transfer:** Your phone's camera roll syncs to the Pixel via **Resilio Sync** (an End-to-End Encrypted, P2P protocol that eliminates the need to build a custom solution).
2. **Infinite Cloud:** Google Photos on the Pixel detects the new files and uploads them in the background.
3. **Auto-Purging (The Self-Cleaning Pipe):** The Pixel's internal storage (64GB/128GB) acts as a temporary buffer. Older, already-backed-up files are overwritten as new ones arrive. It never fills up.
4. **Passive Confirmation:** Real-time push notifications alert your main device when a batch finishes uploading via Google Photos Partner Sharing.

### The Pipeline Flowchart

```text
[ 📱 Main Phone / 💻 PC ]
          │
          │ (1. New media captured)
          ▼
          ├─► [ ⚡ Optional: Geofencing/Wi-Fi/Voice triggers Smart Plug to power Pixel-NAS ]
          │
          │ (2. Wi-Fi / Resilio Sync E2E Transfer)
          ▼
[ 📱 Pixel-NAS Internal Buffer (64GB/128GB) ]
          │
          │ (3. Google Photos App detects new media)
          ▼
[ ☁️ Google Photos Cloud (Unlimited Upload) ]
          │
          │ (4. Upload finishes)
          ├─► [ 🗑️ Pixel Auto-purges buffer to free space ]
          │
          │ (5. Partner Sharing Notification)
          ▼
[ 📱 Main Phone ] (Receives notification that backup is complete)
```


---

## Performance & Speeds

Through rigorous pipeline optimization, wireless syncing is now effectively as fast as a wired connection.

* **Average Speeds:** 30 Mbps to 70 Mbps.
* **Peak Speeds:** Up to 150 Mbps.

### How to Achieve 150 Mbps:
1. **5GHz Wi-Fi:** Both the source device and the Pixel-NAS must be connected to a clean 5GHz network.
2. **Direct Connection:** Ensure Resilio Sync is using "LAN Sync" and a direct P2P connection (no relay servers).
3. **Advanced Tweaks:** For trusted local networks, disabling `lan_encrypt_data` in Resilio's advanced settings reduces CPU overhead, allowing the devices to focus purely on disk I/O and transfer speed.

---

## Automation & Smart Home Triggers (V3)

The beauty of V3 is that the Pixel-NAS only works when it needs to. Using Smart Plugs and Automation apps, we control the power and sync cycles dynamically.

### 1. Geofencing (Samsung Routines / Apple Shortcuts)
When you enter a ~15-meter radius of your home, a location-based routine triggers your Smart Plug to turn on. The Pixel receives power, wakes up, and immediately begins pulling the day's photos over Wi-Fi. No manual tapping required.

### 2. Wi-Fi Triggers (MacroDroid)
Using an automation app like **MacroDroid**, you can configure the Pixel to force-launch the sync protocol the exact moment it detects your home Wi-Fi SSID, ensuring background processes haven't put Resilio Sync to sleep.

### 3. Voice & Remote Triggers (Alexa / Google Home)
If a sync stalls, or if you need to force a backup remotely, you can map the smart plug to a voice command (e.g., *"Alexa, turn on Pixel NAS"*). Because the plug is connected to your smart home ecosystem, you can trigger backups from anywhere in the world.

### 4. Hardware Battery Management
Leaving a phone plugged in 24/7 destroys the battery. V3 uses a **5W (1A) charger** routed through a **4-port USB hub**. The hub acts as a resistor, creating a permanent "Charging Slowly" state. The battery stabilizes at ~45-50% and holds there indefinitely without heat cycles or swelling.

---

## Hardware Bill of Materials

### 📱 Choosing the Right Pixel (Which generation to buy?)
If you are buying a device specifically for this project, the most straightforward and highly recommended option is the **Google Pixel 1 (128 GB)**. The 128GB model gives you a massive internal buffer to prevent "Storage Full" bottlenecks during large bulk uploads, and the Pixel 1 is the *only* generation that retains **Original Quality** backup for life.

Here is the exact breakdown of Google's legacy backup policies across generations:
*   **Pixel 1 (2016):** Unlimited backup at **Original Quality** (Uncompressed), forever. *(The Holy Grail).*
*   **Pixel 2 (2017) & Pixel 3 (2018):** Their Original Quality promo expired. They now offer unlimited backup at **Storage Saver (High) Quality** for life.
*   **Pixel 3a, 4, 4a, 5:** Unlimited backup at **Storage Saver (High) Quality** for life.
*   **Pixel 5a & newer (6, 7, 8, etc.):** No unlimited backup benefit. Do not buy these for this project.

### 🛠️ Hardware List

| Component | Recommendation | Purpose |
|---|---|---|
| **Google Pixel** | **Pixel 1 (128GB)** | The ultimate backup engine (Original Quality for life). |
| **Power Supply** | 5W (1A) Charger | Low-wattage charging for battery stability. |
| **Resistance Hub** | 4-Port USB Hub | Adds electrical resistance for trickle charging. |
| **Smart Plug** | Google Home/Alexa compatible | Required for Geofencing & Voice triggers. |
| **Cooling** | Aluminum Foil | A passive heat sink across the back glass for massive 80GB+ bulk uploads. |

*Estimated cost from scratch: $15–$30 (mostly the smart plug). The Pixel itself can often be sourced for $30-$50 on eBay or salvaged for free.*

---

## Setup Guide

**1. Prepare the Device**
Factory reset the Pixel. Use Android Universal Debloater (ADB) to remove all bloatware, maximizing the internal storage buffer and freeing up CPU cycles.

**2. Configure Google Photos**
Log in with a dedicated backup account. Enable backup for all folders that Resilio will sync. Turn on the 30-day auto-purge for the trash.

**3. Setup Resilio Sync**
Install Resilio on both devices. Link your Camera folder. **Disable Selective Sync** so files move instantly. (Enable LAN Sync for maximum speeds).

**4. The Hardware Hack**
Connect: Wall Outlet → Smart Plug → 5W Charger → USB Hub → Pixel. Verify it says "Charging Slowly." 

**5. Set up Automations**
Use Samsung Routines, Apple Shortcuts, or MacroDroid to create a trigger: `IF Location = Home -> THEN Turn On Smart Plug`.

**6. Setup Partner Sharing (For Notifications)**
To get push notifications and access on your main phone whenever the Pixel finishes an upload:
* On the **Pixel NAS** (which should be logged into a secondary, dedicated backup Google account), open Google Photos.
* Go to **Photos Settings > Sharing > Partner Sharing**.
* Invite your **Main Google Account** (the one you use on your daily driver phone) and choose to share "All photos".
* On your **Main Phone**, accept the invitation.
* *Note: While Google Photos doesn't always send a loud system push notification for every single photo sync, new backups will automatically populate in your main phone's "Sharing" tab. Ensure notifications for Google Photos are enabled in your main phone's system settings to catch any batch update alerts.*

---

## Advanced: Arbitrary File Backup (BitStream)

Pixel-NAS handles media natively. For documents, code, and zip files, we use [BitStream](https://github.com/mehuljain866/BitStream).
BitStream losslessly encodes any arbitrary file into an FFV1 `.AVI` video file. 
1. Compress your files.
2. Run BitStream to turn the ZIP into a Video.
3. Pixel-NAS uploads the "video" to Google Photos.
4. Download the video later and decode it to retrieve your exact files, byte-for-byte.

---

## Sync Modes

| Mode | Behavior |
|---|---|
| **Buffer Mode** | Files sync to Pixel and back up to cloud. Deleting from Pixel does not affect your main device. Recommended for most users. |
| **Mirror Mode** | Pixel mirrors your main device. Deletions on either side propagate after 30 days. Use only if you want true bidirectional sync. |

---

## Known Limitations

- **The 64GB Bottleneck:** The Pixel 2 XL’s limited internal storage acts as a tight buffer. Heavy dumps (30GB+) can cause "maximum storage" errors, stalling the pipeline. A 128GB Pixel 1 is highly recommended for larger loads.
- **Battery Degradation (Without Hack):** If you don't use the V3 smart plug or USB hub resistance hack, the battery will degrade, eventually requiring manual recharges every few days or risking battery swell.
- **App "Naps":** Android background management might sometimes put Resilio Sync to sleep. You may occasionally need to manually refresh the app or rely on a forced MacroDroid launch if syncing stalls.
- **Hardware Quirks:** Using salvaged hardware means you might deal with cracked screens or moisture issues if using crude cooling methods (like gel pads).
- **Metadata Preservation:** Resilio Sync preserves metadata for over 95% of transfers, but it is not formally guaranteed to be 100% perfect in every edge case.

---

## License & Author

**Author:** Mehul Jain
**License:** MIT License (Code) / Creative Commons BY-NC 4.0 (Documentation).

*Built out of necessity. If this helps preserve your digital memories—mission accomplished.*
