import { LicenseConfig, LicenseStatus, SubscriptionPlanType } from '../types/license';

export const DEFAULT_ADMIN_PIN = '1234';
export const DEFAULT_CONTACT_NAME = 'ช่างหน่อยชุมแพ';
export const DEFAULT_CONTACT_PHONE = '099-225-6601';
export const DEFAULT_CONTACT_PHONE_RAW = '0992256601';
export const DEFAULT_CONTACT_LINE = '@228snzee';

export function getActiveTenantId(): string {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tenantParam = params.get('tenant') || params.get('branch') || params.get('store');
      if (tenantParam && tenantParam.trim().length > 0) {
        const cleaned = tenantParam.trim().toLowerCase().replace(/[^a-z0-9_\u0E00-\u0E7F-]/g, '');
        return cleaned.length > 0 ? cleaned : 'branch';
      }
    }
  } catch (err) {
    console.error('Error getting tenant id:', err);
  }
  return 'default';
}

/**
 * ตรวจสอบว่าเป็นผู้ใช้งานที่เปิดผ่าน "ลิงค์สาขา" หรือไม่
 * หากมี query param เช่น ?tenant=branch1 หรือ ?branch=... จะคืนค่า true
 * หากเป็นเครื่องสาขาหลัก (เปิดเว็บโดยตรงไม่มี param) จะคืนค่า false
 */
export function isBranchUser(): boolean {
  return getActiveTenantId() !== 'default';
}

export function getTenantStoragePrefix(): string {
  const tenantId = getActiveTenantId();
  return tenantId === 'default' ? '' : `_${tenantId}`;
}

export function getLicenseStorageKey(): string {
  return `repair_pro_license_v1${getTenantStoragePrefix()}`;
}

export function getDefaultLicenseConfig(): LicenseConfig {
  const tenantId = getActiveTenantId();
  const isBranch = tenantId !== 'default';
  
  const now = new Date();

  // ลิงก์แอดมินหลัก (default): สิทธิ์แอดมินใช้งานตลอดชีพ ไม่มีวันหมดอายุ!
  if (!isBranch) {
    return {
      tenantId: 'default',
      tenantName: 'สาขาหลัก (เครื่องแอดมิน)',
      planType: 'lifetime',
      planName: 'แพ็กเกจตลอดชีพ (สิทธิ์แอดมิน)',
      activatedAt: now.toISOString(),
      expiresAt: null,
      contactName: DEFAULT_CONTACT_NAME,
      contactPhone: DEFAULT_CONTACT_PHONE,
      contactLineId: DEFAULT_CONTACT_LINE,
      adminPin: DEFAULT_ADMIN_PIN,
    };
  }

  // ลิงค์สาขาแยกอิสระ เริ่มต้นรับสิทธิ์ "ทดลองใช้งานฟรี 7 วัน"
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    tenantId,
    tenantName: `สาขา / บัญชี: ${tenantId}`,
    planType: 'trial',
    planName: 'ทดลองใช้งานฟรี (7 วัน)',
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    contactName: DEFAULT_CONTACT_NAME,
    contactPhone: DEFAULT_CONTACT_PHONE,
    contactLineId: DEFAULT_CONTACT_LINE,
    adminPin: DEFAULT_ADMIN_PIN,
  };
}

export function getStoredLicense(): LicenseConfig {
  try {
    const key = getLicenseStorageKey();
    const raw = localStorage.getItem(key);
    const tenantId = getActiveTenantId();
    const isBranch = tenantId !== 'default';

    if (!raw) {
      const initial = getDefaultLicenseConfig();
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);

    // สำหรับเครื่องแอดมินหลัก (default): ต้องเป็นแพ็กเกจตลอดชีพ ไม่มีวันหมดอายุ เสมอ
    // หากเคยถูกบันทึกเป็น 30 วัน หรือมีวันหมดอายุ จะอัปเกรดเป็นตลอดชีพอัตโนมัติทันที
    if (!isBranch && (parsed.planType !== 'lifetime' || parsed.expiresAt)) {
      const updatedAdminLicense: LicenseConfig = {
        ...parsed,
        tenantId: 'default',
        tenantName: 'สาขาหลัก (เครื่องแอดมิน)',
        planType: 'lifetime',
        planName: 'แพ็กเกจตลอดชีพ (สิทธิ์แอดมิน)',
        expiresAt: null,
        contactName: parsed.contactName || DEFAULT_CONTACT_NAME,
        contactPhone: parsed.contactPhone || DEFAULT_CONTACT_PHONE,
        contactLineId: parsed.contactLineId || DEFAULT_CONTACT_LINE,
        adminPin: parsed.adminPin || DEFAULT_ADMIN_PIN,
      };
      localStorage.setItem(key, JSON.stringify(updatedAdminLicense));
      return updatedAdminLicense;
    }

    return {
      ...getDefaultLicenseConfig(),
      ...parsed,
      // บังคับอัปเดตข้อมูลติดต่อให้ตรงกับ admin ช่างหน่อยชุมแพ
      contactName: parsed.contactName || DEFAULT_CONTACT_NAME,
      contactPhone: parsed.contactPhone || DEFAULT_CONTACT_PHONE,
      contactLineId: parsed.contactLineId || DEFAULT_CONTACT_LINE,
    };
  } catch (err) {
    console.error('Error loading stored license:', err);
    return getDefaultLicenseConfig();
  }
}

