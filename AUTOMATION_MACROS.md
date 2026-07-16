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
**Purpose:** For the Low-Storage Workaround, the Pixel must automatically tap "Free Up Space" after a backup completes so Resilio can resume downloading the next batch. Since Google restricts API access to this function, we use UI automation to simulate physical screen taps.

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

### Tips for Success
* **Accessibility Permissions:** Both MacroDroid's UI Interaction and Tasker's AutoInput plugin require **Accessibility Services** to be enabled in Android settings to simulate screen taps.
* **Battery Restrictions:** Ensure the automation app (and AutoInput, if using Tasker) is set to **Unrestricted** battery usage in Android settings so the system doesn't kill your automations in the background.
