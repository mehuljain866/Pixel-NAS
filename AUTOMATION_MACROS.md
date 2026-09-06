# Pixel-NAS Automation Macros (MacroDroid & Tasker)

This document outlines the step-by-step logic required to build the automations discussed in the Pixel-NAS project. You can use either **MacroDroid** (easier, visual, no-code) or **Tasker** (more powerful, slightly steeper learning curve).

---

## 1. The Wi-Fi Watchdog (Auto-Launch Resilio)
**Purpose:** Android background memory management can sometimes put Resilio Sync to sleep. This macro forces Resilio to wake up and start syncing the exact moment the Pixel detects your home Wi-Fi network.

### Option A: MacroDroid
* **Trigger:** `Connectivity` ➡️ `Wi-Fi SSID Transition` ➡️ `Connected to Network` ➡️ *(Type your home Wi-Fi name)*
* **Action:** `Applications` ➡️ `Launch Application` ➡️ select `Resilio Sync`
* **Constraint:** `Battery/Power` ➡️ `Power Connected` ➡️ `Any`

### Option B: Tasker
* **Profile:** `State` ➡️ `Net` ➡️ `Wifi Connected` ➡️ *(Enter your SSID)*
* **Task:**
  1. `App` ➡️ `Launch App` ➡️ select `Resilio Sync`

---

## 2. The "Daisy Chain" Ghost Purge (Advanced)
**Purpose:** For the Low-Storage Workaround, the Pixel must automatically tap "Free Up Space" after a backup completes so Resilio can resume downloading the next batch. Since Google restricts API access to this function, this setup uses UI automation to simulate physical screen taps.

### Option A: MacroDroid
* **Trigger:** `Device Events` ➡️ `Notification` ➡️ `Notification Received` ➡️ Select `Google Photos` ➡️ Text contains: `"Backup complete"`
* **Actions (Executed in sequence):**
  1. `Screen` ➡️ `Screen On/Off` ➡️ `Turn Screen On`
  2. `Device Actions` ➡️ `UI Interaction` ➡️ `Click` ➡️ `Identify in App` (Tap the top-right Profile icon).
  3. `MacroDroid Specific` ➡️ `Wait Before Next Action` ➡️ `2 seconds`
  4. `Device Actions` ➡️ `UI Interaction` ➡️ `Click` ➡️ `Text Content` ➡️ `"Free up space"`
  5. `MacroDroid Specific` ➡️ `Wait Before Next Action` ➡️ `2 seconds`
  6. `Device Actions` ➡️ `UI Interaction` ➡️ `Click` ➡️ `Text Content` ➡️ `"Free up space"` (The final confirmation button).
  7. `MacroDroid Specific` ➡️ `Wait Before Next Action` ➡️ `10 seconds`
  8. `Screen` ➡️ `Screen On/Off` ➡️ `Turn Screen Off`

