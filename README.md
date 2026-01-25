# Pixel-NAS
An offline-to-cloud automated photo backup system using old Google Pixel phones with unlimited Google Photos storage.

# Pixel NAS: A Low-Cost, Automated Cloud Backup System using Legacy Google Pixel

Welcome to **Pixel NAS**, a DIY project that turns a legacy Google Pixel device into a low-power, automated, wireless photo and video backup system — completely free from monthly cloud storage charges. [Please refer to the newest version VX to get the latest updates regarding this project.]

---

## 🚀 Project Origin

> In Grade 9, I discovered that my family's precious photo memories were scattered — across drives, SD cards, and old phones. We’d lost photos due to phone thefts, hardware failures, and unbacked-up devices. This sparked a personal mission: build a reliable, cost-effective backup system.

This repo documents a fully-functional system I created using a **free Google Pixel 2 XL** salvaged from a school e-waste drive. It now acts as a **Google Photos-based NAS**, backing up over **1 TB of data** from multiple devices, including:
- My phone
- My tablet
- My parents’ phones
- My 500GB hard drive (manually loaded via tablet + Resilio Sync)

All without any physical server rack or commercial subscription.

---

## 🧠 Key Features

- 📸 **Unlimited backup** via Google Photos' legacy Pixel benefits (Pixel 1 = full quality, Pixel 2 or later = storage saver)
- 🔋 **Smart external UPS setup** using a power bank permanently wall-connected
- 🔁 **Auto deletion** of backed-up photos from Pixel storage to manage 64GB limit
- 🔄 **Real-time syncing** from phone/tablet via Resilio Sync
- 🌐 **Cross-device access** on phones, tablets, laptops, even TVs
- 🧽 **Free up space** on source devices weekly using Google Photos' "Free up device storage"

---

## 🛠️ Hardware Required

| Item                          | Recommendation                        | Cost (Est.)        |
|-------------------------------|---------------------------------------|--------------------|
| Google Pixel 1 / 2 (Unlocked) | Pixel 1 (128GB) or Pixel 2 XL         | ₹5,000–₹12,000     |
| Power Bank (10,000+ mAh)      | With passthrough charging             | ₹800–₹1,500        |
| WiFi                          | Any stable home Wi-Fi [try 30 Mbps+]  | N/A [existing plan]|
| (Optional) Tablet/Hard Drive  | For offloading larger files           | Existing device    |

---

## 📋 Software Stack

- [Google Photos](https://photos.google.com/): Cloud backup & sync
- [Resilio Sync (Free)](https://www.resilio.com/): Real-time device syncing
- Android File Manager / Battery saver settings

---

## 📦 Pixel NAS Setup: Step-by-Step

### 🔧 1. Get the Pixel
- Find a **Pixel 1 (128GB)** or **Pixel 2 XL** with bootloader unlocked.
- Ensure it's still eligible for **legacy backup benefits**.
- Flash stock Android (if needed) to remove Google lock.

### 🔄 2. Reset and Prep
- Perform full factory reset
- Uninstall bloatware
- Log in with **backup-dedicated Google account**

### 🔋 3. Set Up Smart Charging
- Connect phone to a **wall-powered power bank**
- Enable **Battery Saver + Adaptive Charging**
- Ensure device stays in low charge loop (~80%)

### 🔁 4. Enable Google Photos
- Open **Google Photos** app
- Enable backup with **Storage Saver** or **Original Quality**
- Select **ALL folders** for backup (DCIM, Screenshots, WhatsApp, etc.)

### 📶 5. Set Up Resilio Sync
- Install Resilio Sync on **Pixel + phone/tablet**
- Add folders from main device → Generate QR code
- Scan QR from Pixel → **auto-sync setup complete**
- Disable **selective sync** on both devices for the perticular folder.

### 🔄 6. Use Workflow Weekly
- Plug in Pixel 1–2 × per week for ~1 hour
- Keep it WiFi-connected and idle in drawer or any safe dry and cool
- Use Google Photos' "Free up space" monthly to clear internal storage and remove local copies from your devices.

---

## 📁 Buffer vs Sync Mode

Pixel NAS supports 2 modes:

| Mode        | Behavior                                                                       |
|-------------|--------------------------------------------------------------------------------|
| Buffer Mode | Files are synced and backed up, but deletion on pixel won’t delete on phone    |
| Sync Mode   | Pixel mirrors the phone – delete on pixel = delete from phone (after 30 days)  |

Choose what works best for your backup philosophy.

---

## 🔍 Known Limitations
- Pixel 2 has only **64GB**; use Pixel 1 128GB for larger buffers
- Pixel will **not backup from USB drives directly**
- Resilio Sync doesn't preserve metadata if not configured properly [for me it has for more than 95% of the times]

---

## 💡 Recommendations
- For RAW or 4K workflows, use **Pixel 1 128GB** so backups can happen in original quality
- Regularly use "Free up space" to manage storage
- Use **Google account with no other Drive usage** to avoid quota errors [not that important]

---

## 📈 Future Ideas
- Add thermal monitoring / smart charging relay
- Create Android app for interface abstraction

---

## 🧾 License

This project is released under the **MIT License** for code, and **Creative Commons BY-NC 4.0** for documentation.

> TL;DR: Use it freely, modify it, but **don’t sell it without credit or permission**.

---

## 👋 Acknowledgments
- Inspired by [Google Pixel's legacy backup promise]
- Special thanks to my **parents**, **school e-waste drive**, and **curiosity** :)

---

## 📣 Author

**Mehul Jain** — [GitHub Profile](https://github.com/mehuljain866)  
JEE aspirant • Tinkerer • Tech Humanist

Feel free to fork, share, and build your own version of **Pixel NAS**. If this helps preserve your digital memories — mission accomplished!
