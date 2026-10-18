import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { RepairJob, ShopSettings } from '../types/repair';
import { formatDateThai, formatCurrency, STATUS_MAP } from '../utils/formatters';

interface PrintTicketModalProps {
  job: RepairJob | null;
  shopSettings: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  job,
  shopSettings,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !job) return null;

  const handlePrint = () => {
    window.print();
  };

  const balanceDue = (job.financials.price || 0) - (job.financials.paidAmount || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:block">
      {/* Print Specific CSS to ensure perfect 1-page fit without overflowing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-ticket-wrapper {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          #printable-ticket {
            padding: 0 !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
          }
          .print-compact {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div 
        id="printable-ticket-wrapper" 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:shadow-none print:rounded-none"
      >
        {/* Modal Controls (Not printed) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm sm:text-base">พิมพ์ใบรับซ่อม / ใบส่งมอบเครื่อง</span>
            <span className="text-xs bg-slate-800 text-blue-300 px-2.5 py-0.5 rounded font-mono font-bold">
              {job.id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์เอกสาร (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area: Compact and fits comfortably on 1 A4 page */}
        <div id="printable-ticket" className="p-6 sm:p-7 overflow-y-auto font-sans text-slate-900 bg-white space-y-3.5 print:p-0 print:space-y-2.5">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start avoid-break">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 font-mono">
                  {shopSettings.shopName || 'RepairProShop'}
                </h1>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300 font-bold">
                  RepairPro
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-sm">{shopSettings.address || 'ศูนย์บริการซ่อมมือถือและอุปกรณ์อิเล็กทรอนิกส์ครบวงจร'}</p>
              <div className="text-xs text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span>โทร: <strong className="text-slate-900">{shopSettings.phone || '081-234-5678'}</strong></span>
                {shopSettings.lineId && <span>LINE: <strong className="text-slate-900">{shopSettings.lineId}</strong></span>}
                {shopSettings.taxId && <span>เลขผู้เสียภาษี: {shopSettings.taxId}</span>}
              </div>
            </div>

            <div className="text-right flex items-center gap-2.5 shrink-0">
              <div className="w-14 h-14 border border-slate-300 p-0.5 rounded bg-white shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    shopSettings.lineId?.startsWith('http') ? shopSettings.lineId : `https://line.me/ti/p/~${(shopSettings.lineId || 'RepairProShop').replace('@', '')}`
                  )}`}
                  alt="QR Line" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="inline-block px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded">
                  ใบรับซ่อม / ส่งมอบ
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="text-xs font-mono font-black text-blue-600">{job.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    job.jobType === 'งานในประกัน' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {job.jobType || 'งานใหม่'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  วันที่: {formatDateThai(job.createdAt, true)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Device Information */}
          <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-200 text-xs avoid-break">
            <div className="space-y-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">ข้อมูลลูกค้า</span>
              <div className="font-bold text-sm text-slate-900">{job.customer.name}</div>
              <div>เบอร์โทรศัพท์: <strong className="text-slate-900">{job.customer.phone}</strong></div>
              {job.customer.lineId && <div>LINE: {job.customer.lineId}</div>}
              {job.customer.address && <div className="truncate">ที่อยู่: {job.customer.address}</div>}
            </div>

            <div className="space-y-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">ข้อมูลอุปกรณ์</span>
              <div className="font-bold text-sm text-slate-900">
                {job.device.brand} {job.device.model}
              </div>
              <div>ประเภท: <span className="font-medium">{job.device.categoryLabel}</span></div>
              <div>S/N หรือ IMEI: <span className="font-mono font-medium">{job.device.serialNumber || '-'}</span></div>
              <div>สี: {job.device.color || '-'} • อุปกรณ์ติดมา: {job.device.accessories || '-'}</div>
              {job.device.passcode && (
                <div className="text-amber-800 font-mono text-[11px]">รหัสผ่านเครื่อง: {job.device.passcode}</div>
              )}
            </div>
          </div>

          {/* Issue & Status */}
          <div className="py-2 border-b border-slate-200 text-xs space-y-1.5 avoid-break">
            <div>
              <span className="text-slate-500 font-semibold text-[11px]">อาการเสียที่ได้รับแจ้ง:</span>
              <p className="font-semibold text-slate-900 mt-0.5 bg-amber-50/70 p-2 rounded border border-amber-200">
                {job.issueDescription}
              </p>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-0.5">
              <div>
                <span className="text-slate-500">ช่างผู้รับผิดชอบ: </span>
                <span className="font-bold text-slate-900">{job.technician}</span>
              </div>
              <div>
                <span className="text-slate-500">วันนัดรับเครื่อง: </span>
                <span className="font-bold text-blue-700">
                  {job.dueDate ? formatDateThai(job.dueDate) : 'นัดหมายแจ้งภายหลัง'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">สถานะ: </span>
                <span className="font-bold text-slate-900">
                  {STATUS_MAP[job.status]?.label}
                </span>
              </div>
            </div>

            {job.technicianNotes && (
              <div className="pt-0.5 text-[11px]">
                <span className="text-slate-500">บันทึกช่าง: </span>
                <span className="text-slate-700">{job.technicianNotes}</span>
              </div>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="py-2 border-b border-slate-200 avoid-break">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 text-left font-semibold">
                  <th className="py-1">รายการ</th>
                  <th className="py-1 text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 text-slate-900">
                    ค่าบริการซ่อมและเปลี่ยนอะไหล่ ({job.device.brand} {job.device.model})
                  </td>
                  <td className="py-1.5 text-right font-bold font-mono">
                    {formatCurrency(job.financials.price)}
                  </td>
                </tr>
                {job.financials.deposit > 0 && (
                  <tr>
                    <td className="py-1 text-slate-600">หักเงินมัดจำล่วงหน้า</td>
                    <td className="py-1 text-right text-emerald-600 font-bold font-mono">
                      - {formatCurrency(job.financials.deposit)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 font-bold text-xs sm:text-sm">
                  <td className="pt-1.5">ยอดรวมสุทธิ</td>
                  <td className="pt-1.5 text-right text-blue-700 font-mono">
                    {formatCurrency(job.financials.price)}
                  </td>
                </tr>
                {balanceDue > 0 ? (
                  <tr className="text-xs text-rose-600 font-bold">
                    <td className="pt-0.5">ยอดค้างชำระ (ชำระวันรับเครื่อง)</td>
                    <td className="pt-0.5 text-right font-mono">{formatCurrency(balanceDue)}</td>
                  </tr>
                ) : (
                  <tr className="text-xs text-emerald-600 font-bold">
                    <td className="pt-0.5">สถานะชำระเงิน</td>
                    <td className="pt-0.5 text-right">ชำระเงินครบถ้วนแล้ว</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Warranty & Conditions */}
          <div className="py-2 border-b border-slate-200 text-[11px] text-slate-600 space-y-1 avoid-break">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>การรับประกัน: {job.warranty.warrantyDays > 0 ? `${job.warranty.warrantyDays} วัน` : 'ไม่มีการรับประกัน'}</span>
              {job.warranty.endDate && (
                <span className="text-blue-700"> (ถึงวันที่ {formatDateThai(job.warranty.endDate)})</span>
              )}
            </div>
            <p className="text-[10px] leading-relaxed">
              <strong>เงื่อนไข:</strong> {job.warranty.terms || shopSettings.defaultWarrantyTerms || 'รับประกันเฉพาะอะไหล่ที่เปลี่ยน ไม่รวมความชื้น ตกกระแทก หรือการดัดแปลงสภาพ'}
            </p>
            <p className="text-[10px] text-slate-500">
              * โปรดนำใบรับซ่อมนี้มาแสดงเมื่อมารับเครื่อง หากไม่มารับเครื่องเกิน 60 วัน ทางร้านขอสงวนสิทธิ์ในการจัดการตามระเบียบ
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-4 pb-1 text-center text-xs avoid-break">
            <div>
              <div className="border-b border-slate-400 h-8 w-40 mx-auto mb-1"></div>
              <span className="text-slate-700 font-medium">ลงชื่อ ลูกค้าผู้ส่งเครื่อง</span>
              <div className="text-[10px] text-slate-400 mt-0.5">({job.customer.name})</div>
            </div>
            <div>
              <div className="border-b border-slate-400 h-8 w-40 mx-auto mb-1"></div>
              <span className="text-slate-700 font-medium">ลงชื่อ ช่าง / ผู้รับเครื่อง</span>
              <div className="text-[10px] text-slate-400 mt-0.5">({job.technician})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