export function saveStoredLicense(config: LicenseConfig): void {
  try {
    const key = getLicenseStorageKey();
    localStorage.setItem(key, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving license config:', err);
  }
}

export function calculateLicenseStatus(config: LicenseConfig): LicenseStatus {
  if (config.planType === 'lifetime' || !config.expiresAt) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: 9999,
      expiresAtFormatted: 'ตลอดชีพ (ไม่มีวันหมดอายุ)',
      isLifetime: true,
      planName: config.planName || 'แพ็กเกจตลอดชีพ (สิทธิ์แอดมิน)',
    };
  }

  const now = new Date();
  const expireDate = new Date(config.expiresAt);
  const diffTime = expireDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays <= 0;
  const isExpiringSoon = !isExpired && diffDays <= 7;

  // Format date in Thai format
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = expireDate.getDate();
  const month = thaiMonths[expireDate.getMonth()];
  const year = expireDate.getFullYear() + 543;
  const formattedDate = `${day} ${month} ${year}`;

  return {
    isExpired,
    isExpiringSoon,
    daysRemaining: Math.max(0, diffDays),
    expiresAtFormatted: formattedDate,
    isLifetime: false,
    planName: config.planName || 'แพ็กเกจใช้งาน',
  };
}

// Generate code helper
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
}

export function generateActivationCode(days: number | 'lifetime'): string {
  const salt = Math.random().toString(36).substring(2, 6).toUpperCase();
  if (days === 'lifetime') {
    const check = hashCode(`LIFE-${salt}`);
    return `ACT-LIFE-${salt}${check}`;
  }
  const check = hashCode(`${days}D-${salt}`);
  return `ACT-${days}D-${salt}${check}`;
}

export interface ActivationCodeResult {
  valid: boolean;
  message: string;
  daysAdded: number | 'lifetime';
  planName: string;
}

