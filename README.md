# Pixel-NAS

**A fully automated, zero-subscription, End-to-End Encrypted (E2E) cloud backup pipeline built from a salvaged Android phone.**

Pixel-NAS transforms a legacy Google Pixel device into an always-on, invisible backup node. It silently syncs photos, videos, and files from your daily devices directly to Google Photos' infinite cloud storage—for free. No monthly subscriptions, no expensive NAS hardware, and zero manual maintenance.

*Currently managing a pipeline of **84,902 photos and videos (~1.5 TB)** across multiple devices seamlessly, with archives going back to the 2007–2008 era and older.*
*(Calculated volume based on an estimated 70/30 split: ~59,431 photos at an average of 3.5 MB each [~208 GB] and ~25,471 videos at an average of 50 MB each [~1.27 TB] for a total of ~1.48 TB).*
<img src="assets/stats_84k.png" align="right" width="40%" style="border-radius: 12px; margin: 10px 0 15px 20px;" alt="Proof of 84,902 photos and videos backed up" />
<br clear="all" />

---

## The Philosophy & Evolution

This project was born out of frustration. Our digital memories were scattered across old phones, SD cards, and hard drives, creating an unmanageable mess that was vulnerable to hardware failure. While cloud storage solves this, paying a permanent monthly rent to keep memories alive felt flawed.

### The Journey & Project Timeline

The evolution of Pixel-NAS spans several years, starting from early classroom ideas to a fully production-ready automated backup pipeline:

* **The Seeds (Class 9 / 2022–2023):** Initial interest in building an independent cloud/local backup solution started during Class 9.
* **Initial Concept Stage (November 2023 – January 2024):** The project origin and initial experiments occurred, realizing older Google Pixel devices could be repurposed to exploit the legacy "unlimited storage" loopholes.
* **V1 (The Cumbersome Phase - February – April 2024):** 
  <img src="assets/old_workflow.jpg" alt="The bleak reality of the V1 wired nightmare" align="right" width="35%" style="border-radius: 12px; margin: 0 0 15px 20px;" />
  Developed the first working prototype using a salvaged, boot-looped Pixel 2 XL and configuring Resilio Sync as the data relay. Backing up was an agonizingly manual and monotonous chore. It required tethering the main phone to a laptop, manually indexing and moving files, and then trickling them down to the Pixel. Because the legacy Pixels only have **USB 2.0 ports**, transferring files meant suffering through abysmal USB 2.0 speeds *twice* (Phone → Laptop → Pixel). This turned a simple backup into an unreliable, hours-long headache that heavily relied on pristine cables. Furthermore, using pen drives or external hard drives for these extended transfer sessions caused them to overheat and severely throttle. The system required constant human babysitting and was essentially an "expensive paperweight." *(Pictured right: The bleak, wired reality of V1—a laptop connected to a mouse and a Pixel sitting on a desk.)*
  <br clear="all" />
* **System Regularization & V2 (The Automation Phase - April/May 2025):** 
  <img src="assets/new_workflow.jpg" alt="V2 and V3 Setup" align="left" width="40%" style="border-radius: 12px; margin: 0 20px 15px 0;" /> 
  Moved past the fragile Version 1 wired workflow and transitioned into a more automated, stable, and fluid system. We introduced Resilio Sync over Wi-Fi, proving the concept by effortlessly syncing 80GB of 4K drone/camera footage without any cables. *(Pictured left: Three devices wirelessly backing up to the Pixel over Wi-Fi, which then seamlessly uploads to the cloud.)*
* **V3 (The Intervention-Free Phase - Present):** 
  The current architecture. Leveraging Smart Home integrations, geofencing, and advanced automation, the system now runs perpetually without any human intervention. Data flows like a self-cleaning pipe.
<br clear="all" />


---

## How It Works (The Architecture)

This system acts as a **digital funnel**. Your modern phone (iPhone/Android) or tablet securely pours data into the "Pixel Funnel" over your local Wi-Fi. The Pixel then "spoofs" the source of the data, allowing it to flow into the infinite ocean of Google Photos using its legacy unlimited backup benefit.

1. **Secure Transfer:** Your phone's camera roll syncs to the Pixel via **Resilio Sync** — a P2P protocol with full End-to-End Encryption on the local transfer leg.
2. **Infinite Cloud:** Google Photos on the Pixel detects the new files and uploads them in the background using the device's legacy unlimited backup entitlement.
3. **Auto-Purging (The Pixel Buffer):** The Pixel's internal storage acts as a temporary buffer. Android's Smart Storage automatically clears backed-up files every 30/60/90 days — it self-cleans without any user action.
4. **Passive Confirmation:** Real-time push notifications alert your main device when a batch finishes uploading via Google Photos Partner Sharing.
5. **Freeing Up Main Device Space:** Because your photos are safely in the cloud, you can open Google Photos on your *main daily driver* and manually tap **"Free up space"** to reclaim gigabytes of local storage.

