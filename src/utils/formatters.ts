import { RepairJob, RepairStatus, CancellationReason, DeviceCategory } from '../types/repair';

export const STATUS_MAP: Record<RepairStatus, {
  label: string;
  shortLabel: string;
  badgeClass: string;
  colorHex: string;
  iconName: string;
}> = {
  pending: {
    label: 'รอซ่อม',
    shortLabel: 'รอซ่อม',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-300',
    colorHex: '#d97706',
    iconName: 'Clock',
  },
  waiting_parts: {
    label: 'รออะไหล่',
    shortLabel: 'รออะไหล่',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-300',
    colorHex: '#9333ea',
    iconName: 'Package',
  },
  in_progress: {
    label: 'กำลังซ่อม',
    shortLabel: 'กำลังซ่อม',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-300',
    colorHex: '#2563eb',
    iconName: 'Wrench',
  },
  completed: {
    label: 'ซ่อมแล้ว',
    shortLabel: 'ซ่อมแล้ว',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
    colorHex: '#059669',
    iconName: 'CheckCircle2',
  },
  ready_to_ship: {
    label: 'รอส่ง',
    shortLabel: 'รอส่ง',
    badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-300',
    colorHex: '#0891b2',
    iconName: 'Clock',
  },
  delivered: {
    label: 'ส่งแล้ว',
    shortLabel: 'ส่งแล้ว',
    badgeClass: 'bg-teal-50 text-teal-700 border border-teal-300',
    colorHex: '#0d9488',
    iconName: 'Truck',
  },
  picked_up: {
    label: 'มารับเอง',
    shortLabel: 'มารับเอง',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    colorHex: '#10b981',
    iconName: 'PackageCheck',
  },
  cancelled: {
    label: 'ยกเลิก',
    shortLabel: 'ยกเลิก',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300',
    colorHex: '#e11d48',
    iconName: 'XCircle',
  },
};

export const CANCELLATION_REASONS: CancellationReason[] = [
  'ลูกค้ายกเลิก',
  'ซ่อมไม่คุ้ม',
  'อาการหนัก',
  'อะไหล่ไม่มี',
  'อื่นๆ',
];

export const DEVICE_CATEGORIES: { id: DeviceCategory; label: string; icon: string }[] = [
  { id: 'smartphone', label: 'สมาร์ทโฟน', icon: 'Smartphone' },
  { id: 'laptop', label: 'โน้ตบุ๊ก', icon: 'Laptop' },
  { id: 'tablet', label: 'แท็บเล็ต', icon: 'Tablet' },
  { id: 'desktop', label: 'คอมพิวเตอร์ PC', icon: 'Monitor' },
  { id: 'appliance', label: 'เครื่องใช้ไฟฟ้า', icon: 'Tv' },
  { id: 'smartwatch', label: 'สมาร์ทวอทช์', icon: 'Watch' },
  { id: 'camera', label: 'กล้อง', icon: 'Camera' },
  { id: 'game_console', label: 'เครื่องเล่นเกม', icon: 'Gamepad2' },
  { id: 'other', label: 'อุปกรณ์อื่นๆ', icon: 'Cpu' },
];

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '฿0';
  return `฿${amount.toLocaleString('th-TH')}`;
}

export function formatNumber(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return amount.toLocaleString('th-TH');
}

