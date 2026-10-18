import React, { useState } from 'react';
import { 
  Wrench, 
  LayoutDashboard, 
  TableProperties, 
  BarChart3, 
  ShieldCheck,
  CheckCircle2,
  DollarSign, 
  Plus, 
  Settings,
  Phone,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Download,
  Code2,
  Check,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { RepairJob, ShopSettings } from '../types/repair';
import { LicenseConfig, LicenseStatus } from '../types/license';
import { isBranchUser } from '../utils/license';
import { getJobWarrantyStatus } from '../utils/formatters';
import { downloadProjectZip } from '../utils/exportProjectZip';
import { PWAInstallButton } from './PWAInstallButton';
import { LicenseStatusBadge } from './LicenseStatusBadge';

export type ActiveTab = 'dashboard' | 'jobs' | 'completed_jobs' | 'revenue' | 'warranty' | 'settings' | 'tracking';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewJob: () => void;
  onOpenSettings: () => void;
  onResetData?: () => void;
  onOpenSourceCode?: () => void;
  onOpenMobileGuide?: () => void;
  onOpenLicenseManager?: () => void;
  licenseConfig?: LicenseConfig;
  licenseStatus?: LicenseStatus;
  jobs: RepairJob[];
  shopSettings: ShopSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewJob,
  onOpenSettings,
  onResetData,
  onOpenSourceCode,
  onOpenMobileGuide,
  onOpenLicenseManager,
  licenseConfig,
  licenseStatus,
  jobs,
  shopSettings,
}) => {
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const isBranch = isBranchUser();

  const handleDirectZipDownload = async () => {
    setIsDownloadingZip(true);
    setDownloadSuccess(false);
    try {
      const ok = await downloadProjectZip();
      if (ok) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const expiringCount = jobs.filter(j => {
    if (j.status !== 'delivered') return false;
    const w = getJobWarrantyStatus(j);
    return w.status === 'expiring_soon' || w.status === 'expired';
  }).length;

  const activeRepairCount = jobs.filter(j => 
    j.status === 'pending' || j.status === 'in_progress' || j.status === 'waiting_parts' || j.status === 'completed' || j.status === 'ready_to_ship'
  ).length;

  const deliveredCount = jobs.filter(j => j.status === 'delivered' || j.status === 'completed').length;

  const handleConfirmReset = () => {
    setIsConfirmResetOpen(false);
    if (onResetData) {
      onResetData();
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3500);
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo & Shop Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-mono">
                  RepairProShop
                </span>
                <div className="flex flex-col items-start">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                    ONLINE
                  </span>
                  {/* 3) ปุ่มลบงานทั้งหมด ที่ด้านบนใต้ปุ่ม online */}
                  {onResetData && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsConfirmResetOpen(true);
                      }}
                      className="mt-0.5 text-[9px] text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-600 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="ลบงานทั้งหมดออกจากทุกหน้าให้เป็น 0 เพื่อเริ่มต้นเก็บข้อมูลใหม่"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                      <span>ลบงานทั้งหมด</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="hidden sm:inline">{shopSettings.shopName}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3 h-3 text-blue-400" />
                  {shopSettings.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links: แดชบอร์ด, ตารางงานซ่อม, งานซ่อมเสร็จแล้ว, รายได้, ประกัน, ตั้งค่า */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>แดชบอร์ด</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>ตารางงานซ่อม</span>
              {activeRepairCount > 0 && (
                <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {activeRepairCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed_jobs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'completed_jobs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>งานซ่อมเสร็จแล้ว</span>
              {deliveredCount > 0 && (
                <span className="bg-emerald-800 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {deliveredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'revenue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>รายได้</span>
            </button>

            <button
              onClick={() => setActiveTab('warranty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'warranty'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ประกัน</span>
              {expiringCount > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {expiringCount}
                </span>
              )}
            </button>
          </nav>

          {/* Action Buttons: New Job & Settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewJob}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shadow-blue-600/30 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เปิดงานซ่อม</span>
              <span className="sm:hidden">เปิดงาน</span>
            </button>

            {/* Mobile / PWA Install Button (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
            {onOpenMobileGuide && !isBranch && (
              <PWAInstallButton onOpenMobileGuide={onOpenMobileGuide} />
            )}

            {/* View / Inspect All Source Code Modal (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
            {onOpenSourceCode && !isBranch && (
              <button
                onClick={onOpenSourceCode}
                title="เปิดดูและคัดลอก Source Code ทุกไฟล์"
                className="p-1.5 text-blue-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <Code2 className="w-4 h-4 text-blue-400" />
                <span className="hidden xl:inline text-[11px] font-medium text-slate-300">โค้ด</span>
              </button>
            )}

            {/* In-Memory Client Zip Download (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
            {!isBranch && (
              <button
                onClick={handleDirectZipDownload}
                disabled={isDownloadingZip}
                title="ดาวน์โหลด Source Code ทั้งหมด (.ZIP)"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center ${
                  downloadSuccess
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isDownloadingZip ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                ) : downloadSuccess ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Subscription / License Status Badge (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
            {licenseConfig && licenseStatus && onOpenLicenseManager && !isBranch && (
              <LicenseStatusBadge
                licenseConfig={licenseConfig}
                licenseStatus={licenseStatus}
                onClick={onOpenLicenseManager}
              />
            )}

            <button
              onClick={onOpenSettings}
              title="ตั้งค่าชื่อร้าน / เบอร์โทร / ช่าง / ประเภทอุปกรณ์"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Nav */}
        <div className="lg:hidden flex items-center justify-between border-t border-slate-800 py-1.5 overflow-x-auto space-x-1 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'jobs' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            ตารางงาน ({activeRepairCount})
          </button>
          <button
            onClick={() => setActiveTab('completed_jobs')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'completed_jobs' ? 'bg-emerald-600 text-white' : 'text-slate-300'
            }`}
          >
            ซ่อมเสร็จแล้ว ({deliveredCount})
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'revenue' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            รายได้
          </button>
          <button
            onClick={() => setActiveTab('warranty')}
            className={`px-2.5 py-1 rounded font-medium whitespace-nowrap ${
              activeTab === 'warranty' ? 'bg-blue-600 text-white' : 'text-slate-300'
            }`}
          >
            ประกัน ({expiringCount})
          </button>
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1 rounded font-medium whitespace-nowrap text-slate-300 hover:text-white"
          >
            ตั้งค่า
          </button>
          {/* เมนูต่ออายุการใช้งาน (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
          {onOpenLicenseManager && licenseStatus && !isBranch && (
            <button
              onClick={onOpenLicenseManager}
              className={`px-2.5 py-1 rounded font-medium whitespace-nowrap flex items-center gap-1 border ${
                licenseStatus.isExpired 
                  ? 'bg-red-900/40 text-red-300 border-red-500/40' 
                  : 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>{licenseStatus.isExpired ? 'หมดอายุ' : `อายุใช้งาน (${licenseStatus.daysRemaining}วัน)`}</span>
            </button>
          )}
          {/* เมนูติดตั้งลงมือถือ (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
          {onOpenMobileGuide && !isBranch && (
            <button
              onClick={onOpenMobileGuide}
              className="px-2.5 py-1 rounded font-medium whitespace-nowrap text-blue-300 hover:text-white bg-blue-900/40 flex items-center gap-1 border border-blue-500/30"
            >
              <Smartphone className="w-3 h-3 text-blue-400" />
              <span>ติดตั้งลงมือถือ</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal: ลบงานทั้งหมด */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ยืนยันลบงานทั้งหมดในระบบ?
                </h3>
                <p className="text-xs text-slate-500">
                  ลบข้อมูลออกจากทุกๆ หน้าให้เป็น 0 เพื่อเริ่มเก็บข้อมูลใหม่
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 mb-5 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>คำเตือน: การลบนี้ไม่สามารถกู้คืนได้</span>
              </p>
              <p className="text-rose-700 leading-relaxed">
                เมือกดปุ่มยืนยัน ข้อมูลงานซ่อมทั้งหมดในระบบจะถูกลบออกให้เป็น <strong>0 งาน</strong> ทันทีในทุกหน้า (แดชบอร์ด, ตารางงานซ่อม, งานซ่อมเสร็จแล้ว, รายได้, ประกัน) เพื่อให้คุณเริ่มเปิดรับงานซ่อมจริงใหม่ทั้งหมด
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบงานทั้งหมด (เป็น 0)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>ลบงานทั้งหมดออกจากทุกหน้าเรียบร้อยแล้ว (จำนวนงานในระบบ = 0)</span>
        </div>
      )}
    </header>
  );
};