<div align="center">
  <img src="assets/free_space_regular.jpg" width="45%" style="border-radius: 12px; margin: 5px;" alt="Regular free up space" />
  <img src="assets/free_space_max.jpg" width="45%" style="border-radius: 12px; margin: 5px;" alt="Max free up space" />
</div>

> **Important distinction:** Step 3 (auto-purge) happens automatically on the Pixel buffer only. Your **main phone's** Google Photos cannot auto-delete — that always requires a manual tap from you. This is intentional — auto-deleting photos from your primary device would be dangerous.

### The Pipeline Flowchart

```text
[ 📱 Main Phone / 💻 PC ]
          │
          │ (1. New media captured)
          ▼
          ├─► [ ⚡ Optional: Geofencing/Wi-Fi/Voice triggers Smart Plug to power Pixel-NAS ]
          │
          │ (2. Wi-Fi / Resilio Sync — E2E Encrypted Transfer)
          ▼
[ 📱 Pixel-NAS Internal Buffer (64GB/128GB) ]
          │
          │ (3. Google Photos App detects new media)
          ▼
[ ☁️ Google Photos Cloud (Unlimited Upload) ]
          │
          │ (4. Upload finishes)
          ├─► [ 🗑️ Pixel Auto-purges buffer on schedule — automatic ]
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

### Real-World Transfer Benchmarks

| Files | Total Size | Transfer Time |
| :--- | :--- | :--- |
| **500** | 4 GB | 3 min |
| **10,000** | 85 GB | 42 min |

### How to Achieve 150 Mbps:
1. **5GHz Wi-Fi:** Both the source device and the Pixel-NAS must be connected to a clean 5GHz network.
2. **Direct Connection:** Ensure Resilio Sync is using "LAN Sync" and a direct P2P connection (no relay servers).
3. **Advanced Tweaks:** For trusted local networks, disabling `lan_encrypt_data` in Resilio's advanced settings reduces CPU overhead, allowing the devices to focus purely on disk I/O and transfer speed.

> **VPN & DNS Note:** Turn off your VPN entirely during sync sessions. VPN interferes with both Resilio Sync's local peer discovery *and* Google Photos' device identity verification — both require a direct connection. Custom DNS servers (e.g., 1.1.1.1, 8.8.8.8) are fine and do not break the pipeline.

---

## Reliability & Operational Metrics

Production usage statistics gathered over extended operational testing show the robustness of the automated V3 pipeline:

| Metric | Value |
| :--- | :--- |
| **Runtime** | 14 months |
| **Backups** | 84,902 photos/videos |
| **Failures** | 2 |
| **Recovery Time** | 5 minutes |

---

## Automation & Smart Home Triggers (V3)

The beauty of V3 is that the Pixel-NAS only works when it needs to. Using Smart Plugs and Automation apps, we control the power and sync cycles dynamically.

> 💡 **Detailed Automation Guide:** For step-by-step instructions on how to build these automations in MacroDroid and Tasker, see the [AUTOMATION_MACROS.md](AUTOMATION_MACROS.md) guide.

### 1. Geofencing (Samsung Routines / Apple Shortcuts)
When you enter a ~15-meter radius of your home, a location-based routine triggers your Smart Plug to turn on. The Pixel receives power, wakes up, and immediately begins pulling the day's photos over Wi-Fi. No manual tapping required.

### 2. Wi-Fi Triggers (MacroDroid)
Using an automation app like **MacroDroid**, you can configure the Pixel to force-launch the sync protocol the exact moment it detects your home Wi-Fi SSID, ensuring background processes haven't put Resilio Sync to sleep.

### 3. Voice & Remote Triggers (Alexa / Google Home)
If a sync stalls, or if you need to force a backup remotely, you can map the smart plug to a voice command (e.g., *"Alexa, turn on Pixel NAS"*). Because the plug is connected to your smart home ecosystem, you can trigger backups from anywhere in the world.

### 4. Hardware Battery Management
Leaving a phone plugged in 24/7 destroys the battery. V3 uses a **5W (1A) charger** routed through a **4-port USB hub**. The hub acts as a resistor, creating a permanent "Charging Slowly" state. The battery stabilizes at ~45–50% and holds there indefinitely without heat cycles or swelling.

For users without smart home integration, a simpler approach works well: manually plug the Pixel in for **30 minutes to 1 hour per day**. That is enough to keep it running while protecting battery health. A Wi-Fi smart plug (Google Home / Alexa / Apple Home compatible) with a scheduled on/off routine is the recommended upgrade — it makes this fully automatic.

* **Advanced Home Assistant Integration:** Power users can link their smart plug to **Home Assistant** and configure an automation based on the Pixel's actual battery percentage (e.g., turn plug ON at 20%, OFF at 80%) rather than relying on a static time schedule.

---

## Hardware Bill of Materials

### 📱 Choosing the Right Pixel (Which generation to buy?)

If you are buying a device specifically for this project, the most straightforward and highly recommended option is the **Google Pixel 1 (128 GB)**. The 128GB model gives you a massive internal buffer to prevent "Storage Full" bottlenecks during large bulk uploads, and the Pixel 1 is the *only* generation that retains **Original Quality** backup for life.

> **Storage Capacity Warning:** The Pixel's internal storage is a live buffer. If it fills up, the pipeline stalls. With a 64GB Pixel, try to keep storage usage below **55–60GB** at most — beyond that, the pipeline tends to break and requires manual intervention. Heavy users (100–300+ photos/day, regular videos) are strongly advised to get the **128GB model**, where Smart Storage's auto-purge will keep up automatically without any manual attention.

Here is the exact breakdown of Google's legacy backup policies across generations:
* **Pixel 1 (2016):** Unlimited backup at **Original Quality** (Uncompressed), forever. *(The Holy Grail).*
* **Pixel 2 (2017) & Pixel 3 (2018):** Their Original Quality promo expired. They now offer unlimited backup at **Storage Saver (High) Quality** for life.
* **Pixel 3a, 4, 4a, 5:** Unlimited backup at **Storage Saver (High) Quality** for life.
* **Pixel 5a & newer (6, 7, 8, etc.):** No unlimited backup benefit. Do not buy these for this project.

### 🛠️ Hardware List

| Component | Recommendation | Purpose |
|---|---|---|
| **Google Pixel** | **Pixel 1 (128GB)** | The ultimate backup engine (Original Quality for life). |
| **Power Supply** | 5W (1A) Charger | Low-wattage charging for battery stability. |
| **Resistance Hub** | 4-Port USB Hub | Adds electrical resistance for trickle charging. |
| **Smart Plug** | Google Home/Alexa compatible | Required for Geofencing & Voice triggers. |
| **Cooling** | Aluminum Foil / Heat Sink | Passive heat dissipation across the back glass for 80GB+ bulk uploads. |

*Estimated cost from scratch: $15–$30 (mostly the smart plug). The Pixel itself can often be sourced for $30–$50 on eBay or salvaged for free.*

#### Battery Safety — Warning Signs (Pixel 1 is ~9 years old)
The Pixel 1's battery is aging hardware. If you observe any of the following, **power off and disconnect the device immediately**:
- Screen lifting away from the frame at any corner
- Back cover visibly bulging outward
- Unusual heat at idle (not during a sync — just sitting there warm)

Run the phone in a well-ventilated, visible location. Never in a closed box, drawer, or shelf compartment. Check it physically once a week.

#### Cooling for Heavy Loads
During large batch uploads, the Pixel 1 (Snapdragon 821) can thermally throttle, which slows uploads or pauses Google Photos backup entirely. Beyond the aluminum foil heat sink, additional options:
- **Active gaming cooler** — a clip-on Peltier/fan cooler attached to the back during heavy sync sessions
- **Fan automation** — add a second smart plug controlling a desk fan; when the Pixel's charging smart plug turns ON, the fan also turns ON via a smart home routine. Fully automatic, zero effort.

---

## Alternative: Spoofing a Pixel (No Hardware Required)

If you cannot acquire a physical Google Pixel device, you can use any spare Android phone as your backup node by "spoofing" its device signature to mimic a Pixel 1. By tricking Google's servers into believing your device is a first-generation Pixel, the Google Photos app will grant you the unlimited **Original Quality** backup entitlement.

There are two main ways to achieve this:

### 1. Custom ROMs (Built-in Spoofing)
Many custom ROMs include Google Photos spoofing out of the box by modifying the `build.prop` file to identify the device as a Pixel XL:

* **crDroid:** *Highly Recommended.* Extremely lightweight, based on LineageOS, massive device compatibility. Includes an easy toggle for unlimited Photos storage in its "Miscellaneous" settings. Ideal for older, low-spec hardware.
* **Evolution X:** Replicates the complete Pixel software experience with spoofing by default. More feature-packed than crDroid, so slightly heavier on very old hardware.
* **Pixel Experience (Discontinued):** Official development has ended, but archived builds are available for older devices. Includes spoofing natively.
* **ArrowOS / LineageOS:** The lightest ROMs with the widest device support. **Do not** include built-in spoofing — must be paired with a Magisk module (see below).

> **⚠️ OTA Reset:** On crDroid and Evolution X, the spoofing toggle can reset to OFF after a system (OTA) update. After every update, go back into the ROM's Miscellaneous settings and verify the toggle is still enabled.

### 2. Magisk Modules (Root Required)
If you are comfortable rooting with Magisk (or KernelSU/APatch), Zygisk-based modules inject the spoof only into the Google Photos process — leaving banking apps, Play Integrity, and the rest of your system completely untouched.

> **Build.prop vs Zygisk:** Some guides suggest editing `build.prop` directly to spoof at the ROM level. Avoid this — it changes device identity system-wide and can break banking apps and Play Integrity attestation. Zygisk modules are app-isolated and safer.

**Recommended modules (ranked by community preference, 2026):**

| Module | Repo | Notes |
|---|---|---|
| GPhotosUnlimited | github.com/Rev4N1/GPhotosUnlimited | Most actively maintained, most recommended |
| Unlimited-Photos-Storage | github.com/MeowDump/Unlimited-Photos-Storage | Strong KernelSU Next 3.0+ compatibility |
| Unlimited-GooglePhotosBackupMod | github.com/Kolass2004/Unlimited-GooglePhotosBackupMod | Alternative fork |
| Pixelify | github.com/Kingsman44/Pixelify | Full Pixel feature suite; includes GPhotos unlimited |

> **Android 16 note:** Many modules have reported compatibility issues on Android 16 (2026). If backup breaks after an Android 16 update, a reliable workaround is to downgrade Google Photos to **v6.6** via APKMirror and disable auto-update for it.

> **Module conflicts:** If you run both GPhotosUnlimited and Pixelify simultaneously, they can conflict. Fix: create a `custom.app_replace_list.txt` in `/data/adb/modules/unlimitedphotos/` to specify which module handles Google Photos exclusively.

**Installation steps:**
1. Root with Magisk / KernelSU / APatch and enable Zygisk (`Magisk Settings → Zygisk = ON`)
2. *(KernelSU Next 3.0+ only)* Install `magic_mount_rs` or `Mountify` metamount module first, then reboot — KSU Next 3.0 removed built-in module mounting
3. Flash the spoofing module `.zip` via Magisk Manager
4. Clear Google Photos data: Settings → Apps → Google Photos → Storage → **Clear Storage**
5. Reboot
6. Verify: Photos → Profile → Backup → correct quality tier + **"doesn't count against storage"**

> **Note on AI editing features:** After spoofing as Pixel 1, AI features like Magic Eraser, Magic Editor, and Photo Unblur will stop working in Google Photos — the app believes it is running on 2016 hardware with no AI chip. This is expected and not a concern: the spoofed device is used only as a backup node. AI editing features live on your daily driver, which is not spoofed.

**⚠️ Disclaimer for Spoofing:** Spoofing your device signature technically violates Google's Terms of Service. Account bans are extremely rare for this specific use case, but the method relies on third-party developers maintaining modules against Google's updates. The most bulletproof, zero-maintenance method is always a physical Pixel 1.

---

## Setup Guide

**1. Prepare the Device**
Factory reset the Pixel. Use Android Universal Debloater (ADB) to strip bloatware, maximizing the internal buffer and freeing up CPU cycles for the sync and upload tasks.

**2. Configure Google Photos**
Log in with a **dedicated backup Google account** — not your main personal account. Then:

- **Enable backup for ALL folders.** By default, Google Photos only backs up the device's Camera folder. Since Resilio Sync delivers files into a separate synced folder (not the camera roll), you must manually enable backup for every folder Resilio syncs into: Library → scroll down to your folder → tap the ☁️ cloud icon to enable backup for that folder.
- **Set backup quality.** On first setup (or after a factory reset), verify the backup quality setting:
  - Pixel 1: leave at **"Original quality"** — this is the whole point.
  - Pixel 2–5: switch to **"Storage Saver"** — it still receives the free unlimited perk, just compressed. Once set, it does not revert on its own.
  - Path: Profile → Backup → Backup quality
- Turn on the **30-day auto-purge** for the trash.

**3. Setup Resilio Sync**

Install Resilio on both the source device and the Pixel. Cherry-pick specific folders rather than the entire `DCIM` root — this avoids syncing cache files, thumbnails, and other junk. **Disable Selective Sync** so files transfer immediately, and enable **LAN Sync** for maximum speed.

**Critical Resilio settings on the Pixel:**

> **⚠️ Set folder to "Receive Only":** In Resilio Sync on the Pixel, set the synced folder mode to **Receive Only**. This is non-negotiable. Without it, when Google Photos runs "Free Up Space" and deletes backed-up files from local storage, Resilio detects them as "missing" and re-downloads them from your source — an infinite loop that continuously refills the Pixel's storage.

> **⚠️ Set battery to "Unrestricted":** Go to Android Settings → Apps → Resilio Sync → Battery → set to **Unrestricted**. On Android 14+, the system can kill Resilio via aggressive Doze mode, and on Android 15, it hits a strict 6-hour foreground service wall. The app may appear connected while silently not syncing anything. Unrestricted battery + keeping the foreground notification visible prevents this.

> **⚠️ Disable Resilio Auto-Sleep:** Inside Resilio Sync settings, find **Auto-sleep** and turn it off (or set a short wakeup interval of 15–30 minutes). Auto-Sleep hibernates the app between transfers. For an always-on node, this means newly arrived files won't be detected until the app wakes up — which could be hours later.

<div align="center">
  <img src="assets/resilio_dcim.jpg" width="45%" style="border-radius: 12px; margin: 5px;" alt="DCIM setup" />
  <img src="assets/resilio_specific.jpg" width="45%" style="border-radius: 12px; margin: 5px;" alt="Specific folders setup" />
</div>

**4. The Hardware Hack**
Connect: Wall Outlet → Smart Plug → 5W Charger → USB Hub → Pixel. Verify it says "Charging Slowly."

**5. Set up Automations**
Use Samsung Routines, Apple Shortcuts, or MacroDroid to create a trigger: `IF Location = Home → THEN Turn On Smart Plug`.

**6. Setup Partner Sharing (For Backup Notifications)**

Partner Sharing is not a core requirement — the backup works entirely without it. Its purpose is to give you a push notification on your main phone when the Pixel finishes backing up a batch.

> **Note:** Google Photos only supports **one active Partner Sharing relationship at a time.** If you already have one set up, you'll need to remove it first.

* On the **Pixel NAS** (logged into its dedicated backup account), open Google Photos.
* Go to: **Profile → Photos settings → Sharing → Partner Sharing → Get started**
* Invite your **main Google account email** → set to share **"All photos"**
* On your **main phone**, open Google Photos and accept the invitation
* Enable notifications: main phone → Google Photos → Profile → Photos settings → Notifications → **Sharing = ON**
* Also verify at system level: Settings → Apps → Google Photos → Notifications → all ON
* **How it works:** When the Pixel backs up a new batch, those photos populate in your main phone's "Sharing" tab, and you receive a batch push notification confirming the backup cycle completed.
* **For third-party media** (screenshots, WhatsApp photos, etc.): enable **Photos settings → Sharing → Partner Sharing → "Include content from other Android apps"** (added in early 2025).
* *If notifications stop: remove the partner, wait 10 minutes, re-invite.*

**Alternative Notification Method (MacroDroid / Tasker):**
If you prefer not to use Partner Sharing, you can use automation apps like MacroDroid or Tasker directly on the Pixel. These can monitor the Google Photos app state, folder modification times, or backup status, and fire a custom webhook or push notification to your main device when the sync completes. This is often a cleaner approach, though it requires more initial setup.

> **⚠️ Disconnecting Partner Sharing:** If you have auto-saved partner photos into your main account's library and then disconnect Partner Sharing, those saved copies may suddenly start counting against your 15 GB quota. Be aware of this before removing the relationship.

---

## How to Verify Your Backup is Working

You need to confirm photos are being uploaded by the **Pixel** (free, no quota used), not silently by your main phone.

**Step 1 — Disable backup on your main device.** Google Photos on main phone → Profile → Backup → **Backup OFF**. This is mandatory. If both devices have backup enabled simultaneously, you cannot determine which one is actually doing the uploading.

**Step 2 — Check the cloud icon.** On your main phone, open Google Photos and look at recent photos. A small **☁️ cloud icon** on or next to a photo means it has been backed up.

**Step 3 — Deep verification.** Open a recently taken photo → swipe up (or tap the ⓘ info button). You should see both:
- **"Backed up"** — it's in the cloud
- **"This item doesn't take up space in your Google Account storage"** — this is the confirmation that it was uploaded by the Pixel's legacy entitlement, not by your main device eating your 15 GB quota

<div align="center">
  <img src="assets/photos_metadata.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="Proof: item doesn't take up storage space" />
  <img src="assets/metadata_with_loc.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="Metadata preserved with GPS location" />
  <img src="assets/metadata_without_loc.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="Metadata preserved without GPS location" />
</div>

**Step 4 — Cross-check.** Open [photos.google.com](https://photos.google.com) in a desktop browser while logged into the backup account. Confirm recent photos are visibly present.

**What backup quality should show:**
- Pixel 1: **"Original quality"** + "doesn't count against storage" ✅
- Pixel 2–5: **"Storage Saver"** + "doesn't count against storage" ✅ (still free, just compressed)
- **Any device — bad state:** Any quality + "counts against storage" ❌ — something is misconfigured

> **Note:** Google removed the "Unlimited storage" badge from the Google Photos home screen in 2024. Verification must be done via Profile → Backup settings, not the home screen.

### The Pixel 2–5 "Original Quality" Upload Anomaly

While Google's official policy dictates that Pixel 2–5 devices only receive free unlimited backup for **Storage Saver** quality (compressing photos over 16MP and videos over 1080p), real-world testing has revealed a highly beneficial anomaly. 

Certain files from high-resolution external cameras or action cams can trigger an upload in **Original Quality** (uncompressed, full resolution) without consuming any Google Account storage space:

* **High-Megapixel Photos & MPF Tags (The Bypass):** Photos taken on certain **Sony DSLRs** (and other high-resolution cameras) consistently bypass the 16MP Storage Saver limit. This happens because these cameras embed Multi-Picture Format (MPF) metadata tags in their JPEGs. Google Photos' compression algorithm fails to process files containing these specific tags, so it falls back to storing them at **Original Quality** for free (0 bytes of account storage used). As seen in the screenshot below, the camera model is preserved in the EXIF metadata while the file consumes 0 bytes of Google Account storage.
* **Video Resolution Scaling & Aspect Ratios:** Unlike photos, videos are subjected to server-side transcoding, and there is no known "codec trick" to bypass this for videos under the Storage Saver tier. High-resolution videos (like 2.7K 60fps shot on a **DJI Action 2**) do not bypass Storage Saver compression to keep their original 2.7K resolution. Instead, Google Photos scales them to **1920 x 1440** (preserving the 4:3 aspect ratio rather than forcing a standard 16:9 1080p crop/scale) and maintains 60fps frame rate for free.
* **Note on 4K & Video Bypass:** True 4K footage (3840x2160 or 4096x2160) does not bypass compression. It is either compressed down to 1080p (or an equivalent 4:3 scale) or counted against storage.

<div align="center">
  <img src="assets/pixel2xl_og_proof.jpg" width="45%" style="border-radius: 12px; margin: 5px;" alt="Proof: Original Quality free upload on Pixel 2 XL" />
</div>

**Troubleshooting — "Getting ready to backup" is stuck:**

A single corrupted or incompletely transferred file can block the entire upload queue. Google Photos processes one file at a time, so one bad file stalls everything. Fix sequence:
1. Turn Backup OFF → reboot the Pixel → turn Backup back ON
2. Clear Google Photos cache and data (Settings → Apps → Google Photos → Storage → Clear Cache, then Clear Storage)
3. Check the most recently added files — temporarily remove any you suspect are corrupt
4. Keep the app open in the foreground, phone on charger, and wait 30 minutes

Usually just waiting works. There is no guaranteed instant fix — sometimes it resolves on its own.

**Troubleshooting — "Free up space" shows 0 items despite a large library:**

Google Photos hasn't finished indexing which files are safely in the cloud. Clear Photos cache, reopen the app, wait 5 minutes. If still 0, wait 24–48 hours after a large batch upload — the count may increase the next day as indexing completes. It is annoying but harmless.

---

## Advanced: Arbitrary File Backup (BitStream)

Pixel-NAS handles media natively. For documents, code, and zip files, we use [BitStream](https://github.com/mehuljain866/BitStream).
BitStream losslessly encodes any arbitrary file into an FFV1 `.AVI` video file.
1. Compress your files.
2. Run BitStream to turn the ZIP into a Video.
3. Pixel-NAS uploads the "video" to Google Photos.
4. Download the video later and decode it to retrieve your exact files, byte-for-byte.

---

## Advanced: Headless Node (Broken Screen / No-Touch Operation)

If your Pixel's screen is cracked, unresponsive, or you simply want to run it as a pure background node with zero physical interaction, you can control it entirely over Wi-Fi via ADB — no display or touch needed.

> **Note:** Pixel 1–5 do not support DisplayPort over USB-C, so Samsung DeX-style desktop output is not possible. ADB over Wi-Fi is the alternative.

**One-time setup (requires USB for the first connection only):**
```bash
# With Pixel connected via USB:
adb tcpip 5555

