# Pixel-NAS

**A fully automated, zero-subscription cloud backup system built from a salvaged Android phone.**

Pixel-NAS turns a legacy Google Pixel device into a always-on backup node — silently syncing photos, videos, and files from every device in your home to Google Photos' unlimited cloud storage, for free. No monthly fees, no NAS hardware, no maintenance.

Currently backing up **~80,000 photos and videos (~1.5 TB)** across four devices.

---

## The Problem

In Grade 9, I realized my family's photos were everywhere and nowhere at the same time — scattered across old phones, SD cards, and hard drives. We had already lost photos to theft and hardware failure. Cloud storage existed, but paying indefinitely for something as fundamental as keeping memories felt wrong. There had to be a better way.

The answer was sitting in a school e-waste bin: a Google Pixel 2 XL, still eligible for Google Photos' legacy unlimited backup benefit. That phone became the backbone of a system that has now run reliably for over a year.

---

## How It Works

The Pixel sits plugged in at home, connected to Wi-Fi, doing one job: receiving files from every device on the network and uploading them to Google Photos.

- Your phone's camera roll syncs to the Pixel over Wi-Fi via Resilio Sync (no cables, no manual steps)
- Google Photos on the Pixel automatically backs everything up to the cloud
- The Pixel's internal storage self-manages — backed-up files are purged on a rolling cycle so it never fills up
- You get real-time notifications on your main device when a backup completes, via Google Photos Partner Sharing

The result is a backup pipeline that runs entirely in the background, requires no interaction, and costs nothing beyond the hardware you likely already own or can find for under ₹1,000.

---

## Version History

### V1 — Proof of Concept

The original build used a salvaged Pixel 2 XL connected to a wall-powered power bank. Files were synced manually or via Resilio Sync, and storage management required periodic manual cleanup using Google Photos' "Free up space" feature. It worked — and backed up the first terabyte — but it needed babysitting.

**What V1 proved:** The core idea is viable. A retired Pixel can act as a legitimate cloud upload node.

### V2 — Intervention-Free

V2 was a full rethink focused on one goal: the system should run without any user input, indefinitely.

**Trickle Charging:** The biggest hardware risk in V1 was battery degradation from being plugged in 24/7. V2 solved this by routing power through a 4-port USB hub, which adds enough resistance to keep the phone in a permanent "Charging Slowly" state at ~45–50% battery. No swelling, no heat cycles, no manual unplugging.

**Auto-Overwrite Logic:** V2 introduced automatic storage management. As the Pixel's internal buffer fills up, older already-backed-up files are deleted to make room for incoming ones. The 64GB limit becomes a non-issue.

**Thermal Management:** During large bulk uploads (80GB+ from a trip), the phone can run warm. A strip of aluminum foil across the back acts as a passive heat sink — simple, effective, and free.

**Debloating:** Using Android Universal Debloater (ADB-based), all pre-installed Google and OEM apps that couldn't be disabled through settings were removed entirely. This recovered an additional 300–500 MB of usable storage and reduced background CPU usage, which directly improved upload reliability and thermal performance.

**Partner Sharing Notifications:** By enabling Google Photos Partner Sharing between the Pixel account and your main Google account, you receive a push notification the moment the Pixel finishes uploading a new batch. Passive confirmation without opening any app.

### V3 — Smart Home Integration

V3 adds geofencing and smart home automation to the charging and sync cycle, so the system activates exactly when it's most useful — when you arrive home.

Using a smart plug (compatible with Google Home, Amazon Alexa, Apple HomeKit, or Samsung SmartThings) and a geofencing routine, the Pixel's charger switches on automatically as you enter a ~100–200m radius of your home. Sync begins immediately as the phone powers up, and the charger can be set to switch off after a fixed window (30–60 minutes, depending on your typical upload volume).

This means:
- No wasted upload cycles while you're away
- Sync happens passively the moment you walk in
- The battery stays at a healthy charge level rather than sitting at 50% indefinitely

No custom scripts are required. Google Home Routines, Alexa Routines, Apple Shortcuts, and SmartThings automations all support smart plug control with location triggers natively.

---

## Hardware

| Component | Recommendation | Notes |
|---|---|---|
| Google Pixel | Pixel 1 (128GB) preferred, Pixel 2 XL viable | Pixel 1 backs up in Original Quality; Pixel 2–5 in Storage Saver |
| Charger | 5W (1A) adapter | Lower wattage = slower charge = stable battery |
| USB Hub | Any 4-port passive hub | Acts as a resistance buffer between charger and phone |
| Smart Plug | Any Google Home / Alexa compatible plug | Required for V3 geofencing automation |
| Aluminum Foil | Standard kitchen foil | Passive heat sink during bulk uploads |

Estimated cost from scratch: **₹1,500–₹3,000**, mostly the smart plug. The Pixel itself can often be sourced free from e-waste drives or for under ₹2,000 secondhand.

---

## Software Stack