export function validateAndParseCode(inputCode: string): ActivationCodeResult {
  const code = inputCode.trim().toUpperCase();

  // 1. Standard easy master renewal codes requested: 30, 90, 180, 360 วัน, ตลอดชีพ
  if (code === 'RENEW-30' || code === 'RENEW30' || code === '30DAYS') {
    return { valid: true, message: 'ต่ออายุ 30 วัน สำเร็จ', daysAdded: 30, planName: 'ต่ออายุ 30 วัน' };
  }
  if (code === 'RENEW-90' || code === 'RENEW90' || code === '90DAYS') {
    return { valid: true, message: 'ต่ออายุ 90 วัน สำเร็จ', daysAdded: 90, planName: 'ต่ออายุ 90 วัน (3 เดือน)' };
  }
  if (code === 'RENEW-180' || code === 'RENEW180' || code === '180DAYS' || code === 'HALF-YEAR') {
    return { valid: true, message: 'ต่ออายุ 180 วัน (6 เดือน) สำเร็จ', daysAdded: 180, planName: 'ต่ออายุ 180 วัน (6 เดือน)' };
  }
  if (code === 'RENEW-360' || code === 'RENEW360' || code === '360DAYS' || code === 'RENEW-365' || code === 'RENEW365' || code === 'YEAR-2026') {
    return { valid: true, message: 'ต่ออายุ 360 วัน (1 ปี) สำเร็จ', daysAdded: 360, planName: 'ต่ออายุ 360 วัน (1 ปี)' };
  }
  if (code === 'LIFETIME' || code === 'LIFETIME-PRO' || code === 'VIP-LIFETIME' || code === 'PRO-LIFETIME') {
    return { valid: true, message: 'ปลดล็อคการใช้งานตลอดชีพสำเร็จ (ไม่มีวันหมดอายุ)', daysAdded: 'lifetime', planName: 'ตลอดชีพ (Lifetime)' };
  }
  if (code === 'TRIAL-7' || code === 'TRIAL7') {
    return { valid: true, message: 'ต่ออายุทดลองใช้งาน 7 วัน สำเร็จ', daysAdded: 7, planName: 'ทดลองใช้งานฟรี (7 วัน)' };
  }

  // 2. Algorithmic ACT- codes generated by Admin UI
  if (code.startsWith('ACT-LIFE-')) {
    const body = code.replace('ACT-LIFE-', '');
    if (body.length >= 6) {
      const salt = body.slice(0, 4);
      const check = body.slice(4);
      if (check === hashCode(`LIFE-${salt}`)) {
        return { valid: true, message: 'ปลดล็อคการใช้งานตลอดชีพสำเร็จ', daysAdded: 'lifetime', planName: 'ตลอดชีพ (Lifetime)' };
      }
    }
  }

  const actMatch = code.match(/^ACT-(\d+)D-(.+)$/);
  if (actMatch) {
    const days = parseInt(actMatch[1], 10);
    const body = actMatch[2];
    if (days > 0 && body.length >= 6) {
      const salt = body.slice(0, 4);
      const check = body.slice(4);
      if (check === hashCode(`${days}D-${salt}`)) {
        let planDesc = `แพ็กเกจ (+${days} วัน)`;
        if (days === 30) planDesc = 'ต่ออายุ 30 วัน';
        else if (days === 90) planDesc = 'ต่ออายุ 90 วัน (3 เดือน)';
        else if (days === 180) planDesc = 'ต่ออายุ 180 วัน (6 เดือน)';
        else if (days === 360 || days === 365) planDesc = 'ต่ออายุ 360 วัน (1 ปี)';
        return { 
          valid: true, 
          message: `ต่ออายุ ${days} วัน สำเร็จ`, 
          daysAdded: days, 
          planName: planDesc
        };
      }
    }
  }

  return { valid: false, message: 'รหัสต่ออายุไม่ถูกต้องหรือหมดอายุแล้ว กรุณาติดต่อช่างหน่อยชุมแพ โทร 0992256601 ทางไลน์ @228snzee', daysAdded: 0, planName: '' };
}

export function applyRenewalCode(
  inputCode: string, 
  currentConfig: LicenseConfig
): { success: boolean; message: string; updatedConfig: LicenseConfig } {
  const result = validateAndParseCode(inputCode);
  if (!result.valid) {
    return {
      success: false,
      message: result.message,
      updatedConfig: currentConfig,
    };
  }

  const now = new Date();
  let newExpiresAt: string | null = null;
  let newPlanType: SubscriptionPlanType = 'monthly';

  if (result.daysAdded === 'lifetime') {
    newExpiresAt = null;
    newPlanType = 'lifetime';
  } else {
    // If current license is not expired, extend from current expiry date.
    // If already expired, extend from right now!
    let baseTime = now.getTime();
    if (currentConfig.expiresAt) {
      const currentExpiry = new Date(currentConfig.expiresAt).getTime();
      if (currentExpiry > baseTime) {
        baseTime = currentExpiry;
      }
    }
    const addedTime = result.daysAdded * 24 * 60 * 60 * 1000;
    newExpiresAt = new Date(baseTime + addedTime).toISOString();

    if (result.daysAdded >= 360) {
      newPlanType = 'annual';
    } else if (result.daysAdded >= 180) {
      newPlanType = 'half_year';
    } else if (result.daysAdded >= 90) {
      newPlanType = 'quarterly';
    } else if (result.daysAdded <= 7) {
      newPlanType = 'trial';
    } else {
      newPlanType = 'monthly';
    }
  }

  const updatedConfig: LicenseConfig = {
    ...currentConfig,
    planType: newPlanType,
    planName: result.planName,
    expiresAt: newExpiresAt,
  };

  saveStoredLicense(updatedConfig);
  return {
    success: true,
    message: result.message,
    updatedConfig,
  };
}

export function buildBranchUrl(branchCode: string): string {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanCode = branchCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanCode || cleanCode === 'default') {
      return `${origin}${pathname}`;
    }
    return `${origin}${pathname}?tenant=${cleanCode}`;
  } catch {
    return `?tenant=${branchCode}`;
  }
}
