export type SubscriptionPlanType = 'trial' | 'monthly' | 'quarterly' | 'half_year' | 'annual' | 'lifetime';

export interface LicenseConfig {
  tenantId: string;           // รหัสสาขา/รหัสแยก เช่น 'default', 'branch-1'
  tenantName: string;         // ชื่อสาขา/ชื่อผู้ใช้งาน
  planType: SubscriptionPlanType;
  planName: string;           // ชื่อแพ็กเกจ เช่น 'ทดลองใช้งานฟรี 7 วัน', 'ต่ออายุ 30 วัน'
  activatedAt: string;        // วันที่เริ่มใช้งาน (ISO string)
  expiresAt?: string | null;  // วันที่หมดอายุ (ISO string, null/undefined สำหรับตลอดชีพ)
  contactName?: string;       // ชื่อผู้ดูแลระบบ เช่น 'ช่างหน่อยชุมแพ'
  contactPhone: string;       // เบอร์ติดต่อแจ้งต่ออายุ เช่น '099-225-6601'
  contactLineId: string;      // Line ID แจ้งต่ออายุ เช่น '@228snzee'
  adminPin: string;           // รหัสผ่านผู้ดูแลเพื่อแก้ไข/ออกรหัสต่ออายุ (เริ่มต้น: '1234')
}

export interface LicenseStatus {
  isExpired: boolean;
  isExpiringSoon: boolean;    // เหลือน้อยกว่าหรือเท่ากับ 7 วัน
  daysRemaining: number;
  expiresAtFormatted: string;
  isLifetime: boolean;
  planName: string;
}
