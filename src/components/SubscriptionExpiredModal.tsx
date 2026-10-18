import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  MessageCircle, 
  Key, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Lock,
  Copy,
  Check,
  Sparkles,
  Crown
} from 'lucide-react';
import { LicenseConfig, LicenseStatus } from '../types/license';
import { applyRenewalCode, isBranchUser } from '../utils/license';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseConfig: LicenseConfig;
  licenseStatus: LicenseStatus;
  onLicenseUpdated: (newConfig: LicenseConfig) => void;
  onOpenAdminManager?: () => void;
}

export const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({
  isOpen,
  onClose,
  licenseConfig,
  licenseStatus,
  onLicenseUpdated,
  onOpenAdminManager,
}) => {
  const [activationCode, setActivationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLine, setCopiedLine] = useState(false);

  const isBranch = isBranchUser();
  const contactName = licenseConfig.contactName || 'ช่างหน่อยชุมแพ';
  const contactPhone = licenseConfig.contactPhone || '099-225-6601';
  const rawPhone = contactPhone.replace(/[^0-9]/g, '') || '0992256601';
  const contactLine = licenseConfig.contactLineId || '@228snzee';
  const lineUrl = `https://line.me/R/ti/p/${encodeURIComponent(contactLine)}`;

  if (!isOpen) return null;

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!activationCode.trim()) {
      setErrorMsg('กรุณากรอกรหัสต่ออายุการใช้งาน');
      return;
    }

    const res = applyRenewalCode(activationCode, licenseConfig);
    if (res.success) {
      setSuccessMsg(res.message);
      onLicenseUpdated(res.updatedConfig);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setActivationCode('');
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCopy = (text: string, type: 'phone' | 'line') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedLine(true);
      setTimeout(() => setCopiedLine(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">ระยะเวลาการใช้งานสิ้นสุดแล้ว</h3>
              <p className="text-red-100 text-xs sm:text-sm mt-0.5">
                {licenseConfig.planType === 'trial'
                  ? 'ระยะเวลาทดลองใช้งานฟรี 7 วัน สิ้นสุดลงแล้ว'
                  : 'กรุณาติดต่อผู้ดูแลระบบเพื่อต่ออายุการใช้งาน'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Status Box */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-900 leading-relaxed">
              <p className="font-semibold text-red-800">
                หมดอายุเมื่อ: {licenseStatus.expiresAtFormatted}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                ระบบระงับการเปิดบิลงานซ่อมใหม่ชั่วคราว แต่ท่านยังสามารถดูรายการงานเดิมและรายงานต่างๆ ได้ตามปกติ
              </p>
            </div>
          </div>

          {/* Renewal Plans Available */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>แพ็กเกจต่ออายุการใช้งานที่สามารถสมัครได้:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 font-medium text-center">
                ต่ออายุ <strong>30 วัน</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 font-medium text-center">
                ต่ออายุ <strong>90 วัน</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 font-medium text-center">
                ต่ออายุ <strong>180 วัน</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-800 font-medium text-center">
                ต่ออายุ <strong>360 วัน</strong>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-2 rounded-lg border border-yellow-300 text-yellow-900 font-bold text-center col-span-2 sm:col-span-2 flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 text-yellow-600" />
                <span>ต่ออายุ ตลอดชีพ (Lifetime)</span>
              </div>
            </div>
          </div>

          {/* Contact Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>ติดต่อผู้ดูแลระบบ (Admin) เพื่อขอต่ออายุ</span>
              </h4>
              <span className="text-xs font-bold text-blue-700">{contactName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              
              {/* Phone Button */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-200 shadow-xs">
                <a 
                  href={`tel:${rawPhone}`}
                  className="flex items-center space-x-2 text-slate-800 hover:text-blue-600 transition"
                  title="กดเพื่อโทรออก"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold">{contactPhone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(contactPhone, 'phone')}
                  className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="คัดลอกเบอร์โทร"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* LINE Button */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-200 shadow-xs">
                <a 
                  href={lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-slate-800 hover:text-green-600 transition"
                  title="เปิด LINE"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold">{contactLine}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(contactLine, 'line')}
                  className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="คัดลอก LINE ID"
                >
                  {copiedLine ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

            </div>
          </div>

          {/* Activation Code Input Form */}
          <form onSubmit={handleApplyCode} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              กรอกรหัสต่ออายุการใช้งาน (Activation Code):
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="กรอกรหัส เช่น RENEW-30 หรือ ACT-..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono uppercase bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <span>เปิดใช้งาน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </p>
            )}

            {!isBranch && (
              <p className="text-[11px] text-slate-400">
                * ตัวอย่างรหัสผู้ดูแล: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">RENEW-30</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">RENEW-90</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">RENEW-180</code>, <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">RENEW-360</code> หรือ <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">LIFETIME-PRO</code>
              </p>
            )}
          </form>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {/* สำหรับผู้ใช้งานลิงค์สาขา จะไม่แสดงปุ่มเข้าสู่แผงควบคุม Admin */}
          {!isBranch && onOpenAdminManager ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAdminManager();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>เข้าสู่แผงควบคุมผู้ดูแล (Admin)</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              ติดต่อแอดมิน {contactName} ({contactPhone})
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            ดูข้อมูลเดิม
          </button>
        </div>

      </div>
    </div>
  );
};
