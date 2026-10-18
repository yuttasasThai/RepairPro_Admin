import React, { useState } from 'react';
import { X, Store, RotateCcw, Save, ShieldAlert, Check, Download, FileCode, Eye, RefreshCw, Code2, Smartphone, ShieldCheck } from 'lucide-react';
import { ShopSettings } from '../types/repair';
import { downloadProjectZip } from '../utils/exportProjectZip';
import { isBranchUser } from '../utils/license';

interface ShopSettingsModalProps {
  settings: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: ShopSettings) => void;
  onResetData: () => void;
  onOpenSourceCode?: () => void;
  onOpenMobileGuide?: () => void;
  onOpenLicenseManager?: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
  onResetData,
  onOpenSourceCode,
  onOpenMobileGuide,
  onOpenLicenseManager,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadZipSuccess, setDownloadZipSuccess] = useState(false);
  const isBranch = isBranchUser();

  const handleDirectZipDownload = async () => {
    setIsDownloadingZip(true);
    setDownloadZipSuccess(false);
    try {
      const ok = await downloadProjectZip();
      if (ok) {
        setDownloadZipSuccess(true);
        setTimeout(() => setDownloadZipSuccess(false), 3000);
      }
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการลบข้อมูลงานซ่อมทั้งหมดใช่หรือไม่?\n\nข้อมูลงานซ่อมและประวัติทั้งหมดจะถูกลบออกอย่างถาวร เพื่อให้ระบบว่างเปล่าพร้อมสำหรับการเริ่มสร้างงานใหม่สำหรับใช้งานจริง')) {
      onResetData();
      alert('ลบข้อมูลงานซ่อมทั้งหมดเรียบร้อยแล้ว ระบบพร้อมเริ่มต้นรับงานใหม่');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base sm:text-lg">ตั้งค่าข้อมูลร้านและระบบ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อร้าน / ศูนย์บริการ
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LINE Official / ID (สร้าง QR อัตโนมัติ)
              </label>
              <input
                type="text"
                placeholder="เช่น @RepairProShop หรือ ไอดีไลน์"
                value={formData.lineId || ''}
                onChange={(e) => handleChange('lineId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* QR Code Live Preview */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  formData.lineId?.startsWith('http') ? formData.lineId : `https://line.me/ti/p/~${(formData.lineId || 'RepairProShop').replace('@', '')}`
                )}`}
                alt="LINE QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs">
              <strong className="text-slate-800 block">พรีวิว QR Code ไลน์ของร้าน</strong>
              <p className="text-slate-500 text-[11px] mt-0.5">
                ลูกค้าสามารถสแกน QR Code นี้จากหน้าแดชบอร์ดและใบรับซ่อมเพื่อแอดไลน์ร้านได้ทันที
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ที่อยู่ร้าน (แสดงบนใบรับซ่อม/ใบเสร็จ)
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขประจำตัวผู้เสียภาษี
              </label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระยะเวลารับประกันเริ่มต้น (วัน)
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultWarrantyDays}
                onChange={(e) => handleChange('defaultWarrantyDays', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Technicians List Management */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              รายชื่อช่างที่รับผิดชอบ ({formData.technicians?.length || 0} ท่าน)
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {(formData.technicians || []).map((tech, index) => (
                <div key={index} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                  <span className="font-medium text-slate-800">{tech}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (formData.technicians || []).filter((_, i) => i !== index);
                      handleChange('technicians', updated);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                    title="ลบรายชื่อช่างนี้"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add technician input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                id="new_tech_input"
                placeholder="พิมพ์ชื่อช่างใหม่..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      handleChange('technicians', [...(formData.technicians || []), input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new_tech_input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleChange('technicians', [...(formData.technicians || []), input.value.trim()]);
                    input.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
              >
                + เพิ่มช่าง
              </button>
            </div>
          </div>

          {/* Custom Equipment / Device Categories Management (สร้างเองในหน้าตั้งค่า) */}
          <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-indigo-950">
                ประเภทรายการอุปกรณ์ ({formData.customCategories?.length || 0} รายการ)
              </label>
              <span className="text-[10px] text-indigo-700 font-medium">
                สร้างเองเพื่อใช้ในหน้าเปิด Job
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {(formData.customCategories || []).length === 0 ? (
                <div className="text-[11px] text-slate-400 p-2 text-center bg-white rounded-lg border border-indigo-100">
                  ยังไม่มีประเภทอุปกรณ์ เพิ่มรายการด้านล่าง
                </div>
              ) : (
                (formData.customCategories || []).map((cat, index) => (
                  <div key={index} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 text-xs shadow-2xs">
                    <span className="font-medium text-slate-800">{cat}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.customCategories || []).filter((_, i) => i !== index);
                        handleChange('customCategories', updated);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                      title="ลบประเภทอุปกรณ์นี้"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add category input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                id="new_category_input"
                placeholder="เช่น ทีวี, ตู้เย็น, กล้องวงจรปิด, เครื่องเสียง..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      handleChange('customCategories', [...(formData.customCategories || []), input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('new_category_input') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleChange('customCategories', [...(formData.customCategories || []), input.value.trim()]);
                    input.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                + เพิ่มประเภท
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เงื่อนไขการรับประกันเริ่มต้น
            </label>
            <textarea
              rows={2}
              value={formData.defaultWarrantyTerms}
              onChange={(e) => handleChange('defaultWarrantyTerms', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Export / Download Source Code / Multi-Device (ไม่แสดงสำหรับผู้ใช้งานลิงค์สาขา) */}
          {!isBranch && (
            <div className="pt-3 border-t border-slate-200">
              <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 p-4 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm block">ดาวน์โหลด Source Code โปรเจกต์ (.ZIP)</span>
                      <span className="text-[11px] text-slate-600">ดาวน์โหลดโค้ดโปรเจกต์ทั้งหมดเพื่อนำไปติดตั้งหรือสำรองข้อมูล</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDirectZipDownload}
                    disabled={isDownloadingZip}
                    className={`w-full sm:w-auto flex-1 px-4 py-2.5 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all ${
                      downloadZipSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                    }`}
                  >
                    {isDownloadingZip ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังสร้างไฟล์ ZIP ในเครื่อง...</span>
                      </>
                    ) : downloadZipSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-200" />
                        <span>ดาวน์โหลดสำเร็จแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>ดาวน์โหลดไฟล์ .ZIP ทันที</span>
                      </>
                    )}
                  </button>

                  {onOpenSourceCode && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSourceCode();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>เปิดดู / คัดลอกโค้ดทุกไฟล์</span>
                    </button>
                  )}

                  {onOpenMobileGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMobileGuide();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>วิธีติดตั้งบนมือถือ</span>
                    </button>
                  )}

                  {onOpenLicenseManager && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenLicenseManager();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>อายุการใช้งาน & ลิงก์แยกเครื่อง</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reset / Clear Data Button */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 text-xs block">ล้างรายการงานซ่อมทั้งหมด</span>
                <span className="text-[11px] text-slate-500">ล้างข้อมูลงานทั้งหมดเพื่อเริ่มระบบใหม่จาก 0</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ล้างข้อมูล</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
