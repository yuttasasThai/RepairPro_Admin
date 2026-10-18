import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  Key, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Smartphone, 
  Share2, 
  Lock, 
  Unlock, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MessageCircle, 
  Crown, 
  HelpCircle, 
  Layers,
  ShieldAlert,
  Send,
  EyeOff
} from 'lucide-react';
import { LicenseConfig, LicenseStatus } from '../types/license';
import { 
  applyRenewalCode, 
  generateActivationCode, 
  buildBranchUrl, 
  getActiveTenantId, 
  saveStoredLicense,
  DEFAULT_CONTACT_NAME,
  DEFAULT_CONTACT_PHONE,
  DEFAULT_CONTACT_PHONE_RAW,
  DEFAULT_CONTACT_LINE
} from '../utils/license';

interface LicenseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseConfig: LicenseConfig;
  licenseStatus: LicenseStatus;
  onLicenseUpdated: (newConfig: LicenseConfig) => void;
  initialTab?: 'status' | 'multidevice' | 'admin';
}

export const LicenseManagerModal: React.FC<LicenseManagerModalProps> = ({
  isOpen,
  onClose,
  licenseConfig,
  licenseStatus,
  onLicenseUpdated,
  initialTab = 'status',
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'multidevice' | 'admin'>(initialTab);

  // Renewal input
  const [renewalCode, setRenewalCode] = useState('');
  const [renewalMsg, setRenewalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Multi-device generator
  const [customBranchName, setCustomBranchName] = useState('branch-01');
  const [copiedBranchUrl, setCopiedBranchUrl] = useState(false);
  const activeTenant = getActiveTenantId();

  // Admin PIN & Controls
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinError, setAdminPinError] = useState('');

  // Admin Settings editable
  const [editExpiresAt, setEditExpiresAt] = useState(
    licenseConfig.expiresAt ? licenseConfig.expiresAt.slice(0, 10) : ''
  );
  const [isLifetimeSetting, setIsLifetimeSetting] = useState(!licenseConfig.expiresAt);
  const [editContactName, setEditContactName] = useState(licenseConfig.contactName || DEFAULT_CONTACT_NAME);
  const [editPhone, setEditPhone] = useState(licenseConfig.contactPhone || DEFAULT_CONTACT_PHONE);
  const [editLineId, setEditLineId] = useState(licenseConfig.contactLineId || DEFAULT_CONTACT_LINE);
  const [editNewPin, setEditNewPin] = useState(licenseConfig.adminPin || '1234');
  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);

  // Admin Code Generator
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedGeneratedCode, setCopiedGeneratedCode] = useState(false);

  // Copy helper
  const [copiedContactPhone, setCopiedContactPhone] = useState(false);
  const [copiedContactLine, setCopiedContactLine] = useState(false);

  if (!isOpen) return null;

  const currentBranchUrl = buildBranchUrl(customBranchName || 'branch-01');
  const contactName = licenseConfig.contactName || DEFAULT_CONTACT_NAME;
  const contactPhone = licenseConfig.contactPhone || DEFAULT_CONTACT_PHONE;
  const rawPhone = contactPhone.replace(/[^0-9]/g, '') || DEFAULT_CONTACT_PHONE_RAW;
  const contactLine = licenseConfig.contactLineId || DEFAULT_CONTACT_LINE;
  const lineUrl = `https://line.me/R/ti/p/${encodeURIComponent(contactLine)}`;

  const handleApplyRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    setRenewalMsg(null);
    if (!renewalCode.trim()) {
      setRenewalMsg({ type: 'error', text: 'กรุณากรอกรหัสต่ออายุ' });
      return;
    }

    const res = applyRenewalCode(renewalCode, licenseConfig);
    if (res.success) {
      setRenewalMsg({ type: 'success', text: res.message });
      onLicenseUpdated(res.updatedConfig);
      setRenewalCode('');
    } else {
      setRenewalMsg({ type: 'error', text: res.message });
    }
  };

  const handleCopy = (text: string, cb: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    cb(true);
    setTimeout(() => cb(false), 2000);
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError('');
    const targetPin = licenseConfig.adminPin || '1234';
    if (adminPinInput.trim() === targetPin) {
      setIsAdminUnlocked(true);
      setAdminPinInput('');
    } else {
      setAdminPinError('รหัส PIN ไม่ถูกต้อง (รหัสเริ่มต้นคือ 1234)');
    }
  };

  const handleSaveAdminConfig = () => {
    const newConfig: LicenseConfig = {
      ...licenseConfig,
      expiresAt: isLifetimeSetting ? null : (editExpiresAt ? new Date(editExpiresAt).toISOString() : null),
      contactName: editContactName.trim() || DEFAULT_CONTACT_NAME,
      contactPhone: editPhone.trim() || DEFAULT_CONTACT_PHONE,
      contactLineId: editLineId.trim() || DEFAULT_CONTACT_LINE,
      adminPin: editNewPin.trim() || '1234',
      planName: isLifetimeSetting 
        ? 'ตลอดชีพ (Lifetime)' 
        : (editExpiresAt ? `กำหนดวันสิ้นสุด (${editExpiresAt})` : licenseConfig.planName),
    };

    saveStoredLicense(newConfig);
    onLicenseUpdated(newConfig);
    setAdminSaveSuccess(true);
    setTimeout(() => setAdminSaveSuccess(false), 2500);
  };

  const handleGenerateCode = (days: number | 'lifetime') => {
    const code = generateActivationCode(days);
    setGeneratedCode(code);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ระบบต่ออายุ & ลิงก์แยกสาขา</h3>
              <p className="text-xs text-slate-300">
                ดูแลโดยแอดมิน: <strong className="text-blue-300">{contactName}</strong> โทร {contactPhone} LINE: {contactLine}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>สถานะ & แพ็กเกจต่ออายุ</span>
          </button>

          <button
            onClick={() => setActiveTab('multidevice')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'multidevice'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>สร้างลิงก์สาขา (ทดลองใช้ฟรี 7 วัน)</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>แผงควบคุมผู้ดูแล (Admin)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">

          {/* TAB 1: STATUS & RENEWAL */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              
              {/* Status Card */}
              <div className={`p-5 rounded-2xl border ${
                licenseStatus.isExpired
                  ? 'bg-red-50 border-red-200'
                  : licenseStatus.isExpiringSoon
                  ? 'bg-amber-50 border-amber-200'
                  : licenseStatus.isLifetime
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      licenseStatus.isExpired
                        ? 'bg-red-100 text-red-600'
                        : licenseStatus.isExpiringSoon
                        ? 'bg-amber-100 text-amber-600'
                        : licenseStatus.isLifetime
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {licenseStatus.isLifetime ? (
                        <Crown className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          แพ็กเกจปัจจุบัน:
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white shadow-xs border border-slate-200">
                          {licenseStatus.planName}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold mt-1 text-slate-900">
                        {licenseStatus.isLifetime
                          ? 'เปิดใช้งานตลอดชีพ (ไม่มีวันหมดอายุ)'
                          : licenseStatus.isExpired
                          ? 'ระยะเวลาการใช้งานสิ้นสุดแล้ว'
                          : `เหลือระยะเวลาใช้งานอีก ${licenseStatus.daysRemaining} วัน`}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        สิ้นสุดวันที่: <strong className="text-slate-800">{licenseStatus.expiresAtFormatted}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:self-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      licenseStatus.isExpired
                        ? 'bg-red-600 text-white'
                        : licenseStatus.isExpiringSoon
                        ? 'bg-amber-600 text-white'
                        : licenseStatus.isLifetime
                        ? 'bg-yellow-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {licenseStatus.isExpired ? 'หมดอายุ' : 'สถานะปกติ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewal Options Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>ตัวเลือกแพ็กเกจต่ออายุการใช้งาน:</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    🌟 ทดลองใช้ฟรี 7 วันแรก
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xs text-slate-400">รายเดือน</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">ต่ออายุ 30 วัน</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xs text-slate-400">รายไตรมาส (3 เดือน)</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">ต่ออายุ 90 วัน</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xs text-slate-400">รายครึ่งปี (6 เดือน)</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">ต่ออายุ 180 วัน</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
                    <div className="text-xs text-slate-400">รายปี</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">ต่ออายุ 360 วัน</div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-xl border border-yellow-300 text-center shadow-xs col-span-2 sm:col-span-2 flex flex-col justify-center">
                    <div className="text-xs text-yellow-700 font-semibold flex items-center justify-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-yellow-600" />
                      <span>สิทธิ์ถาวร</span>
                    </div>
                    <div className="text-sm font-bold text-yellow-900 mt-0.5">ต่ออายุ ตลอดชีพ (Lifetime)</div>
                  </div>
                </div>
              </div>

              {/* Contact Admin for Renewal */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>ติดต่อแอดมิน เพื่อขอรับรหัสต่ออายุ / สมัครใช้งาน</span>
                  </h4>
                  <span className="text-xs font-bold text-blue-800">{contactName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
                    <div>
                      <div className="text-[11px] text-slate-400">เบอร์โทรศัพท์ (คลิกเพื่อโทร)</div>
                      <a 
                        href={`tel:${rawPhone}`}
                        className="text-sm font-bold text-slate-800 hover:text-blue-600 transition"
                      >
                        {contactPhone}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(contactPhone, setCopiedContactPhone)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="คัดลอกเบอร์โทร"
                    >
                      {copiedContactPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 shadow-xs">
                    <div>
                      <div className="text-[11px] text-slate-400">LINE Official / ID (คลิกเพื่อเปิด)</div>
                      <a 
                        href={lineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-emerald-700 hover:text-emerald-800 transition"
                      >
                        {contactLine}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(contactLine, setCopiedContactLine)}
                      className="p-1.5 text-slate-500 hover:text-green-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="คัดลอก LINE ID"
                    >
                      {copiedContactLine ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Enter Activation Code */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>กรอกรหัสต่ออายุ (Activation Code)</span>
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  นำรหัสที่ได้รับจากแอดมินช่างหน่อยชุมแพ มากรอกที่นี่เพื่อเพิ่มวันใช้งานได้ทันที
                </p>

                <form onSubmit={handleApplyRenewal} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={renewalCode}
                      onChange={(e) => setRenewalCode(e.target.value.toUpperCase())}
                      placeholder="กรอกรหัส เช่น RENEW-30 หรือ ACT-..."
                      className="flex-1 px-3.5 py-2.5 text-sm font-mono uppercase bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-wider"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition whitespace-nowrap cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>ยืนยันต่ออายุ</span>
                    </button>
                  </div>

                  {renewalMsg && (
                    <div className={`text-xs p-3 rounded-lg flex items-center space-x-2 ${
                      renewalMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {renewalMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{renewalMsg.text}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400">รหัสต่ออายุมาตรฐาน:</span>
                    <button
                      type="button"
                      onClick={() => setRenewalCode('RENEW-30')}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      RENEW-30 (+30วัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewalCode('RENEW-90')}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      RENEW-90 (+90วัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewalCode('RENEW-180')}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      RENEW-180 (+180วัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewalCode('RENEW-360')}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                    >
                      RENEW-360 (+360วัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewalCode('LIFETIME-PRO')}
                      className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                    >
                      LIFETIME-PRO (ตลอดชีพ)
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 2: MULTI-DEVICE & INDEPENDENT BRANCH LINKS */}
          {activeTab === 'multidevice' && (
            <div className="space-y-6">
              
              {/* Question & Answer Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-600/30 rounded-xl text-blue-400 shrink-0 mt-0.5">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      การใช้งานกับโทรศัพท์เครื่องอื่นหลายๆ เครื่อง & ลิงก์แยกสาขา
                    </h4>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      ข้อมูลในเว็บ<strong>จะไม่ถูกแก้ไขปนกันครับ!</strong> เนื่องจากระบบบันทึกใน Local Storage ของแต่ละเครื่องอิสระ และสามารถสร้างลิงก์แยกสาขาได้ตามต้องการ:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>ทดลองใช้ฟรี 7 วัน</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ทุกลิงก์สาขาที่สร้างใหม่จะได้รับสิทธิ์ทดลองใช้งานฟรี 7 วันทันที
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs sm:text-sm">
                      <Layers className="w-4 h-4 shrink-0" />
                      <span>แยกฐานข้อมูล 100%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ข้อมูลบิลงานซ่อมและการตั้งค่าแยกตามรหัสสาขา ไม่ทับซ้อนกันแน่นอน
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs sm:text-sm">
                      <EyeOff className="w-4 h-4 shrink-0" />
                      <span>ซ่อนเมนูแอดมิน</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ลิงก์สาขาจะมองไม่เห็นเมนูต่ออายุ, เมนูติดตั้งมือถือ และปุ่มโค้ด
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch Link Generator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span>สร้างลิงก์ส่งให้สาขาใหม่ (ทดลองใช้งานฟรี 7 วัน)</span>
                  </h4>
                  <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                    7 วัน Free Trial
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  พิมพ์รหัสสาขาหรือชื่อผู้ใช้ด้านล่าง เพื่อสร้างลิงก์เฉพาะเครื่อง จากนั้นกดคัดลอกส่งต่อทาง LINE หรือข้อความได้ทันที
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระบุรหัสสาขา หรือชื่อเครื่อง (ภาษาอังกฤษ/ตัวเลข):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customBranchName}
                        onChange={(e) => setCustomBranchName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="เช่น branch-01, shop-udon, branch-02"
                        className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Generated Link Display */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>ลิงก์สำหรับส่งให้เครื่องปลายทาง:</span>
                      <span className="text-emerald-600 font-bold">✨ รับฟรี 7 วันทันทีเมื่อเปิดใช้งาน</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-mono text-slate-700 truncate flex-1 select-all font-medium">
                        {currentBranchUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentBranchUrl, setCopiedBranchUrl)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center space-x-1 cursor-pointer active:scale-95"
                      >
                        {copiedBranchUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBranchUrl ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>รหัสใช้งานที่เปิดอยู่ในปัจจุบัน: <strong className="text-blue-600">{activeTenant}</strong></span>
                      <a
                        href={currentBranchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center space-x-1 font-medium"
                      >
                        <span>ทดลองเปิดดูลิงก์นี้ในแท็บใหม่</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Protection Notice */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-700 leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>การรับประกันความปลอดภัยสำหรับผู้ใช้งานลิงค์สาขา:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                  <li><strong>เมนูต่ออายุการใช้งาน:</strong> ถูกซ่อนไว้ จะแสดงเฉพาะหน้าต่างแจ้งเตือนเมื่อหมดอายุเพื่อติดต่อแอดมิน</li>
                  <li><strong>เมนูติดตั้งลงมือถือ:</strong> ถูกซ่อนไว้ เพื่อความกระชับของหน้าจอ</li>
                  <li><strong>ปุ่ม Source Code และดาวน์โหลดโค้ด:</strong> ถูกซ่อนไว้ ป้องกันการเข้าถึงโค้ดโปรเจกต์</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 3: ADMIN CONTROL PANEL */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              
              {!isAdminUnlocked ? (
                /* Admin PIN Lock Screen */
                <div className="max-w-md mx-auto text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">แผงควบคุมผู้ดูแล (Admin Control)</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      กรุณากรอกรหัส PIN ผู้ดูแลเพื่อสร้างรหัสต่ออายุและกำหนดวันหมดอายุ
                    </p>
                  </div>

                  <form onSubmit={handleUnlockAdmin} className="space-y-3">
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      placeholder="กรอกรหัส PIN (เริ่มต้น: 1234)"
                      className="w-full text-center px-4 py-2.5 text-base font-mono tracking-widest bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    {adminPinError && (
                      <p className="text-xs text-red-600">{adminPinError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer active:scale-95"
                    >
                      เข้าสู่ระบบผู้ดูแล
                    </button>
                    <p className="text-[11px] text-slate-400">
                      * รหัสผ่านผู้ดูแลเริ่มต้นคือ <strong>1234</strong>
                    </p>
                  </form>
                </div>
              ) : (
                /* Unlocked Admin Controls */
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2 text-emerald-600 text-sm font-bold">
                      <Unlock className="w-4 h-4" />
                      <span>โหมดผู้ดูแลระบบ (Admin Mode เปิดใช้งานแล้ว)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAdminUnlocked(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      ออกจากโหมดผู้ดูแล
                    </button>
                  </div>

                  {/* 1. Generator of Activation Codes: 30, 90, 180, 360 วัน, ตลอดชีพ */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>สร้างรหัสต่ออายุให้ลูกค้า (Generate Activation Code)</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      กดปุ่มเพื่อสร้างรหัสส่งให้ลูกค้าหรือโทรศัพท์สาขา นำไปกรอกเพื่อเพิ่มวันใช้งาน
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(30)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + 30 วัน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(90)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + 90 วัน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(180)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + 180 วัน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode(360)}
                        className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        + 360 วัน
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerateCode('lifetime')}
                        className="px-3 py-2 bg-yellow-50 border border-yellow-300 hover:bg-yellow-100 text-yellow-800 rounded-xl text-xs font-bold transition cursor-pointer col-span-2 sm:col-span-1"
                      >
                        👑 ตลอดชีพ
                      </button>
                    </div>

                    {generatedCode && (
                      <div className="mt-3 p-3.5 bg-white rounded-xl border border-blue-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">รหัสต่ออายุที่สร้างขึ้น:</div>
                          <div className="text-base font-mono font-bold text-blue-700 tracking-wider">
                            {generatedCode}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedCode, setCopiedGeneratedCode)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer active:scale-95"
                        >
                          {copiedGeneratedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedGeneratedCode ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. Direct Expiry Date Configuration */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>กำหนดวันหมดอายุของเครื่องนี้โดยตรง</span>
                    </h4>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 text-sm text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isLifetimeSetting}
                          onChange={(e) => setIsLifetimeSetting(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold">เปิดใช้งานตลอดชีพ (ไม่มีวันหมดอายุ)</span>
                      </label>

                      {!isLifetimeSetting && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            ระบุวันที่หมดอายุ (ค.ศ.):
                          </label>
                          <input
                            type="date"
                            value={editExpiresAt}
                            onChange={(e) => setEditExpiresAt(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Contact Info and PIN Settings */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">
                      ตั้งค่าข้อมูลติดต่อผู้ดูแล & รหัส PIN
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          ชื่อผู้ดูแลระบบ (Admin Name):
                        </label>
                        <input
                          type="text"
                          value={editContactName}
                          onChange={(e) => setEditContactName(e.target.value)}
                          placeholder="ช่างหน่อยชุมแพ"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          เบอร์โทรติดต่อต่ออายุ:
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="0992256601"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          LINE ID ติดต่อต่ออายุ:
                        </label>
                        <input
                          type="text"
                          value={editLineId}
                          onChange={(e) => setEditLineId(e.target.value)}
                          placeholder="@228snzee"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          เปลี่ยนรหัส PIN ผู้ดูแล (Admin PIN):
                        </label>
                        <input
                          type="text"
                          value={editNewPin}
                          onChange={(e) => setEditNewPin(e.target.value)}
                          placeholder="เช่น 1234 หรือ 9876"
                          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {adminSaveSuccess ? (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>บันทึกการตั้งค่าสำเร็จ!</span>
                        </span>
                      ) : <div />}

                      <button
                        type="button"
                        onClick={handleSaveAdminConfig}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer active:scale-95"
                      >
                        บันทึกการตั้งค่าผู้ดูแล
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTenant !== 'default' ? (
              <span>กำลังใช้งานรหัสสาขา: <strong className="text-blue-600">{activeTenant}</strong></span>
            ) : (
              <span>สาขาหลัก (เครื่องแอดมินเริ่มต้น)</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
