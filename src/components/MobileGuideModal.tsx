import React, { useState } from 'react';
import { 
  Smartphone, 
  X, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle, 
  ExternalLink, 
  QrCode, 
  Copy, 
  Check, 
  Globe, 
  Sparkles,
  Camera,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileGuideModal: React.FC<MobileGuideModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android' | 'qr'>('ios');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    }
  };

  // Generate QR code image URL using quickchart / qr server
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>วิธีใช้งานบนโทรศัพท์มือถือ</span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30 font-medium">
                  PWA App
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ติดตั้งเป็นแอปบนหน้าจอโฮม ใช้งานเต็มจอ ถ่ายรูป ลื่นไหลเหมือนแอปแท้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Direct Install Banner if Available */}
        {isInstallable && !isInstalled && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3.5 text-white flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
              <span>อุปกรณ์ของคุณพร้อมติดตั้งทันทีใน 1 คลิก!</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-700 hover:bg-blue-50 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ติดตั้งเลย</span>
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivePlatformTab('ios')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatformTab === 'ios'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>iPhone / iPad</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('android')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatformTab === 'android'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('qr')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activePlatformTab === 'qr'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>สแกน QR Code</span>
            </button>
          </div>

          {/* Content by Tab */}
          {activePlatformTab === 'ios' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      เปิดลิงก์นี้ใน <strong>Safari</strong> บน iPhone หรือ iPad
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      (แนะนำให้เปิดด้วย Safari เพื่อรองรับการติดตั้งลงหน้าจอโฮมอย่างสมบูรณ์)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                      กดปุ่ม <strong>แชร์ (Share)</strong> <Share className="w-3.5 h-3.5 text-blue-600 inline" /> แถบล่างของ Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                      เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      กด <strong>"เพิ่ม" (Add)</strong> มุมขวาบน
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ไอคอนแอป RepairProShop จะไปอยู่บนหน้าจอมือถือของคุณทันที กดเข้าใช้งานได้ตลอดเวลา
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatformTab === 'android' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      เปิดลิงก์ในเบราว์เซอร์ <strong>Google Chrome</strong> บนมือถือ
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      กดจุด 3 จุด <strong>(⋮)</strong> ที่มุมบนขวาของ Chrome
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 flex items-center gap-1">
                      เลือก <strong>"ติดตั้งแอป" (Install app)</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      กด <strong>"ติดตั้ง" (Install)</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ระบบจะสร้างไอคอนแอปรองรับการใช้งานแบบเต็มหน้าจอ ไม่ติดแถบ URL เบราว์เซอร์
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatformTab === 'qr' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center">
                <p className="text-xs font-semibold text-slate-700 mb-3">
                  ใช้กล้องมือถือส่อง QR Code ด้านล่างนี้เพื่อเปิดแอปทันที
                </p>
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code สำหรับเปิดบนมือถือ" 
                    className="w-44 h-44 object-contain mx-auto"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-3">
                  เปิดกล้องโทรศัพท์ (iOS หรือ Android) แล้วชี้มาที่ QR Code ด้านบน ลิงก์จะเด้งขึ้นมาให้เปิดทันทีครับ
                </p>
              </div>
            </div>
          )}

          {/* Quick Copy Link Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" />
                <span>ลิงก์ระบบของคุณ (URL)</span>
              </div>
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-xs text-slate-700 font-mono select-all focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs ${
                copiedUrl
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>
          </div>

          {/* Feature Highlights on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Camera className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>ถ่ายรูปแนบหลักฐานส่งมอบผ่านมือถือได้ทันที</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>อัปเดตสถานะงานซ่อมสะดวกทุกที่ทุกเวลา</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {isInstalled ? '✓ ติดตั้งบนอุปกรณ์นี้เรียบร้อยแล้ว' : 'รองรับทั้ง iOS Safari และ Android Chrome'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