### Option B: Tasker (Requires the 'AutoInput' Plugin)
* **Profile:** `Event` ➡️ `UI` ➡️ `Notification` ➡️ Owner Application: `Google Photos`, Text: `Backup complete`
* **Task:**
  1. `Display` ➡️ `Turn On`
  2. `App` ➡️ `Launch App` ➡️ `Google Photos`
  3. `Task` ➡️ `Wait` ➡️ `2 Seconds`
  4. `Plugin` ➡️ `AutoInput` ➡️ `Action` ➡️ Configuration: Action `Click`, Field Type `Id` *(Use AutoInput's Easy Setup mode to visually select the Profile icon).*
  5. `Task` ➡️ `Wait` ➡️ `2 Seconds`
  6. `Plugin` ➡️ `AutoInput` ➡️ `Action` ➡️ Configuration: Action `Click`, Field Type `Text`, Value: `Free up space`
  7. `Task` ➡️ `Wait` ➡️ `2 Seconds`
  8. `Plugin` ➡️ `AutoInput` ➡️ `Action` ➡️ Configuration: Action `Click`, Field Type `Text`, Value: `Free up space`
  9. `Task` ➡️ `Wait` ➡️ `10 Seconds`
  10. `Display` ➡️ `System Lock`

---

## 3. Battery Guard (Webhook to Smart Plug)
**Purpose:** Communicate with your Smart Home (Home Assistant/IFTTT) to toggle the Pixel's smart plug based on actual battery percentage rather than a time schedule.

### Option A: MacroDroid
* **Trigger 1 (Turn OFF):** `Battery/Power` ➡️ `Battery Level` ➡️ `Increases to 80%`
  * **Action:** `Applications` ➡️ `HTTP Request` ➡️ *(Insert Turn OFF Webhook URL)*
* **Trigger 2 (Turn ON):** `Battery/Power` ➡️ `Battery Level` ➡️ `Decreases to 20%`
  * **Action:** `Applications` ➡️ `HTTP Request` ➡️ *(Insert Turn ON Webhook URL)*

### Option B: Tasker
* **Profile 1 (Turn OFF):** `State` ➡️ `Power` ➡️ `Battery Level` ➡️ From `80` To `100`
  * **Task:** `Net` ➡️ `HTTP Request` ➡️ Method: `POST/GET`, URL: *(Insert Turn OFF Webhook URL)*
* **Profile 2 (Turn ON):** `State` ➡️ `Power` ➡️ `Battery Level` ➡️ From `0` To `20`
  * **Task:** `Net` ➡️ `HTTP Request` ➡️ Method: `POST/GET`, URL: *(Insert Turn ON Webhook URL)*

---

## 4. Primary Phone Battery Optimization: End-of-Day Batch Sync (Samsung Modes & Routines)
**Purpose:** On your daily driver (especially Samsung Galaxy devices running One UI), leaving Resilio Sync running 24/7 in the background can trigger Android/Device Care system warnings (*"App draining battery in the background"*). Furthermore, aggressive OEM background task killers often sleep or throttle P2P services. 

Rather than letting Resilio run continuously and burn battery, this automation triggers sync in a single, high-speed burst at the end of the day—syncing all newly captured photos/videos at once without any daily background drain.

### Option A: Samsung Modes & Routines (Native — No Third-Party Apps Needed)
* **If:**
  * `Time period` ➡️ e.g., `11:00 PM – 11:05 PM` (or `Charging status` ➡️ `Charging` + `Wi-Fi network` ➡️ `Connected to Home Wi-Fi`)
* **Then:**
  1. `Apps` ➡️ `Open an app or do an app action` ➡️ Select `Resilio Sync`
  2. `Wait before next action` ➡️ `5–10 seconds` (allows Resilio's foreground service to initialize peer discovery and start the delta sync)
  3. `Apps` ➡️ `Close app` ➡️ Select `Resilio Sync` (or `Navigation` ➡️ `Go to Home screen`)
* **Result:** Resilio is pulled into the foreground, immediately handshakes with the Pixel-NAS node, and processes the day's queue. Once initiated, transfer completes seamlessly without needing constant 24/7 background socket monitoring.

### Option B: MacroDroid / Tasker (Any Android OEM)
* **Trigger:** `Time of Day` ➡️ `11:00 PM` (or `Power Connected` + `Connected to Home SSID`)
* **Actions:**
  1. `Launch Application` ➡️ `Resilio Sync`
  2. `Wait 10 seconds`
  3. `Kill Background Process` / `Return to Home Screen`

---

## 5. The Pixel Node Biometric Wake-and-Sync Gate (Rear Fingerprint Trigger)
**Purpose:** A physical, zero-swipe ergonomic routine designed specifically for the **Google Pixel node** to instantly wake the sync engine and guarantee peer handshakes with zero navigation.

### The Physical Workflow:
1. **Frontmost App Preparation:** Leave **Resilio Sync** (and Google Photos) open in your recent apps tray on the Pixel, with Resilio Sync active on screen before the display times out or locks.
2. **Physical Ergonomics & Hardware Form Factor:**
   * **Wall-Mounted Mode (Suspended on Socket):** When the Pixel 2 XL is hanging from a wall outlet using the All-in-One velcro-charger build, you can casually reach down and rest your index finger on the rear fingerprint sensor (*Pixel Imprint*). The phone unlocks instantly straight into Resilio Sync.
   * **Desk-Stand Mode (Charger Kickstand):** When propped upright on a table or nightstand, reach behind the phone to touch the rear fingerprint scanner. The side buttons remain fully accessible—simply tap lightly on the power button (on the right edge) to turn the screen back off once sync begins.
3. **Immediate Foreground Wake:** Unlocking directly into the open Resilio Sync app pulls the P2P daemon to the active foreground. If syncing was idle, paused, or throttled by Android's background Doze mode, this foreground transition immediately triggers peer discovery and begins ingesting queued photos from your client devices.
4. **Instant Screen-Off:** Because the side lock/power button is always clearly exposed in both the suspended and stand positions, a light tap immediately turns the screen off while the active transfer continues running uninterrupted in the background.

> 💡 **Why this is powerful:** It turns the Pixel's rear fingerprint sensor into a tactile, physical "sync switch." You never have to swipe through menus, type PINs, or navigate apps—just reach, touch the fingerprint sensor to wake the sync pipeline, and click the power button to lock.

---

### OEM Background Limitations & Why Batch Syncing Has Zero Downsides
* **The Root Cause:** Samsung's One UI (and similar aggressive battery managers from Xiaomi, OnePlus, and Huawei) heavily penalizes persistent TCP/UDP listening sockets. Even with battery optimization set to "Unrestricted," Android's power manager will eventually flag Resilio Sync.
* **Manufacturer-Level Limitation:** Until OEMs or Resilio issue a targeted firmware/app update to modernize background socket negotiation, background warnings cannot be entirely eliminated if the app runs 24/7.
* **The Clean Fix:** The end-of-day batch routine has **zero downsides**. Photos captured during the day remain perfectly safe in local phone storage; then, late at night on home Wi-Fi and charger, the entire daily payload syncs to the Pixel in one rapid burst, which then seamlessly uploads to Google Photos while you sleep.

---

### Tips for Success
* **Accessibility Permissions:** Both MacroDroid's UI Interaction and Tasker's AutoInput plugin require **Accessibility Services** to be enabled in Android settings to simulate screen taps.
* **Battery Restrictions:** Ensure the automation app (and AutoInput, if using Tasker) is set to **Unrestricted** battery usage in Android settings so the system doesn't kill your automations in the background.
