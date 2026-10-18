import { RepairJob, ShopSettings } from '../types/repair';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'RepairProShop',
  phone: '082-999-5588',
  lineId: '@RepairProShop',
  lineQrUrl: '',
  address: '168/25 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  taxId: '0105562089123',
  bankInfo: 'ธนาคารกสิกรไทย 095-2-45891-0 บจก. รีแพร์ โปร ช็อป',
  defaultWarrantyDays: 90,
  defaultWarrantyTerms: 'รับประกันเฉพาะอะไหล่ที่เปลี่ยน ไม่ครอบคลุมเครื่องตกน้ำ หรือตกกระแทก',
  technicians: [
    'ช่างเอก (หัวหน้าช่าง)',
    'ช่างนนท์ (ช่างบอร์ด)',
    'ช่างบอล (ช่างสมาร์ทโฟน)',
    'ช่างวิทย์ (ช่างเครื่องใช้ไฟฟ้า/คอม)',
  ],
  customCategories: [
    'มือถือ / สมาร์ทโฟน',
    'โน้ตบุ๊ก / คอมพิวเตอร์',
    'แท็บเล็ต / iPad',
    'เครื่องใช้ไฟฟ้า',
  ],
};

// เริ่มต้นเป็นรายการว่างเปล่า รอเปิดบันทึกรายการงานซ่อมใหม่จากผู้ใช้งาน
export const INITIAL_REPAIR_JOBS: RepairJob[] = [];