# Disconnect the USB cable. Find the Pixel's local IP in Settings → About → Status → IP address.
adb connect <pixel-local-ip>:5555

# All future control is now wireless — no USB needed.
```

**What you can do once connected:**
- Full screen mirror + touch control via **scrcpy** (free, open source): `scrcpy --tcpip=<pixel-ip>`
- Run any ADB command wirelessly — install APKs, toggle settings, reboot, etc.
- Set up **Tasker** on the Pixel to auto-restart Resilio Sync or Google Photos if either crashes, keeping the node fully self-healing

**Caveat:** Android blocks certain privacy-sensitive screens during remote casting (e.g., notification shade on some builds, some system settings menus). Test with scrcpy before going fully screenless to confirm all the controls you need are accessible remotely.

---

## Advanced: The "Daisy Chain" (Low Storage Workaround)

If you have a massive media library (e.g., 500GB) but your Pixel node only has 32GB or 64GB of internal storage, you cannot sync everything directly to the Pixel at once without causing a "Disk Full" crash. The theoretical but elegant solution is a "Trickle-Down Daisy Chain":

**The Architecture:**
`Source Devices` ➡️ `High Capacity Buffer (e.g., PC or NAS)` ➡️ `Low Storage Pixel` ➡️ `Google Cloud`

**How it works (The Automation Loop):**
1. **The Dump:** You send all 500GB to your High Capacity Buffer device.
2. **The Fill:** Resilio Sync on the Buffer device starts syncing to the Pixel. Once the Pixel reaches 100% capacity (e.g., 30GB), Resilio naturally pauses because there is no more space.
3. **The Backup:** Google Photos on the Pixel diligently backs up that 30GB batch to the cloud.
4. **The Ghost Purge (UI Automation):** Because Google does not provide an API to trigger "Free Up Space," you must use an automation app like **MacroDroid** or **Tasker (with AutoInput)** on the Pixel. The app listens for the Google Photos "Backup Complete" notification. When it fires, the automation wakes the screen, launches Google Photos, and simulates physical screen taps (like a ghost) to click Profile ➡️ Free Up Space ➡️ Confirm. *(See [AUTOMATION_MACROS.md](AUTOMATION_MACROS.md) for the exact step-by-step build).*
5. **The Trickle Down Resumes:** Once the 30GB is purged from the Pixel's local storage, Resilio Sync immediately detects the new free space and automatically resumes sending the next 30GB batch from the Buffer device.

This creates an autonomous, self-cleaning pipeline that can trickle terabytes of data through a 32GB phone without human intervention.

---

## Sync Modes

| Mode | Behavior |
|---|---|
| **Buffer Mode** | Files sync to Pixel and back up to cloud. Deleting from Pixel does not affect your main device. Recommended for most users. |
| **Mirror Mode** | Pixel mirrors your main device. Deletions on either side propagate after 30 days. Use only if you want true bidirectional sync. |

---

## Current Status

| What | Status | Notes |
|---|---|---|
| Pixel 1 unlimited Original Quality backup | ✅ STILL ACTIVE (July 2026) | No announced end date |
| Pixel 2–5 unlimited Storage Saver backup | ✅ STILL ACTIVE | Compressed but free |
| Pixel 5a+ unlimited backup | ❌ GONE | Do not use for this project |
| Magisk spoofing modules | ⚠️ WORKS (with caveats) | Android 16 has issues; requires maintenance after updates |
| crDroid / Evolution X built-in spoof | ✅ WORKS | Can reset after OTA update; re-enable in ROM settings |

> **Critical rule:** The free unlimited quota **only** applies to files uploaded directly from the physical Pixel's Google Photos app. Uploading via browser, a different phone, or desktop — even to the same Google account — **will count against your 15 GB quota.**

---

## Known Limitations & Heads-Ups

- **The 64GB Bottleneck:** The Pixel's internal storage is a live buffer. Heavy dumps (30GB+) can cause "maximum storage" errors, stalling the pipeline. A **128GB Pixel 1** is highly recommended. With a 64GB model, keep usage below 55–60GB.
- **Occasional Manual Purge:** Android Smart Storage won't delete files newer than 30 days, even if they're backed up. If the Pixel fills up faster than the auto-purge cycle, manually trigger "Free up space" on the Pixel (Google Photos → Library → Free up space). This is the only recurring manual task for heavy users.
- **Battery Degradation (Without Hack):** Without the smart plug + USB hub trickle charging setup, the battery will degrade from continuous 100% charging, eventually risking battery swelling.
- **App "Naps":** Android background management may put Resilio Sync to sleep despite Unrestricted battery settings. Occasional manual refresh or a MacroDroid watchdog trigger can recover this.
- **Hardware Quirks:** Salvaged hardware may have cracked screens or other physical quirks. See the Headless Node section for no-touch operation.
- **Metadata Preservation:** Resilio Sync preserves metadata perfectly. GPS coordinates (if enabled at capture), exact timestamps, and device origin (e.g., "Shot on iPhone") survive the E2E transfer completely intact. Google Photos will confirm: *"This item doesn't take up space in your account storage."*
- **Android System Backup (July 2026):** As of July 7, 2026, Android's device backup (SMS, call logs, app data, settings) now counts toward your 15 GB Google quota — even if your photos are uploading for free via the Pixel. Manage via Android Settings → Google → Backup. The data is mostly text-based and typically under 1 GB, but check it if you notice unexpected storage consumption.
- **Google Photos Auto-Update:** Auto-updates for Google Photos have generally been fine — the Pixel receives updates on day one and continues working without issue. As a precaution, you can disable auto-update via Play Store → Google Photos → ⋮ → Don't auto-update and update manually. If backup ever breaks after an update, clear Google Photos app data and re-verify backup settings as the first step.

---

## Future: V4 — Parallel True Data Ownership

The current V3 pipeline gives you free cloud storage via Google. V4 extends this by adding a **simultaneous local copy** — true ownership that doesn't depend on Google at all.

**The Architecture:**

```text
[ 📱 Main Phone / Multiple Devices ]
            │
            │  (Resilio Sync — sends to ALL peers simultaneously)
            ├──────────────────────────┐
            ▼                          ▼
