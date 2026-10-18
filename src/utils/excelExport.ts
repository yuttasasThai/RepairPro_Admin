import * as XLSX from 'xlsx';
import { RepairJob } from '../types/repair';
import { STATUS_MAP, getJobWarrantyStatus, formatDateThai } from './formatters';

export function exportJobsToExcel(jobs: RepairJob[], fileNamePrefix: string = 'รายงานสรุปงานซ่อม_RepairProShop'): void {
  // Build formatted rows for Excel
  const rows = jobs.map((job, index) => {
    const warrantyInfo = getJobWarrantyStatus(job);

    return {
      'ลำดับ': index + 1,
      'รหัสงาน': job.id,
      'วดป รับงาน': formatDateThai(job.createdAt),
      'ประเภทงาน': job.jobType || 'งานใหม่',
      'ชื่อลูกค้า': job.customer.name,
      'เบอร์โทร': job.customer.phone,
      'LINE ID': job.customer.lineId || '-',
      'ประเภทอุปกรณ์': job.device.categoryLabel || job.device.category,
      'ยี่ห้อ': job.device.brand,
      'รุ่น (Model)': job.device.model,
      'S/N หรือ IMEI': job.device.serialNumber || '-',
      'อาการเสีย': job.issueDescription,
      'การตัดสินใจ': job.financials.customerDecision === 'cancelled' ? 'ยกเลิก' : 'ตกลงซ่อม',
      'สถานะงาน': STATUS_MAP[job.status]?.label || job.status,
      'เลขพัสดุ': job.trackingNumber || '-',
      'ประเมินค่าซ่อม (รายได้)': job.financials.price,
      'ค่าอะไหล่': job.financials.partsCost,
      'ค่าจัดส่ง': job.financials.shippingCost || 0,
      'ค่าใช้จ่ายอื่นๆ': job.financials.otherCost || 0,
      'ต้นทุนรวม': job.financials.totalCost,
      'กำไรสุทธิ': job.financials.profit,
      'เหตุผลยกเลิก': job.cancellationReason || '-',
      'รายละเอียดการยกเลิก': job.cancellationNotes || '-',
      'ช่างผู้ดูแล': job.technician,
      'ระยะประกัน (วัน)': job.warranty.warrantyDays,
      'วันหมดประกัน': job.warranty.endDate ? formatDateThai(job.warranty.endDate) : '-',
      'สถานะประกัน': warrantyInfo.label,
    };
  });

  // Calculate totals
  const totalRevenue = jobs.reduce((sum, j) => sum + (j.financials?.price || 0), 0);
  const totalPartsCost = jobs.reduce((sum, j) => sum + (j.financials?.partsCost || 0), 0);
  const totalShippingCost = jobs.reduce((sum, j) => sum + (j.financials?.shippingCost || 0), 0);
  const totalOtherCost = jobs.reduce((sum, j) => sum + (j.financials?.otherCost || 0), 0);
  const totalCost = jobs.reduce((sum, j) => sum + (j.financials?.totalCost || 0), 0);
  const totalProfit = jobs.reduce((sum, j) => sum + (j.financials?.profit || 0), 0);

  // Add summary row
  const summaryRow = {
    'ลำดับ': 'รวมทั้งสิ้น',
    'รหัสงาน': `${jobs.length} รายการ`,
    'วดป รับงาน': '',
    'ชื่อลูกค้า': '',
    'เบอร์โทร': '',
    'LINE ID': '',
    'ประเภทอุปกรณ์': '',
    'ยี่ห้อ': '',
    'รุ่น (Model)': '',
    'S/N หรือ IMEI': '',
    'อาการเสีย': '',
    'การตัดสินใจ': '',
    'สถานะงาน': '',
    'เลขพัสดุ': '',
    'ประเมินค่าซ่อม (รายได้)': totalRevenue,
    'ค่าอะไหล่': totalPartsCost,
    'ค่าจัดส่ง': totalShippingCost,
    'ค่าใช้จ่ายอื่นๆ': totalOtherCost,
    'ต้นทุนรวม': totalCost,
    'กำไรสุทธิ': totalProfit,
    'เหตุผลยกเลิก': '',
    'รายละเอียดการยกเลิก': '',
    'ช่างผู้ดูแล': '',
    'ระยะประกัน (วัน)': '',
    'วันหมดประกัน': '',
    'สถานะประกัน': '',
  };

  const finalData = [...rows, summaryRow];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(finalData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 16 }, // รหัสงาน
    { wch: 14 }, // วดป
    { wch: 18 }, // ชื่อลูกค้า
    { wch: 14 }, // เบอร์โทร
    { wch: 14 }, // LINE
    { wch: 14 }, // ประเภท
    { wch: 12 }, // ยี่ห้อ
    { wch: 20 }, // รุ่น
    { wch: 18 }, // S/N
    { wch: 30 }, // อาการ
    { wch: 12 }, // การตัดสินใจ
    { wch: 14 }, // สถานะ
    { wch: 18 }, // เลขพัสดุ
    { wch: 16 }, // ประเมินค่าซ่อม
    { wch: 12 }, // ค่าอะไหล่
    { wch: 12 }, // ค่าส่ง
    { wch: 14 }, // ค่าอื่นๆ
    { wch: 14 }, // รวมต้นทุน
    { wch: 14 }, // กำไร
    { wch: 16 }, // เหตุผลยกเลิก
    { wch: 22 }, // รายละเอียด
    { wch: 16 }, // ช่าง
    { wch: 14 }, // ประกัน(วัน)
    { wch: 14 }, // วันหมดประกัน
    { wch: 18 }, // สถานะประกัน
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานซ่อม_RepairProShop');

  // Generate file name with timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${fileNamePrefix}_${dateStr}.xlsx`;

  // Download
  XLSX.writeFile(workbook, filename);
}
