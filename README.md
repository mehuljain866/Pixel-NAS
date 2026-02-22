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

> ### **🛰️ Advanced: Universal File Storage**

### **The Synergy: Pixel-NAS + BitStream**
While **Pixel-NAS** provides the "unlimited highway" to the cloud via legacy Google Pixels, it is traditionally limited to photos and videos. **BitStream** acts as the "cargo container," allowing you to disguise any file—EXEs, PPTs, or database backups—as a video that Google Photos will happily store for free.

---

### **1. Professional Folder Naming Suggestion**
Instead of "Important PPTs," use a naming convention that is easy to search in Google Photos but looks organized. 
*   **Recommendation:** `ARCHIVE_[ProjectName]_[Date]`
*   **Example:** `ARCHIVE_Client_Alpha_Deliverables_2023`
*   **Why:** Google Photos' search engine is powerful; searching "ARCHIVE" or "Deliverables" will instantly pull up the encoded video [User Query].

---

### **2. The "Universal Pipeline" Workflow**
You can add this section to your **Pixel-NAS README** to show users how to expand its capabilities:

#### **📦 Beyond Media: Storing ANY File with BitStream**
Standard Pixel-NAS only backs up photos and videos. To backup software, documents, or archives, use the **[BitStream](https://github.com/mehuljain866/BitStream)** pipeline:

1.  **Pack:** Place your sensitive files (e.g., `Strategic_Project_Files`) into the BitStream `input/` folder.
2.  **Encode:** Run BitStream to convert that folder into a lossless **FFV1 AVI video**. 
3.  **Sync:** BitStream’s output folder is linked to **Resilio Sync**. 
4.  **Upload:** Your Pixel-NAS phone detects the new video and uploads it to Google Photos.
5.  **Index:** Because Google Photos indexes video filenames, you can find your data vault just by searching the folder name [User Query].
6.  **Recover:** Download the video from Google Photos and run it through BitStream’s **Decode** function to get your original folder back.

---

###  **3. Why This Works (Technical Validation)**
*   **Integrity:** By using a resolution like **256x256** or **1024x1024** and the **FFV1 codec**, you ensure that Google Photos does not damage the underlying data bits.
*   **Indexing:** You are leveraging Google’s world-class visual indexing. If you name your BitStream output `Finance_Records_2024.avi`, it becomes a searchable, permanent cloud entry [User Query].
*   **Loophole Synergy:** You are using the Pixel-NAS "Unlimited Original Quality" or "Storage Saver" benefit to host a binary bitstream disguised as a Motion JPEG or FFV1 video.

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