[ 📱 Pixel-NAS Buffer ]        [ 💻 Local PC / Home Server ]
            │                          │
            │  (Google Photos upload)   │  (Raw files — true local ownership)
            ▼                          │
[ ☁️ Google Cloud (Free) ] ◄───────────┘
```

**Why this is powerful:**
- Google Photos gives you free cloud + AI search + facial recognition + editing tools — all still working
- The local PC gives **true ownership** — if Google changes the free policy or closes your account, every photo is still safe locally
- You can confidently run "Free up space" on your main phone knowing files exist in **two independent places**
- Resilio Sync distributes to both destinations simultaneously, with E2E encryption on the local leg

**What you need:**
- A PC, old laptop, mini PC, or Raspberry Pi with a large external drive running Resilio Sync
- Set the PC's folder to **"Receive Only"** — it receives files but does not propagate deletions back to source
- Resilio share with 3 peers: Main Phone (Send), Pixel (Receive), PC (Receive)

**Taking it further — Immich:**

[Immich](https://immich.app) is a self-hosted, open-source Google Photos replacement that runs on your own hardware via Docker. If you already have the local PC from the V4 architecture, you can run Immich on it to get a full-featured photo management interface — face recognition, AI-powered search, mobile app, memories — all on hardware you own and control.

| Feature | Google Photos (Pixel-NAS) | Immich |
|---|---|---|
| Cost | Free (Pixel-NAS) | Free (self-hosted) |
| Storage | Google's servers | Your own hardware |
| AI search & face recognition | ✅ Google's AI | ✅ Local AI |
| Mobile app | ✅ Official Google | ✅ Immich app (iOS + Android) |
| E2E Encryption | Google holds keys | Fully yours |
| Requires hardware | ❌ | ✅ Docker / server |

```text
Stage 1 (Current): Pixel-NAS → Google Photos (free cloud)
Stage 2 (Add):     Resilio also syncs to local PC → cloud + local redundancy
Stage 3 (Future):  Immich on local PC → full Google Photos feature parity, self-hosted
Stage 4 (Ideal):   If Google changes policy → already migrated, zero panic
```

---

## Privacy & Encryption

**The local transfer leg (Resilio Sync → Pixel)** is fully End-to-End Encrypted using AES-256. Traffic between your devices is encrypted on the sending device and decrypted only on the receiving device. Nobody — not Resilio, not your ISP, not anyone on your local network — can read it in transit.

**The cloud upload leg (Pixel → Google Photos)** is encrypted in transit (TLS/HTTPS) and encrypted at rest on Google's servers (AES-256). However, Google holds the decryption keys. This means Google's systems can technically access your photo content — and they do, intentionally, for the following features:

- **Face Grouping** — grouping photos by person
- **AI-powered search** — searching by object, location, scene, text in image
- **Memories & highlights** — auto-generated albums and anniversary cards
- **Gemini integration** — natural language photo queries

This is by design. True End-to-End Encryption on the cloud leg would make all of these features technically impossible. Google's official position (via safety.google) is that server-side AI processing requires access to image content.

**Key privacy facts from Google's own documentation:**
- Face Groups are **private to your account only** — never shared with third parties for identification
- Google **does not use your photos for advertising targeting**
- You can disable Face Grouping entirely; Google states it deletes the underlying face models when you do

**For users who need stricter privacy:**
- **[Ente Photos](https://ente.io)** — E2E encrypted cloud storage for photos; self-hostable; photos are encrypted on your device before upload so even Ente cannot access them. Trade-off: no server-side AI features.
- **[Immich](https://immich.app)** — fully self-hosted; your server, your keys, no external access at all.

For most users, the Pixel-NAS pipeline is an excellent pragmatic balance — the local transfer is fully E2E encrypted, and Google's photo privacy policy is among the stronger ones in the industry.

---

## License & Author

**Author:** Mehul Jain
**License:** MIT License (Code) / Creative Commons BY-NC 4.0 (Documentation).

*Built out of necessity. If this helps preserve your digital memories—mission accomplished.*
