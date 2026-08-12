#!/bin/bash
echo "🚀 Starting Pixel-NAS Dashboard Setup..."

echo "📦 Installing required packages (Node.js, Git, Termux-API, OpenSSH)..."
pkg update -y
pkg install -y nodejs git termux-api openssh

echo "🔒 Starting SSH Server (Port 8022)..."
sshd

echo "📥 Fetching latest dashboard from GitHub..."
# Clean up old directory if it exists
rm -rf ~/Pixel-NAS
cd ~
git clone --depth 1 https://github.com/mehuljain866/Pixel-NAS.git

cd ~/Pixel-NAS/dashboard

echo "⚙️ Installing Node.js dependencies..."
npm install express cors

echo ""
echo "✅ Setup Complete!"
echo "------------------------------------------------------"
echo "To start your NAS server at any time, just type:"
echo "  cd ~/Pixel-NAS/dashboard && node server.js"
echo "------------------------------------------------------"
echo "⚠️  IMPORTANT: To allow the dashboard to see Google Photos uploads,"
echo "plug your phone into your PC and run this one-time ADB command:"
echo "  adb shell pm grant com.termux android.permission.READ_LOGS"
echo "------------------------------------------------------"
