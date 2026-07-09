# Pixel-NAS

**A fully automated, zero-subscription, End-to-End Encrypted (E2E) cloud backup pipeline built from a salvaged Android phone.**

Pixel-NAS transforms a legacy Google Pixel device into an always-on, invisible backup node. It silently syncs photos, videos, and files from your daily devices directly to Google Photos' infinite cloud storage—for free. No monthly subscriptions, no expensive NAS hardware, and zero manual maintenance.

*Currently managing a pipeline of **~80,000 photos and videos (~1.5 TB)** across multiple devices seamlessly.* *(Pictured right: Proof of 80,000+ items successfully backed up.)*
<img src="assets/stats_2026.jpg" align="right" width="40%" style="border-radius: 12px; margin: 10px 0 15px 20px;" alt="Proof of 80,000+ photos backed up" />
<br clear="all" />

---

## The Philosophy & Evolution

This project was born out of frustration. Our digital memories were scattered across old phones, SD cards, and hard drives, creating an unmanageable mess that was vulnerable to hardware failure. While cloud storage solves this, paying a permanent monthly rent to keep memories alive felt flawed.

### The Journey
* **V1 (The Cumbersome Phase - The Wired Nightmare):** 
  <img src="assets/old_workflow.jpg" alt="The bleak reality of the V1 wired nightmare" align="right" width="35%" style="border-radius: 12px; margin: 0 0 15px 20px;" />
  Started with a salvaged Pixel 2 XL. Backing up was an agonizingly manual and monotonous chore. It required tethering the main phone to a laptop, manually indexing and moving files, and then trickling them down to the Pixel. Because the legacy Pixels only have **USB 2.0 ports**, transferring files meant suffering through abysmal USB 2.0 speeds *twice* (Phone → Laptop → Pixel). This turned a simple backup into an unreliable, hours-long headache that heavily relied on pristine cables. Furthermore, using pen drives or external hard drives for these extended transfer sessions caused them to overheat and severely throttle. The system required constant human babysitting and was essentially an "expensive paperweight." *(Pictured right: The bleak, wired reality of V1—a laptop connected to a mouse and a Pixel sitting on a desk.)*
  <br clear="all" />
* <img src="assets/new_workflow.jpg" alt="V2 and V3 Setup" align="left" width="40%" style="border-radius: 12px; margin: 0 20px 15px 0;" /> **V2 (The Automation Phase):** We introduced a fluid system using Resilio Sync over Wi-Fi. This proved the concept by effortlessly backing up 80GB of 4K drone/camera footage without any cables. *(Pictured left: Three devices wirelessly backing up to the Pixel over Wi-Fi, which then seamlessly uploads to the cloud.)*
* **V3 (The Intervention-Free Phase):** The current architecture. Leveraging Smart Home integrations, geofencing, and advanced automation, the system now runs perpetually without any human intervention. Data flows like a self-cleaning pipe.
<br clear="all" />

---

## How It Works (The Architecture)

This system acts as a **digital funnel**. Your modern phone (iPhone/Android) or tablet securely pours data into the "Pixel Funnel" over your local Wi-Fi. The Pixel then "spoofs" the source of the data, allowing it to flow into the infinite ocean of Google Photos using its legacy unlimited backup benefit.

1. **Secure Transfer:** Your phone's camera roll syncs to the Pixel via **Resilio Sync** (an End-to-End Encrypted, P2P protocol that eliminates the need to build a custom solution).
2. **Infinite Cloud:** Google Photos on the Pixel detects the new files and uploads them in the background.
3. **Auto-Purging (The Pixel Buffer):** The Pixel's internal storage acts as a temporary buffer. Thanks to Android's Smart Storage, it automatically empties itself every 30/60/90 days. It never fills up.
4. **Passive Confirmation:** Real-time push notifications alert your main device when a batch finishes uploading via Google Photos Partner Sharing.
5. **Freeing Up Main Device Space:** Because your photos are now safely on the infinite cloud, you can confidently open the Google Photos app on your *main daily driver phone* and manually tap **"Free up space"** to reclaim gigabytes of local storage. 
| <img src="assets/free_space_regular.jpg" width="100%" style="border-radius: 12px;" /> | <img src="assets/free_space_max.jpg" width="100%" style="border-radius: 12px;" /> |
| :---: | :---: |
| *Regular "Free up space" prompt* | *A massive "Free up space" prompt* |

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

