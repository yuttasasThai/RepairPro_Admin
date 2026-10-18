import React from 'react';
import { 
  X, 
  Printer, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Phone, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  User, 
  DollarSign,
  Share2
} from 'lucide-react';
import { RepairJob, ShopSettings } from '../types/repair';
import { 
  STATUS_MAP, 
  formatCurrency, 
  formatDateThai, 
  getWarrantyStatus,
  getJobWarrantyStatus 
} from '../utils/formatters';

interface JobDetailModalProps {
  job: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStatusUpdate: (job: RepairJob) => void;
  onOpenPrint: (job: RepairJob) => void;
  onDeleteJob: (jobId: string) => void;
  shopSettings: ShopSettings;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onOpenStatusUpdate,
  onOpenPrint,
  onDeleteJob,
}) => {
  if (!isOpen || !job) return null;

  const warrantyResult = getJobWarrantyStatus(job);

  const balanceDue = (job.financials.price || 0) - (job.financials.paidAmount || 0);

  const handleDelete = () => {
    if (confirm(`คุณต้องการลบงานซ่อมรหัส "${job.id}" ของคุณ ${job.customer.name} ใช่หรือไม่?`)) {
      onDeleteJob(job.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-base bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-lg">
              {job.id}
            </span>
            <div>
              <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>{job.device.brand} {job.device.model}</span>
              </h2>
              <p className="text-xs text-slate-400">
                เปิดรับงาน: {formatDateThai(job.createdAt, true)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(job)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="พิมพ์เอกสาร"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Status & Quick Action Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {job.jobType === 'งานในประกัน' ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🛡️ ในประกัน
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  🆕 งานใหม่
                </span>
              )}
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${STATUS_MAP[job.status]?.badgeClass}`}>
                {STATUS_MAP[job.status]?.label}
              </span>
              {job.trackingNumber && (
                <span className="text-xs bg-teal-50 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-md font-mono font-bold">
                  เลขพัสดุ: {job.trackingNumber}
                </span>
              )}
              {job.status === 'cancelled' && job.cancellationReason && (
                <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md font-medium">
                  เหตุผล: {job.cancellationReason}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenStatusUpdate(job);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>เปลี่ยนสถานะงาน</span>
            </button>
          </div>

          {/* Cancellation details if cancelled */}
          {job.status === 'cancelled' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>งานนี้ถูกยกเลิก: {job.cancellationReason}</span>
              </div>
              {job.cancellationNotes && (
                <p className="text-rose-700">หมายเหตุ: {job.cancellationNotes}</p>
              )}
            </div>
          )}

          {/* Customer & Device Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-500" />
                <span>ข้อมูลลูกค้า</span>
              </div>
              <div className="text-base font-bold text-slate-800">{job.customer.name}</div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a href={`tel:${job.customer.phone}`} className="hover:text-blue-600 font-medium">
                  {job.customer.phone}
                </a>
              </div>
              {job.customer.lineId && (
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400">LINE ID: </span>
                  <span className="font-medium text-emerald-700">{job.customer.lineId}</span>
                </div>
              )}
              {job.customer.address && (
                <div className="text-xs text-slate-500">
                  <span>ที่อยู่: </span>
                  <span>{job.customer.address}</span>
                </div>
              )}
            </div>

            {/* Device Box */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
              <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <span>ข้อมูลอุปกรณ์</span>
              </div>
              <div className="text-base font-bold text-slate-800">
                {job.device.brand} {job.device.model}
              </div>
              <div className="text-xs text-slate-600">
                ประเภท: <span className="font-medium">{job.device.categoryLabel}</span>
                {job.device.color && <span> • สี {job.device.color}</span>}
              </div>
              <div className="text-xs text-slate-600">
                S/N หรือ IMEI: <span className="font-mono font-medium">{job.device.serialNumber || '-'}</span>
              </div>
              {job.device.accessories && (
                <div className="text-xs text-slate-500">
                  อุปกรณ์ติดมา: {job.device.accessories}
                </div>
              )}
              {job.device.passcode && (
                <div className="text-xs text-amber-700 font-mono">
                  รหัสผ่านเครื่อง: {job.device.passcode}
                </div>
              )}
            </div>
          </div>

          {/* Issue & Technician */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">อาการเสีย</span>
              <p className="mt-1 text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {job.issueDescription}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500">ช่างผู้ดูแล: </span>
                <span className="font-semibold text-slate-800">{job.technician}</span>
              </div>
              <div>
                <span className="text-slate-500">วันนัดรับเครื่อง: </span>
                <span className="font-semibold text-blue-600">
                  {job.dueDate ? formatDateThai(job.dueDate) : '-'}
                </span>
              </div>
            </div>
            {job.technicianNotes && (
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">บันทึกของช่าง</span>
                <p className="mt-1 text-xs text-slate-700 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                  {job.technicianNotes}
                </p>
              </div>
            )}
          </div>

          {/* Financial Breakdown (รายได้ ต้นทุน กำไร) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>สรุปการเงิน (รายได้ / ต้นทุน / กำไร)</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                ชำระ: {job.financials.paymentStatus === 'paid' ? 'ชำระครบแล้ว' : job.financials.paymentStatus === 'deposit_paid' ? 'มัดจำแล้ว' : 'ยังไม่ชำระ'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                <span className="text-[11px] text-blue-600 font-medium">ค่าซ่อม (รายได้)</span>
                <div className="text-base font-bold text-blue-900 mt-0.5">
                  {formatCurrency(job.financials.price)}
                </div>
              </div>

              <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
                <span className="text-[11px] text-rose-600 font-medium">ต้นทุนรวม</span>
                <div className="text-base font-bold text-rose-800 mt-0.5">
                  {formatCurrency(job.financials.totalCost)}
                </div>
                <div className="text-[10px] text-slate-500">อะไหล่ {formatCurrency(job.financials.partsCost)}</div>
              </div>

              <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-600 font-medium">กำไรสุทธิ</span>
                <div className="text-base font-bold text-emerald-800 mt-0.5">
                  {formatCurrency(job.financials.profit)}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">
                  {job.financials.price > 0 ? `${Math.round((job.financials.profit / job.financials.price) * 100)}%` : '0%'}
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">ยอดคงค้าง</span>
                <div className={`text-base font-bold mt-0.5 ${balanceDue > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {balanceDue > 0 ? formatCurrency(balanceDue) : 'ชำระครบ'}
                </div>
                <div className="text-[10px] text-slate-500">มัดจำ {formatCurrency(job.financials.deposit)}</div>
              </div>
            </div>
          </div>

          {/* Warranty Section */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span>ข้อมูลการรับประกัน</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs ${warrantyResult.badgeClass}`}>
                {warrantyResult.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 text-slate-600">
              <div>ระยะเวลาประกัน: <strong>{job.warranty.warrantyDays} วัน</strong></div>
              <div>
                {job.status === 'delivered' ? (
                  <>วันส่งพัสดุ: <strong>{warrantyResult.deliveryDate ? formatDateThai(warrantyResult.deliveryDate) : '-'}</strong></>
                ) : (
                  <>เริ่มนับประกัน: <strong className="text-amber-700">เมื่อส่งพัสดุ</strong></>
                )}
              </div>
              <div>
                {job.status === 'delivered' ? (
                  <>หมดประกัน: <strong>{warrantyResult.endDate ? formatDateThai(warrantyResult.endDate) : '-'}</strong></>
                ) : (
                  <>สถานะ: <strong className="text-amber-700">ยังไม่เริ่มนับ</strong></>
                )}
              </div>
            </div>

            {job.warranty.terms && (
              <p className="text-xs text-slate-500 pt-1">
                เงื่อนไข: {job.warranty.terms}
              </p>
            )}
          </div>

          {/* Delivery Attachment / Proof (รูปถ่าย หรือ ไฟล์หลักฐานส่งมอบ) */}
          {job.deliveryAttachment && (
            <div className="border border-teal-200 rounded-xl p-4 space-y-2.5 bg-teal-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span>หลักฐานการส่งมอบ (รูปถ่าย / ไฟล์แนบ)</span>
                </span>
                {job.deliveryAttachmentName && (
                  <span className="text-[11px] text-teal-700 font-mono truncate max-w-[200px]">
                    {job.deliveryAttachmentName}
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-teal-200 bg-white p-2 flex justify-center max-h-64">
                <img 
                  src={job.deliveryAttachment} 
                  alt="หลักฐานการส่งมอบ" 
                  className="max-h-60 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Status Timeline History */}
          {job.history && job.history.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>ประวัติการดำเนินงาน</span>
              </span>
              <div className="space-y-2 pt-1">
                {job.history.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {STATUS_MAP[h.status]?.label || h.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateThai(h.timestamp, true)}
                        </span>
                      </div>
                      {h.note && <p className="text-slate-600 text-xs mt-0.5">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>ลบงานนี้</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrint(job)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบรับซ่อม</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenStatusUpdate(job);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>อัพเดตสถานะ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
