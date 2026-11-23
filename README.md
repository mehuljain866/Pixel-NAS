# Pixel-NAS

**A fully automated, zero-subscription, End-to-End Encrypted (E2E) cloud backup pipeline built from a salvaged Android phone.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13.0-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Termux-orange.svg)](https://termux.dev/)
[![Archived](https://img.shields.io/badge/Media%20Archived-111k%2B%20Items-blueviolet.svg)](#current-scale--empirical-data)
[![Cost](https://img.shields.io/badge/Cloud%20Cost-%240%20%2F%20mo*-success.svg)](#-why-not-just-pay-for-cloud-storage)

Pixel-NAS transforms a legacy Google Pixel device into an always-on, invisible backup node. It silently syncs photos, videos, and files from your daily devices directly to Google Photos' infinite cloud storage—for free. No monthly subscriptions, no expensive NAS hardware, and zero manual maintenance.

---

### Current Scale & Empirical Data

*Currently managing an active archive of **111,556 photos and videos (~1.8–2.2 TB)** across multiple devices seamlessly, with archives dating back to 2007–2008 and earlier.*

*(Calculated volume based on empirical data: A real-world sample of 5,722 items represented 91.74 GB [~16.03 MB/item] due to high-resolution phone media, RAW camera captures, and long 1080p/DJI video footage, projecting to ~1.8–2.2 TB for 111,000+ items, as of November 10th, 2026).*

<div align="center">
  <img src="assets/stats_111k.jpg" width="45%" style="border-radius: 12px; margin: 10px auto;" alt="Proof of 112,253 photos and videos backed up (November 10, 2026)" />
</div>

<br clear="all" />

---

## 📚 Documentation Hub

The complete engineering, operational, and historical documentation is organized into focused sub-guides:

| Guide | What's Covered |
| :--- | :--- |
| 🛠️ [**Setup & Configuration Guide**](docs/SETUP.md) | Complete step-by-step installation: Termux, Resilio Sync, Google Photos, headless ADB mode, and verification. |
| 📱 [**Hardware, Benchmarks & Longevity**](docs/HARDWARE_AND_BENCHMARKS.md) | Pixel 1 vs 2–5 buyer's guide, 150 Mbps Wi-Fi setup, 24-hr unplugged thermal/discharge tests, and Android 4.2.2 longevity proof. |
| ⚡ [**Automation, Triggers & Daisy Chain**](docs/AUTOMATION.md) | Geofencing, MacroDroid automation, smart plug battery cycling (20–80%), KWGT telemetry widgets, and buffer recycling. |
| 📖 [**Philosophy, Story & Evolution**](docs/PHILOSOPHY.md) | Why not paid cloud?, psychological freedom from storage anxiety, project timeline (V1–V4), and BitStream arbitrary backup. |
| 🏗️ [**System Architecture**](docs/ARCHITECTURE.md) | Ingestion telemetry pipelines, SQLite ledger states, and watchdog dataflow. |
| 🛡️ [**Security & Network Hardening**](docs/SECURITY.md) | Local loopback binding, bearer token authentication, CORS restrictions, and Android permissions. |
| 🔄 [**Disaster Recovery Runbook**](docs/RECOVERY.md) | Step-by-step node recovery instructions, ledger restoration, and restore verification checklists. |
| 📊 [**V4 Reliability Hardening**](docs/V4_RELIABILITY.md) | Technical summary of V4 reliability updates, fail-safe storage guard, and SHA-256 ingestion scanner. |
| 🤖 [**Macro Action Recipes**](AUTOMATION_MACROS.md) | Ready-to-import step-by-step MacroDroid action logic and XML configuration blocks. |
| 🧪 [**Device Spoofing Guide**](DEVICE_SPOOFING_GUIDE.md) | Research and critical warnings regarding virtual/spoofed nodes and account safety. |

---

## How It Works (The Architecture)

This system acts as a **digital funnel**. Your modern phone (iPhone/Android) or tablet securely pours data into the "Pixel Funnel" over your local Wi-Fi. The Pixel then ingests the media, allowing it to flow into Google Photos using its grandfathered original-quality unlimited backup benefit.

1. **Secure Transfer (Local & Global WAN):** Your phone's camera roll syncs to the Pixel via **Resilio Sync** — a P2P protocol with full End-to-End Encryption (AES-128/256). Devices can sync on local Wi-Fi or globally across the internet via encrypted BitTorrent relays.
2. **Infinite Cloud Ingestion:** Google Photos on the Pixel detects the new files and uploads them in the background using the device's legacy unlimited original-quality entitlement.
3. **Auto-Purging (The Pixel Buffer):** The Pixel's internal storage acts as a temporary buffer. Automated space reclamation (or Android Smart Storage) purges backed-up files so new batches can stream in.
4. **Passive Confirmation:** Real-time push notifications alert your main device when a batch finishes uploading via Google Photos Partner Sharing.
5. **Freeing Up Main Device Space:** Because your photos are safely in the cloud, you can open Google Photos on your *main daily driver* and manually tap **"Free up space"** to reclaim local gigabytes.

<div align="center">
  <img src="assets/cleanup_91gb.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="91.74 GB freed in a single session" />
  <img src="assets/free_space_max.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="Max free up space prompt" />
  <img src="assets/free_space_regular.jpg" width="30%" style="border-radius: 12px; margin: 5px;" alt="Regular free up space" />
</div>

> [!IMPORTANT]
> **The 3-2-1 Retention Boundary:** The Pixel is an *ingestion bridge*, not your only master archive. Retain original media on source devices, PCs, or an independent offline drive until items are independently verified in Google Photos web.

### The Pipeline Flowchart

```text
[ 📱 Main Phone / 💻 PC ]
          │
          │ (1. New media captured)
          ▼
          ├─► [ ⚡ Optional: Geofencing/Wi-Fi triggers Smart Plug to power Pixel-NAS ]
          │
          │ (2. Wi-Fi / Resilio Sync — E2E Encrypted P2P Transfer)
          ▼
[ 📱 Pixel-NAS Ingestion Buffer (32GB/128GB) ]
          │
          │ (3. Google Photos detects media & Termux V4 Ledger hashes stable files)
          ▼
[ ☁️ Google Photos Cloud (Original Quality Upload) ]
          │
          │ (4. Upload verified by Google Photos cloud servers)
          ├─► [ 🗑️ Pixel buffer reclaimed via "Free Up Space" — automated ]
          │
          │ (5. Partner Sharing Notification)
          ▼
[ 📱 Main Phone ] (Receives notification that cloud backup is complete)
```

---

## Quick Start (15 Minutes)

1. **Prepare the Pixel:**
   Install Termux, set screen timeout to never sleep while charging, and ensure Termux has storage permissions (`termux-setup-storage`). See [docs/SETUP.md](docs/SETUP.md).
2. **Install & Configure Resilio Sync:**
   Set up camera roll sync using a **Read-Only / Receive-Only secret** on the Pixel node.
3. **Launch the V4 Operations Dashboard:**
   ```bash
   cd ~/
   git clone https://github.com/mehuljain866/Pixel-NAS.git
   cd Pixel-NAS/dashboard
   bash install.sh
   npm start
   ```
4. **Set Up Smart Power Management:**
   Plug the Pixel into a smart plug cycling power between 20% and 80% battery to prevent battery swelling. See [docs/HARDWARE_AND_BENCHMARKS.md](docs/HARDWARE_AND_BENCHMARKS.md).

---

## Pixel-NAS V4 Dashboard

The built-in Termux operations dashboard provides real-time observability and fail-safe hardware guards:

* **Live Telemetry:** Reads battery status, charging state, and filesystem capacity via native Node `fs.statfs` (no shell parsing).
* **Storage Watchdog:** Issues a warning at **48 GB** and triggers a latched stop-webhook to MacroDroid at **55 GB** (`PIXEL_NAS_STORAGE_PAUSE_GB`), preventing internal storage saturation and system bootloops.
* **Optional SQLite Ledger:** Automatically tracks observed files, calculates SHA-256 for stable media, and logs local staging history without blocking transfer I/O.
* **Network Hardened:** Binds to `127.0.0.1` by default; requires a 24+ character bearer token for remote LAN access.

<div align="center">
  <img src="assets/pixel_homescreen_widgets.png" width="45%" style="border-radius: 12px; margin: 10px auto;" alt="Pixel-NAS Home Screen Widgets" />
</div>

For full dashboard configuration, see [dashboard/README.md](dashboard/README.md).

---

## Known Limitations & Reality Check

* **Legacy Hardware Dependency:** The unlimited Original Quality backup entitlement is a historical benefit granted by Google specifically to the physical Google Pixel (2016). It is not an unconditional guarantee and depends on Google maintaining its legacy hardware policy.
* **The 30-Day Retention Quirk:** Google Photos' "Free up space" feature may retain backed-up photos and videos younger than 30 days on-device. This means buffer cleanups can legitimately free less space than expected, making the 48 GB warning and 55 GB pause guard essential.
* **Storage Saturation Guard:** If storage reaches absolute zero (e.g. 23 KB free), Android's internal SQLite databases and MTP daemons crash, requiring a factory reset. Always maintain the 55 GB storage kill-switch.
* **Battery Safety on Aging Hardware:** The original Pixel is an aging device. Never leave it charging at 100% 24/7 on a high-wattage fast charger. Use a 5W trickle charger or a smart plug with 20–80% battery automation.
* **Google Photos Version Stability:** Google Photos updates can introduce memory leaks on legacy hardware. **Google Photos v7.5 / 8.0 (January 2026 build)** has proven to be the most rock-solid release. Disable auto-updates in the Play Store.

---

## License, Author & Disclaimer

**Author:** Mehul Jain ([@mehuljain866](https://github.com/mehuljain866))  
**License:** MIT License (Code) / Creative Commons BY-NC 4.0 (Documentation).

> **Disclaimer:** This project is an independent open-source research and documentation project. It is not affiliated with, endorsed by, or associated with Google LLC, Alphabet Inc., or Resilio Inc. All product names, logos, and brands are property of their respective owners. The author assumes no responsibility or liability for any data loss, account penalties, or hardware issues resulting from the use of the workflows described herein.

*Built out of necessity. If this helps preserve your digital memories—mission accomplished.*