## Alternative: Spoofing a Pixel (No Hardware Required)

If you cannot acquire a physical Google Pixel device, you can use any spare Android phone as your backup node by "spoofing" its device signature to mimic a Pixel 1. By tricking Google's servers into believing your device is a first-generation Pixel, the Google Photos app will grant you the unlimited **Original Quality** backup entitlement.

There are two main ways to achieve this:

### 1. Custom ROMs (Built-in Spoofing vs Lightweight)
Many custom ROMs include Google Photos spoofing out of the box by modifying the `build.prop` file to identify the device as a Pixel XL. Depending on how old your spare device is, you'll need to choose between features and weight:

*   **crDroid:** *Highly Recommended.* Extremely lightweight, based on LineageOS, and boasts massive official/unofficial device compatibility. It includes an easy toggle for unlimited Photos storage right in its "Miscellaneous" settings. Ideal for older, low-spec phones.
*   **Evolution X:** Replicates the complete Pixel software experience and includes spoofing by default. It has excellent device support but is heavily feature-packed, making it slightly heavier to run on very old hardware compared to crDroid.
*   **Pixel Experience (Discontinued):** The classic choice. While official development has ended, you can still flash archived builds for older devices. It includes the spoofing natively.
*   **ArrowOS / LineageOS:** The absolute lightest and fastest ROMs with the widest device support. However, they **do not** include built-in spoofing. You must use them in combination with Magisk modules (see below) to get unlimited backups.

### 2. Magisk Modules (Root Required)
If you are comfortable rooting your Android device with Magisk (or KernelSU/APatch), you can install Zygisk-based spoofing modules. 
* **GPhotosUnlimited (by Rev4N1):** One of the most actively maintained modules. 
* **Pixelify:** An alternative module that brings Pixel features, including photo spoofing, to any rooted device.
* *How it works:* You install the module, enable Zygisk, clear the data of your Google Photos app, and reboot. Google Photos will suddenly recognize your phone as a Pixel 1.

**⚠️ Disclaimer for Spoofing:** While wildly popular, spoofing your device signature technically violates Google's Terms of Service. Although account bans are extremely rare for this, this method relies heavily on third-party developers maintaining the spoofing modules against Google's updates. The most bulletproof, zero-maintenance method is always to buy an actual physical Pixel 1.

---

## Setup Guide

**1. Prepare the Device**
Factory reset the Pixel. Use Android Universal Debloater (ADB) to remove all bloatware, maximizing the internal storage buffer and freeing up CPU cycles.

**2. Configure Google Photos**
Log in with a dedicated backup account. Enable backup for all folders that Resilio will sync. Turn on the 30-day auto-purge for the trash.

**3. Setup Resilio Sync**
Install Resilio on both devices. You can sync the entire `DCIM` folder to back up everything, but in practice, cherry-picking specific folders is highly recommended to avoid syncing cache or junk files. **Disable Selective Sync** so files move instantly, and enable **LAN Sync** for maximum speeds.
| <img src="assets/resilio_dcim.jpg" width="100%" style="border-radius: 12px;" /> | <img src="assets/resilio_specific.jpg" width="100%" style="border-radius: 12px;" /> |
| :---: | :---: |
| *Syncing the entire DCIM folder (Mass method)* | *Cherry-picking specific folders (Recommended)* |

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
- **Metadata Preservation:** Resilio Sync preserves metadata perfectly. GPS location (if enabled), exact timestamps, and device origin data (e.g., "Shot on iPhone") survive the E2E transfer completely intact. Furthermore, Google Photos will explicitly recognize that the upload came from a Pixel, stating: *"This item doesn't take up space in your account storage."*
| <img src="assets/photos_metadata.jpg" width="100%" style="border-radius: 12px;" /> | <img src="assets/metadata_with_loc.jpg" width="100%" style="border-radius: 12px;" /> | <img src="assets/metadata_without_loc.jpg" width="100%" style="border-radius: 12px;" /> |
| :---: | :---: | :---: |
| *Storage exemption proof* | *Metadata preserved (with location)* | *Metadata preserved (without location)* |

---

## License & Author

**Author:** Mehul Jain
**License:** MIT License (Code) / Creative Commons BY-NC 4.0 (Documentation).

*Built out of necessity. If this helps preserve your digital memories—mission accomplished.*
