'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Battery, BatteryCharging, CloudUpload, Cloud, HardDrive, Smartphone, Activity } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for the telemetry data
interface StatusData {
  status: 'idle' | 'syncing' | 'uploading' | 'error';
  batteryLevel: number;
  isCharging: boolean;
  storageUsedGB: number;
  storageTotalGB: number;
  lastUpdated: string;
}

export default function Dashboard() {
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Polling logic: 1 second interval when app is open (foreground)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In production, this will hit the Termux Node.js backend
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error('Failed to fetch status');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        // Mock data for development if the server isn't running yet
        if (process.env.NODE_ENV === 'development') {
          setData({
            status: 'uploading',
            batteryLevel: 48,
            isCharging: true,
            storageUsedGB: 52.4,
            storageTotalGB: 128,
            lastUpdated: new Date().toISOString()
          });
        } else {
          setError('Disconnected from Pixel-NAS');
        }
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'text-accent-blue';
      case 'syncing': return 'text-accent-yellow';
      case 'error': return 'text-accent-red';
      default: return 'text-accent-green';
    }
  };

  const getBatteryColor = (level: number, charging: boolean) => {
    if (charging) return 'text-accent-green';
    if (level <= 20) return 'text-accent-red';
    if (level <= 50) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Activity className="w-8 h-8 animate-spin text-surface-border" />
      </div>
    );
  }

  const storagePercentage = (data.storageUsedGB / data.storageTotalGB) * 100;

  return (
    <main className="min-h-screen bg-background text-foreground p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-base border border-surface-border flex items-center justify-center">
              <Cloud className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-medium tracking-tight">Pixel-NAS</h1>
              <p className="text-sm text-gray-400">On-Demand Telemetry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-surface-base border border-surface-border">
            <span className="relative flex h-2 w-2">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", error ? "bg-accent-red" : "bg-accent-green")}></span>
              <span className={cn("relative inline-flex rounded-full h-2 w-2", error ? "bg-accent-red" : "bg-accent-green")}></span>
            </span>
            {error ? 'Disconnected' : 'Live'}
          </div>
        </header>

        {/* Main Status Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glow-card p-8 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center bg-surface-hover mb-2", getStatusColor(data.status))}>
            {data.status === 'uploading' ? (
              <CloudUpload className="w-8 h-8 animate-pulse" />
            ) : data.status === 'syncing' ? (
              <Activity className="w-8 h-8 animate-spin" />
            ) : (
              <Cloud className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-semibold capitalize tracking-tight">{data.status}</h2>
            <p className="text-sm text-gray-400 mt-1">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Storage Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glow-card p-6 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-6">
              <HardDrive className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-200">Pixel Storage Buffer</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-semibold tracking-tight">
                  {data.storageUsedGB.toFixed(1)} <span className="text-sm text-gray-500 font-normal">GB</span>
                </span>
                <span className="text-sm text-gray-500">/ {data.storageTotalGB} GB</span>
              </div>
              
              <div className="h-2 w-full bg-surface-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${storagePercentage}%` }}
                  className={cn("h-full rounded-full", storagePercentage > 85 ? "bg-accent-red" : "bg-foreground")}
                />
              </div>
            </div>
          </motion.div>

          {/* Battery Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glow-card p-6 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-200">Hardware Health</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("flex items-center justify-center", getBatteryColor(data.batteryLevel, data.isCharging))}>
                  {data.isCharging ? <BatteryCharging className="w-8 h-8" /> : <Battery className="w-8 h-8" />}
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tight">{data.batteryLevel}%</div>
                  <div className="text-sm text-gray-500">{data.isCharging ? 'Charging (Smart Hub)' : 'Discharging'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
