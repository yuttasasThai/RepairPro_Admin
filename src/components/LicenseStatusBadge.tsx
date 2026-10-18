import React from 'react';
import { Clock, AlertTriangle, ShieldCheck, Crown, ExternalLink, GitBranch } from 'lucide-react';
import { LicenseConfig, LicenseStatus } from '../types/license';
import { getActiveTenantId } from '../utils/license';

interface LicenseStatusBadgeProps {
  licenseConfig: LicenseConfig;
  licenseStatus: LicenseStatus;
  onClick: () => void;
  className?: string;
}

export const LicenseStatusBadge: React.FC<LicenseStatusBadgeProps> = ({
  licenseConfig,
  licenseStatus,
  onClick,
  className = '',
}) => {
  const tenantId = getActiveTenantId();
  const isCustomTenant = tenantId !== 'default';

  return (
    <button
      type="button"
      onClick={onClick}
      title="คลิกเพื่อดูรายละเอียดอายุการใช้งาน, ลิงก์แยกเครื่อง หรือรหัสต่ออายุ"
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer select-none border ${
        licenseStatus.isExpired
          ? 'bg-red-500/15 border-red-500/40 text-red-200 hover:bg-red-500/25'
          : licenseStatus.isExpiringSoon
          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:bg-amber-500/25 animate-pulse'
          : licenseStatus.isLifetime
          ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/25'
          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
      } ${className}`}
    >
      {/* Icon */}
      {licenseStatus.isExpired ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      ) : licenseStatus.isLifetime ? (
        <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
      ) : licenseStatus.isExpiringSoon ? (
        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}

      {/* Label */}
      <span className="whitespace-nowrap">
        {licenseStatus.isExpired
          ? 'หมดอายุ'
          : licenseStatus.isLifetime
          ? 'ตลอดชีพ'
          : `เหลือ ${licenseStatus.daysRemaining} วัน`}
      </span>

      {/* Tenant Indicator if non-default */}
      {isCustomTenant && (
        <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
          สาขา: {tenantId}
        </span>
      )}
    </button>
  );
};