| Software | Purpose |
|---|---|
| Google Photos | Cloud backup engine (legacy Pixel benefit) |
| Resilio Sync (Free) | P2P file sync between your devices and the Pixel |
| Android Universal Debloater | ADB-based debloating for storage and performance gains |
| Google Home / Alexa / Shortcuts | Smart home automation for V3 geofencing |

**Note on Resilio Sync:** Resilio is proprietary freeware, not open source. If you prefer a fully open-source alternative, [Syncthing](https://syncthing.net/) is a direct replacement with similar functionality, though the Android client is slightly less polished.

---

## Setup Guide (V2)

**1. Prepare the Device**
Factory reset the Pixel. Using Android Universal Debloater (requires ADB), remove all non-essential system apps. Keep only Google Photos and Resilio Sync.

**2. Configure Google Photos**
Log in with a dedicated backup-only Google account. Set backup quality to Original (Pixel 1) or Storage Saver (Pixel 2+). Enable backup for all folders — DCIM, Downloads, and any folders Resilio will sync to.

**3. Install Resilio Sync**
Install on both the Pixel and your main phone/tablet. Add your Camera and Downloads folders on the main device, generate the QR code, and scan from the Pixel. Disable Selective Sync on both ends so files transfer automatically without manual approval.

**4. Set Up Trickle Charging**
Connect: wall outlet → 5W charger → USB hub → Pixel. The phone should show "Charging Slowly." This is the target state. Battery will stabilize around 45–50% and hold there indefinitely.

**5. Enable Auto-Deletion**
In Google Photos, enable the 30-day trash auto-purge. For more aggressive storage management, enable the overwrite behavior in Resilio so older synced files are replaced as new ones arrive.

**6. Enable Partner Sharing (Optional)**
In Google Photos on the Pixel account, enable Partner Sharing with your main Google account. You'll receive notifications when new uploads complete.

**7. Add Geofencing (V3)**
Pair a smart plug to your Google Home, Alexa, or HomeKit setup. Create a routine: when your phone enters home location → turn on smart plug. Add a second trigger to turn it off after 60 minutes or when you leave. No scripting required.

---

## Sync Modes

| Mode | Behavior |
|---|---|
| Buffer Mode | Files sync to Pixel and back up to cloud. Deleting from Pixel does not affect your main device. Recommended for most users. |
| Mirror Mode | Pixel mirrors your main device. Deletions on either side propagate after 30 days. Use only if you want true bidirectional sync. |

---

## Advanced: Backing Up Any File with BitStream

Pixel-NAS natively handles photos and videos. For everything else — documents, archives, executables, project folders — [BitStream](https://github.com/mehuljain866/BitStream) extends the pipeline to cover arbitrary file types.

BitStream encodes any file or folder into a lossless FFV1 AVI video using the FFV1 codec at a resolution like 256×256 or 1024×1024. Because FFV1 is lossless, every byte survives the encode-decode cycle intact. Google Photos stores the video without touching the underlying data, and searching the video's filename in Google Photos retrieves it instantly.

**The pipeline:**

1. Drop your files into BitStream's `input/` folder
2. Run BitStream — it compresses the folder into a ZIP and encodes it as an AVI
3. Place the output AVI in a folder watched by Resilio Sync
4. Pixel-NAS picks it up and uploads it to Google Photos automatically
5. To recover: download the AVI from Google Photos, run BitStream's decode function, get your original files back

**Naming convention:** Use `ARCHIVE_[ProjectName]_[YYYY-MM-DD]` for output filenames. Google Photos indexes video filenames, so searching "ARCHIVE" pulls up your entire vault instantly.

BitStream also supports steganographic mode — hiding encoded data inside a normal cover video using LSB embedding, so the file looks like an ordinary video clip to anyone browsing the library.

Full documentation and source: [github.com/mehuljain866/BitStream](https://github.com/mehuljain866/BitStream)

---

## Known Limitations

- **Pixel 2 buffer is 64GB.** For heavy users or large media libraries, the Pixel 1 (128GB) is a meaningfully better choice.
- **No direct USB drive backup.** Files must come through Resilio Sync — direct USB-to-Pixel transfers are not supported by Google Photos.
- **Resilio Sync metadata preservation** is reliable in practice but not guaranteed. In testing, metadata was preserved in over 95% of transfers with default settings.
- **Legacy backup eligibility.** Google's unlimited storage benefit applies to Pixel 1–5 devices activated before certain cutoff dates. Verify your specific device's eligibility before building around it.

---

## Roadmap

- Thermal monitoring via a secondary microcontroller with automatic fan or relay trigger
- Dedicated Android app to abstract the Resilio + Google Photos configuration into a single setup flow
- Investigate GrapheneOS or CalyxOS builds for improved background process reliability

---

## License

Code: MIT License. Documentation: Creative Commons BY-NC 4.0.

Use it, modify it, build on it — just don't sell it without credit.

---

## Author

**Mehul Jain** — [github.com/mehuljain866](https://github.com/mehuljain866)

Built out of frustration, maintained out of habit, open-sourced in case it helps someone else not lose their memories.