export function formatDateThai(isoString: string | undefined | null, includeTime: boolean = false): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // Buddhist Era
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year} ${hours}:${minutes} น.`;
    }
    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

export function formatDateShort(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toISOString().split('T')[0];
  } catch {
    return '-';
  }
}

export interface WarrantyStatusResult {
  status: 'active' | 'expiring_soon' | 'expired' | 'none';
  label: string;
  badgeClass: string;
  daysRemaining: number;
  startDate?: string;
  endDate?: string;
}

export interface JobWarrantyResult {
  status: 'not_started' | 'active' | 'expiring_soon' | 'expired' | 'none' | 'cancelled';
  label: string; // "ยังไม่เริ่มนับประกัน" | "เหลือ XX วัน" | "หมดประกัน" | "ไม่มีประกัน" | "ยกเลิก"
  shortText: string;
  badgeClass: string;
  daysRemaining?: number;
  deliveryDate?: string;
  startDate?: string;
  endDate?: string;
  tooltip?: string;
}

/**
 * คำนวณสถานะประกันตามข้อกำหนด:
 * - คอลัมน์ สถานะประกัน ให้แสดง ระยะประกันที่เหลือ นับ ระยะประกัน - วันส่งพัสดุ
 * - หากอยู่ในสถานะก่อนหน้า (pending, in_progress, waiting_parts, completed, ready_to_ship) ให้ใส่ "ยังไม่เริ่มนับประกัน"
 */
export function getJobWarrantyStatus(job: RepairJob): JobWarrantyResult {
  if (job.status === 'cancelled') {
    return {
      status: 'cancelled',
      label: 'ยกเลิก',
      shortText: 'ยกเลิก',
      badgeClass: 'bg-slate-100 text-slate-400 border border-slate-200',
    };
  }

  const warrantyDays = job.warranty?.warrantyDays ?? 0;
  if (warrantyDays <= 0) {
    return {
      status: 'none',
      label: 'ไม่มีประกัน',
      shortText: 'ไม่มี',
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200',
      daysRemaining: 0,
    };
  }

  // หากอยู่ในสถานะก่อนหน้า (ยังไม่ส่งมอบ/ส่งพัสดุ) ให้ใส่ "ยังไม่เริ่มนับประกัน"
  if (job.status !== 'delivered') {
    return {
      status: 'not_started',
      label: 'ยังไม่เริ่มนับประกัน',
      shortText: 'ยังไม่เริ่มนับ',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold',
      daysRemaining: warrantyDays,
      tooltip: `ระยะประกัน ${warrantyDays} วัน (จะเริ่มนับวันแรกเมื่อส่งพัสดุ/ส่งมอบเครื่อง)`,
    };
  }

  // สถานะส่งพัสดุแล้ว (delivered): นับ ระยะประกัน - วันส่งพัสดุ
  const deliveryDateStr = job.deliveredAt 
    ? job.deliveredAt.split('T')[0]
    : (job.warranty.startDate || new Date().toISOString().split('T')[0]);

  const deliveryDate = new Date(deliveryDateStr);
  deliveryDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // จำนวนวันที่ผ่านไปนับตั้งแต่วันส่งพัสดุ
  const diffTime = today.getTime() - deliveryDate.getTime();
  const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // ระยะประกันที่เหลือ = ระยะประกัน (วัน) - วันที่ผ่านไปตั้งแต่วันส่ง
  const daysRemaining = warrantyDays - daysPassed;

  const endDate = new Date(deliveryDate);
  endDate.setDate(endDate.getDate() + warrantyDays);
  const endDateStr = endDate.toISOString().split('T')[0];

  if (daysRemaining <= 0) {
    return {
      status: 'expired',
      label: 'หมดประกัน',
      shortText: 'หมดประกัน',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300 font-bold',
      daysRemaining: 0,
      deliveryDate: deliveryDateStr,
      startDate: deliveryDateStr,
      endDate: endDateStr,
      tooltip: `ส่งพัสดุเมื่อ ${formatDateThai(deliveryDateStr)} (สิ้นสุดประกันแล้ว)`,
    };
  }

  if (daysRemaining <= 7) {
    return {
      status: 'expiring_soon',
      label: `เหลือ ${daysRemaining} วัน`,
      shortText: `เหลือ ${daysRemaining} วัน`,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-400 font-bold',
      daysRemaining,
      deliveryDate: deliveryDateStr,
      startDate: deliveryDateStr,
      endDate: endDateStr,
      tooltip: `ส่งพัสดุเมื่อ ${formatDateThai(deliveryDateStr)} • ครบกำหนด ${formatDateThai(endDateStr)}`,
    };
  }

  return {
    status: 'active',
    label: `เหลือ ${daysRemaining} วัน`,
    shortText: `เหลือ ${daysRemaining} วัน`,
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
    daysRemaining,
    deliveryDate: deliveryDateStr,
    startDate: deliveryDateStr,
    endDate: endDateStr,
    tooltip: `ส่งพัสดุเมื่อ ${formatDateThai(deliveryDateStr)} • ครบกำหนด ${formatDateThai(endDateStr)}`,
  };
}

export function getWarrantyStatus(
  warrantyDays: number = 0,
  startDateStr?: string,
  endDateStr?: string
): WarrantyStatusResult {
  if (!warrantyDays || warrantyDays <= 0 || (!startDateStr && !endDateStr)) {
    return {
      status: 'none',
      label: 'ไม่มีประกัน',
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200',
      daysRemaining: 0,
    };
  }

  let endDate: Date;
  if (endDateStr) {
    endDate = new Date(endDateStr);
  } else if (startDateStr) {
    endDate = new Date(startDateStr);
    endDate.setDate(endDate.getDate() + warrantyDays);
  } else {
    return {
      status: 'none',
      label: 'ไม่มีประกัน',
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200',
      daysRemaining: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: 'หมดระยะประกัน',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
      daysRemaining: diffDays,
      startDate: startDateStr,
      endDate: end.toISOString().split('T')[0],
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'expiring_soon',
      label: `ใกล้หมดประกัน (เหลือ ${diffDays} วัน)`,
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300 font-semibold',
      daysRemaining: diffDays,
      startDate: startDateStr,
      endDate: end.toISOString().split('T')[0],
    };
  }

  return {
    status: 'active',
    label: 'ในประกัน',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    daysRemaining: diffDays,
    startDate: startDateStr,
    endDate: end.toISOString().split('T')[0],
  };
}

export function getLineQrCodeUrl(lineIdOrUrl: string): string {
  let target = lineIdOrUrl;
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    const cleanId = target.replace('@', '');
    target = `https://line.me/ti/p/~${cleanId}`;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(target)}&margin=10`;
}
