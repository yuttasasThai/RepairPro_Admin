import React, { useState } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenMobileGuide?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  onOpenMobileGuide,
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running in standalone PWA, hide install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setJustInstalled(true);
      }
    } else if (onOpenMobileGuide) {
      onOpenMobileGuide();
    }
  };

  if (justInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
        <Check className="w-3.5 h-3.5" />
        <span>ติดตั้งแล้ว</span>
      </div>
    );
  }

  // If Chrome/Android/Desktop has native install prompt ready
  if (isInstallable) {
    return (
      <button
        onClick={handleInstall}
        className={`flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
        title="ติดตั้งระบบลงบนหน้าจอมือถือ/คอมพิวเตอร์"
      >
        <Download className="w-3.5 h-3.5" />
        <span>ติดตั้งแอป</span>
      </button>
    );
  }

  // Otherwise, show the mobile button that opens the mobile guide/QR code
  return (
    <button
      onClick={onOpenMobileGuide}
      className={`flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${className}`}
      title="วิธีใช้งานและติดตั้งบนโทรศัพท์มือถือ (iOS / Android)"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-400" />
      <span className="hidden sm:inline">ใช้บนมือถือ</span>
    </button>
  );
};
