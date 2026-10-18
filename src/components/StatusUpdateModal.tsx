import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Truck, 
  Lock, 
  ShieldCheck, 
  Package, 
  Plus, 
  Trash2, 
  DollarSign, 
  PackageCheck,
  Calculator,
  Wrench,
  Clock,
  Upload,
  Image as ImageIcon,
  FileText,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { RepairJob, RepairStatus, CancellationReason, WaitingPartItem } from '../types/repair';
import { STATUS_MAP, CANCELLATION_REASONS, formatCurrency } from '../utils/formatters';

interface StatusUpdateModalProps {
  job: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    jobId: string, 
    newStatus: RepairStatus, 
    options: {
      price?: number;
      cancellationReason?: CancellationReason;
      cancellationNotes?: string;
      technicianNotes?: string;
      statusNote?: string;
      trackingNumber?: string;
      actualWarrantyDays?: number;
      waitingParts?: WaitingPartItem[];
      partsCost?: number;
      otherCost?: number;
      onsiteServiceFee?: number;
      shippingCost?: number;
      deliveryAttachment?: string;
      deliveryAttachmentName?: string;
    }
  ) => void;
}

// ลำดับขั้นตอนสถานะงานซ่อม: เดินหน้าทีละขั้น ห้ามย้อนกลับ
const STATUS_TO_STEP: Record<RepairStatus, number> = {
  pending: 1,
  in_progress: 2,
  waiting_parts: 2,
  completed: 3,
  ready_to_ship: 4,
  delivered: 5,
  picked_up: 5,
  cancelled: -1,
};

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  job,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !job) return null;

  const jobCurrentStep = STATUS_TO_STEP[job.status] ?? 1;
  const isDelivered = job.status === 'delivered';
  const isPickedUp = job.status === 'picked_up';
  const isCancelled = job.status === 'cancelled';
  const isTerminal = isDelivered || isPickedUp || isCancelled;

  // Active step in modal (starts at minimum of current job step)
  const [activeStep, setActiveStep] = useState<number>(() => {
    if (job.status === 'cancelled') return -1;
    return Math.max(1, jobCurrentStep);
  });

  // Track the minimum step allowed for this session to strictly enforce forward progression
  const [minAllowedStep, setMinAllowedStep] = useState<number>(() => {
    if (job.status === 'cancelled') return -1;
    return Math.max(1, jobCurrentStep);
  });

  // Step 2 sub-choice: 2.1 รออะไหล่ vs 2.2 เปลี่ยนอะไหล่
  const [step2Sub, setStep2Sub] = useState<'2.1_waiting' | '2.2_replace'>(() => {
    return job.status === 'waiting_parts' ? '2.1_waiting' : '2.2_replace';
  });

  // Step 4 sub-choice: 4.1 จัดส่งทางพัสดุ vs 4.2 มารับเอง
  const [step4Sub, setStep4Sub] = useState<'4.1_shipping' | '4.2_pickup'>(() => {
    return job.status === 'picked_up' ? '4.2_pickup' : '4.1_shipping';
  });

  // Step 2 parts items (+ เพิ่ม/ลบได้หลายรายการ)
  const [partsList, setPartsList] = useState<WaitingPartItem[]>(() => {
    if (job.waitingParts && job.waitingParts.length > 0) {
      return job.waitingParts;
    }
    return [{ name: '', price: 0 }];
  });

  // Step 3 fields: แก้ไขราคาประเมินได้, ต้นทุนอะไหล่, ค่าใช้จ่ายอื่น, บริการนอกสถานที่, ประกัน
  const [estimatedPrice, setEstimatedPrice] = useState<number>(job.financials?.price || 0);

  const initialPartsCost = job.financials?.partsCost && job.financials.partsCost > 0
    ? job.financials.partsCost
    : (job.waitingParts && job.waitingParts.length > 0
      ? job.waitingParts.reduce((sum, p) => sum + (p.price || 0), 0)
      : 0);

  const [partsCost, setPartsCost] = useState<number>(initialPartsCost);
  const [otherCost, setOtherCost] = useState<number>(job.financials?.otherCost || 0);
  const [onsiteServiceFee, setOnsiteServiceFee] = useState<number>(job.financials?.onsiteServiceFee || 0);
  const [actualWarrantyDays, setActualWarrantyDays] = useState<number>(
    job.warranty?.warrantyDays && job.warranty.warrantyDays > 0 ? job.warranty.warrantyDays : 90
  );

  // Step 4 fields: จัดส่งพัสดุ (เลขพัสดุ, ค่าส่ง) vs มารับเอง
  const [trackingNumber, setTrackingNumber] = useState<string>(job.trackingNumber || '');
  const [shippingCost, setShippingCost] = useState<number>(job.financials?.shippingCost || 0);

  // Step 5 fields: แนบรูปถ่าย หรือ ไฟล์หลักฐานส่งมอบ / รับเครื่อง
  const [deliveryAttachment, setDeliveryAttachment] = useState<string>(job.deliveryAttachment || '');
  const [deliveryAttachmentName, setDeliveryAttachmentName] = useState<string>(job.deliveryAttachmentName || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notes & cancellation
  const [technicianNotes, setTechnicianNotes] = useState<string>(job.technicianNotes || '');
  const [cancellationReason, setCancellationReason] = useState<CancellationReason>(
    job.cancellationReason || 'ลูกค้ายกเลิก'
  );
  const [cancellationNotes, setCancellationNotes] = useState<string>(job.cancellationNotes || '');
  const [showCancelMode, setShowCancelMode] = useState<boolean>(false);

  // Total parts price calculation
  const totalPartsPrice = partsList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const handleAddPartItem = () => {
    setPartsList(prev => [...prev, { name: '', price: 0 }]);
  };

  const handleRemovePartItem = (index: number) => {
    setPartsList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [{ name: '', price: 0 }];
    });
  };

  const handleUpdatePartItem = (index: number, field: 'name' | 'price', value: any) => {
    setPartsList(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'price' ? Math.max(0, Number(value) || 0) : value,
        };
      }
      return item;
    }));
  };

  // Sync parts price to partsCost
  const handleSyncPartsCost = () => {
    setPartsCost(totalPartsPrice);
  };

  // Handle file attachment for Step 5
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setDeliveryAttachment(result);
      setDeliveryAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setDeliveryAttachment('');
    setDeliveryAttachmentName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Financial preview calculation
  const effectiveShipping = step4Sub === '4.1_shipping' ? (shippingCost || 0) : 0;
  const currentTotalCost = (partsCost || 0) + (otherCost || 0) + effectiveShipping;
  const estimatedProfit = (estimatedPrice + (onsiteServiceFee || 0)) - currentTotalCost;

  // ==========================================
  // ACTION HANDLERS PER STEP (เดินหน้า ห้ามย้อนหลัง)
  // ==========================================

  // Step 1: บันทึกรับงานซ่อม -> ไปขั้นตอนที่ 2
  const handleSaveStep1 = () => {
    onUpdateStatus(job.id, 'in_progress', {
      technicianNotes: technicianNotes.trim() || undefined,
      statusNote: 'รับงานซ่อมเข้าสู่ระบบเรียบร้อย เข้าสู่ขั้นตอนกำลังตรวจซ่อม',
    });
    setMinAllowedStep(2);
    setActiveStep(2);
  };

  // Step 2: บันทึกข้อมูลกำลังตรวจซ่อม (รออะไหล่ / เปลี่ยนอะไหล่) -> ไปขั้นตอนที่ 3
  const handleSaveStep2 = () => {
    const filteredParts = partsList.filter(p => p.name.trim() !== '' || p.price > 0);
    const resolvedParts = partsCost > 0 ? partsCost : totalPartsPrice;
    const targetStatus = step2Sub === '2.1_waiting' ? 'waiting_parts' : 'in_progress';
    const note = step2Sub === '2.1_waiting'
      ? `รออะไหล่: ${filteredParts.map(p => `${p.name} (${formatCurrency(p.price)})`).join(', ') || 'ระบุอะไหล่'} รวม ${formatCurrency(totalPartsPrice)}`
      : `เปลี่ยนอะไหล่: ${filteredParts.map(p => `${p.name} (${formatCurrency(p.price)})`).join(', ') || 'ระบุอะไหล่'} รวม ${formatCurrency(totalPartsPrice)}`;

    onUpdateStatus(job.id, targetStatus, {
      waitingParts: filteredParts,
      partsCost: resolvedParts,
      technicianNotes: technicianNotes.trim() || undefined,
      statusNote: note,
    });

    if (partsCost === 0 && totalPartsPrice > 0) {
      setPartsCost(totalPartsPrice);
    }
    setMinAllowedStep(3);
    setActiveStep(3);
  };

  // Step 3: บันทึกซ่อมเสร็จแล้ว (แก้ไขราคาประเมินได้) -> ไปขั้นตอนที่ 4
  const handleSaveStep3 = () => {
    if (!actualWarrantyDays || actualWarrantyDays <= 0) {
      alert('กรุณาระบุระยะเวลารับประกัน (วัน)');
      return;
    }

    const filteredParts = partsList.filter(p => p.name.trim() !== '' || p.price > 0);
    const resolvedParts = partsCost > 0 ? partsCost : totalPartsPrice;

    onUpdateStatus(job.id, 'completed', {
      price: Math.max(0, estimatedPrice || 0),
      partsCost: resolvedParts,
      otherCost: otherCost || 0,
      onsiteServiceFee: onsiteServiceFee || 0,
      actualWarrantyDays: actualWarrantyDays,
      waitingParts: filteredParts,
      technicianNotes: technicianNotes.trim() || undefined,
      statusNote: `ซ่อมแล้ว (ราคาประเมิน: ${formatCurrency(estimatedPrice)}, อะไหล่: ${formatCurrency(resolvedParts)}, อื่นๆ: ${formatCurrency(otherCost)}, ประกัน: ${actualWarrantyDays} วัน)`,
    });

    setMinAllowedStep(4);
    setActiveStep(4);
  };

  // Step 4: บันทึกรอส่ง (จัดส่งพัสดุ vs มารับเอง) -> ไปขั้นตอนที่ 5
  const handleSaveStep4 = () => {
    const resolvedParts = partsCost > 0 ? partsCost : totalPartsPrice;
    const resolvedShipping = step4Sub === '4.1_shipping' ? (shippingCost || 0) : 0;
    const resolvedTracking = step4Sub === '4.1_shipping' ? trackingNumber.trim() : '';

    onUpdateStatus(job.id, 'ready_to_ship', {
      price: Math.max(0, estimatedPrice || 0),
      partsCost: resolvedParts,
      otherCost: otherCost || 0,
      onsiteServiceFee: onsiteServiceFee || 0,
      shippingCost: resolvedShipping,
      trackingNumber: resolvedTracking || undefined,
      actualWarrantyDays: actualWarrantyDays,
      technicianNotes: technicianNotes.trim() || undefined,
      statusNote: step4Sub === '4.1_shipping'
        ? `รอส่งพัสดุ (เลขพัสดุ: ${resolvedTracking || 'รอระบุ'}, ค่าส่ง: ${formatCurrency(resolvedShipping)})`
        : 'รอส่ง: ลูกค้าจะมารับเครื่องเองที่ร้าน',
    });

    setMinAllowedStep(5);
    setActiveStep(5);
  };

  // Step 5: บันทึกส่งมอบเรียบร้อย -> บันทึกหน้ารายได้ & ประกัน (สิ้นสุด 100% ห้ามย้อนกลับ 1-5 อีก)
  const handleSaveStep5 = () => {
    const targetStatus = step4Sub === '4.2_pickup' ? 'picked_up' : 'delivered';
    const resolvedParts = partsCost > 0 ? partsCost : totalPartsPrice;
    const resolvedShipping = step4Sub === '4.1_shipping' ? (shippingCost || 0) : 0;
    const resolvedTracking = step4Sub === '4.1_shipping' ? trackingNumber.trim() : '';

    onUpdateStatus(job.id, targetStatus, {
      price: Math.max(0, estimatedPrice || 0),
      partsCost: resolvedParts,
      otherCost: otherCost || 0,
      onsiteServiceFee: onsiteServiceFee || 0,
      shippingCost: resolvedShipping,
      trackingNumber: resolvedTracking || undefined,
      actualWarrantyDays: actualWarrantyDays,
      deliveryAttachment: deliveryAttachment || undefined,
      deliveryAttachmentName: deliveryAttachmentName || undefined,
      technicianNotes: technicianNotes.trim() || undefined,
      statusNote: targetStatus === 'delivered'
        ? `ส่งมอบเรียบร้อย (จัดส่งพัสดุ ${resolvedTracking || 'ไม่มีเลข'}, ค่าส่ง: ${formatCurrency(resolvedShipping)}, ประกัน: ${actualWarrantyDays} วัน)`
        : `ส่งมอบเรียบร้อย (ลูกค้ารับเครื่องเองที่ร้าน, ค่าส่ง 0 บาท, ประกัน: ${actualWarrantyDays} วัน)`,
    });

    // Close modal on completed delivery
    onClose();
  };

  // Confirm cancel job
  const handleConfirmCancel = () => {
    onUpdateStatus(job.id, 'cancelled', {
      cancellationReason,
      cancellationNotes: cancellationNotes.trim() || undefined,
      statusNote: `ยกเลิกงานซ่อม: ${cancellationReason} ${cancellationNotes ? `- ${cancellationNotes}` : ''}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">อัพเดตสถานะงานซ่อม</span>
              <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded font-mono text-blue-300 font-bold">
                {job.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ลูกค้า: {job.customer.name} • {job.device.brand} {job.device.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          
          {/* Current Status Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">สถานะงานปัจจุบัน:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${STATUS_MAP[job.status]?.badgeClass}`}>
                {STATUS_MAP[job.status]?.label}
              </span>
              {!isTerminal && (
                <>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ขั้นตอนปัจจุบัน: {activeStep}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Terminal Locked Banner (งานเสร็จสิ้น 100% หรือถูกยกเลิกแล้ว) */}
          {isTerminal ? (
            <div className="p-5 bg-slate-50 rounded-2xl text-center space-y-3 border border-slate-200 text-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                {isCancelled ? <AlertTriangle className="w-6 h-6 text-rose-500" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {isDelivered 
                    ? 'งานนี้จัดส่งพัสดุเรียบร้อยแล้ว (สิ้นสุดกระบวนการ)' 
                    : isPickedUp
                    ? 'ลูกค้ามารับเครื่องเองเรียบร้อยแล้ว (สิ้นสุดกระบวนการ)'
                    : `งานนี้ถูกยกเลิกแล้ว (${job.cancellationReason || 'ไม่ระบุ'})`}
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  กระบวนการเสร็จสมบูรณ์ ห้ามย้อนกลับมาขั้นตอนก่อนหน้าตามกฎของระบบ
                </p>
              </div>

              {/* Display attachment if exists */}
              {job.deliveryAttachment && (
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-left space-y-2 mt-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>หลักฐานการส่งมอบ:</span>
                  </span>
                  <div className="rounded-lg overflow-hidden border border-slate-200 max-h-48 flex justify-center bg-slate-100">
                    <img 
                      src={job.deliveryAttachment} 
                      alt="หลักฐานการส่งมอบ" 
                      className="object-contain max-h-48 w-auto rounded"
                    />
                  </div>
                  {job.deliveryAttachmentName && (
                    <p className="text-[10px] text-slate-500 truncate">{job.deliveryAttachmentName}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>ขั้นตอนการดำเนินงาน (เดินหน้าทีละขั้น ห้ามย้อนหลัง)</span>
                <span className="text-[11px] text-blue-600 font-semibold">ขั้นตอนที่ {activeStep} จาก 5</span>
              </div>

              {/* ========================================================= */}
              {/* 1. รับงานซ่อม: เมื่อกดบันทึกแล้ว ไปขั้นตอนที่ 2 ห้ามย้อนกลับ */}
              {/* ========================================================= */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                minAllowedStep > 1
                  ? 'border-slate-200 bg-slate-50/80 opacity-75' // Locked
                  : activeStep === 1
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-400/20 shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      minAllowedStep > 1 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {minAllowedStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          1. รับงานซ่อม
                        </span>
                        {minAllowedStep > 1 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>บันทึกแล้ว (ล็อค)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        รับเครื่องเข้าสู่ระบบ ตรวจเช็คอาการเบื้องต้น
                      </p>
                    </div>
                  </div>

                  {/* Button in Step 1 */}
                  {minAllowedStep === 1 && activeStep === 1 && (
                    <button
                      type="button"
                      onClick={handleSaveStep1}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึก (ไปขั้นที่ 2)</span>
                    </button>
                  )}
                </div>

                {/* Content shown when active in Step 1 */}
                {minAllowedStep === 1 && activeStep === 1 && (
                  <div className="mt-2.5 pt-2.5 border-t border-blue-200 text-xs text-slate-600 bg-white p-2.5 rounded-lg border">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">อาการเสีย:</span>
                        <span className="font-semibold text-slate-800">{job.issueDescription}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ช่างผู้รับผิดชอบ:</span>
                        <span className="font-semibold text-slate-800">{job.technician}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 2. กำลังตรวจซ่อม: รออะไหล่, เปลี่ยนอะไหล่ + ปุ่มบันทึก -> ขั้นที่ 3 */}
              {/* ========================================================= */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                minAllowedStep > 2
                  ? 'border-slate-200 bg-slate-50/80 opacity-75' // Locked
                  : activeStep === 2
                  ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-400/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      minAllowedStep > 2
                        ? 'bg-emerald-600 text-white'
                        : activeStep === 2
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {minAllowedStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          2. กำลังตรวจซ่อม
                        </span>
                        {minAllowedStep > 2 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>บันทึกแล้ว (ล็อค)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        2.1 รออะไหล่ หรือ 2.2 เปลี่ยนอะไหล่ (กรอกรายการ & ราคา)
                      </p>
                    </div>
                  </div>

                  {/* Inactive label if not reached yet */}
                  {minAllowedStep < 2 && (
                    <span className="text-[11px] text-slate-400 font-medium">รอขั้นตอนที่ 1</span>
                  )}
                </div>

                {/* Active Form in Step 2 */}
                {minAllowedStep === 2 && activeStep === 2 && (
                  <div className="mt-3 pt-3 border-t border-purple-200 space-y-3 animate-in fade-in">
                    {/* Sub-choice 2.1 vs 2.2 */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStep2Sub('2.1_waiting')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          step2Sub === '2.1_waiting'
                            ? 'bg-purple-100 border-purple-500 font-bold text-purple-900 ring-1 ring-purple-400 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span>2.1) รออะไหล่</span>
                          {step2Sub === '2.1_waiting' && <Check className="w-3.5 h-3.5 text-purple-700" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                          กรอกรายการอะไหล่ & ราคา
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep2Sub('2.2_replace')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          step2Sub === '2.2_replace'
                            ? 'bg-purple-100 border-purple-500 font-bold text-purple-900 ring-1 ring-purple-400 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span>2.2) เปลี่ยนอะไหล่</span>
                          {step2Sub === '2.2_replace' && <Check className="w-3.5 h-3.5 text-purple-700" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                          กรอกรายการอะไหล่ & ราคา
                        </p>
                      </button>
                    </div>

                    {/* Parts input form (+ เพิ่มได้หลายรายการ) */}
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-purple-600" />
                          <span>
                            {step2Sub === '2.1_waiting' ? 'รายการอะไหล่ที่รอ & ราคา' : 'รายการอะไหล่ที่เปลี่ยน & ราคา'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={handleAddPartItem}
                          className="text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ เพิ่มรายการ</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {partsList.map((item, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="รายละเอียดอะไหล่ เช่น หน้าจอ OLED, แบตเตอรี่, IC Charge..."
                              value={item.name}
                              onChange={(e) => handleUpdatePartItem(index, 'name', e.target.value)}
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-400"
                            />
                            <div className="w-28 relative">
                              <input
                                type="number"
                                min="0"
                                placeholder="ราคา (บาท)"
                                value={item.price || ''}
                                onChange={(e) => handleUpdatePartItem(index, 'price', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right pr-6 focus:ring-2 focus:ring-purple-400"
                              />
                              <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 pointer-events-none">฿</span>
                            </div>
                            {partsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePartItem(index)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-xs font-semibold text-purple-950">
                        <span>รวมราคาอะไหล่:</span>
                        <span className="font-mono text-sm font-bold text-purple-900">
                          {formatCurrency(totalPartsPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Step 2 Save button */}
                    <button
                      type="button"
                      onClick={handleSaveStep2}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกขั้นตอนที่ 2 (ไปขั้นตอนที่ 3)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 3. ซ่อมเสร็จแล้ว: แก้ไขราคาประเมินได้ + ปุ่มบันทึก -> ขั้นที่ 4 */}
              {/* ========================================================= */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                minAllowedStep > 3
                  ? 'border-slate-200 bg-slate-50/80 opacity-75' // Locked
                  : activeStep === 3
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      minAllowedStep > 3
                        ? 'bg-emerald-600 text-white'
                        : activeStep === 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {minAllowedStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          3. ซ่อมเสร็จแล้ว
                        </span>
                        {minAllowedStep > 3 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>บันทึกแล้ว (ล็อค)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        แก้ไขราคาประเมินได้, ต้นทุนอะไหล่, ค่าใช้จ่าย, ระยะประกัน
                      </p>
                    </div>
                  </div>

                  {minAllowedStep < 3 && (
                    <span className="text-[11px] text-slate-400 font-medium">รอขั้นตอนที่ 2</span>
                  )}
                </div>

                {/* Active Form in Step 3 */}
                {minAllowedStep === 3 && activeStep === 3 && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 space-y-3 animate-in fade-in">
                    {/* Summary of parts from step 2 if entered */}
                    {partsList.some(p => p.name || p.price > 0) && (
                      <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <span className="font-bold text-emerald-900 block">อะไหล่จากขั้นตอนที่ 2:</span>
                        <div className="text-slate-600 text-[11px] flex flex-wrap gap-1.5">
                          {partsList.filter(p => p.name || p.price > 0).map((p, i) => (
                            <span key={i} className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              {p.name || 'อะไหล่'}: {formatCurrency(p.price)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. แก้ไข ราคาประเมิน (ค่าบริการซ่อมที่แจ้งลูกค้า) */}
                      <div className="sm:col-span-2 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-300">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                            <span>ราคาประเมินค่าซ่อม (บาท) [แก้ไขได้]</span>
                          </label>
                          <span className="text-[10px] text-emerald-700 font-medium">จะบันทึกลงหน้ารายได้</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={estimatedPrice || ''}
                          onChange={(e) => setEstimatedPrice(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-sm font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          placeholder="0"
                        />
                      </div>

                      {/* 2. ต้นทุนอะไหล่ */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800">
                            ต้นทุนอะไหล่ (บาท)
                          </label>
                          {totalPartsPrice > 0 && partsCost !== totalPartsPrice && (
                            <button
                              type="button"
                              onClick={handleSyncPartsCost}
                              className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                            >
                              ดึงยอด ({formatCurrency(totalPartsPrice)})
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={partsCost || ''}
                          onChange={(e) => setPartsCost(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                      </div>

                      {/* 3. ค่าใช้จ่ายอื่น */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          ค่าใช้จ่ายอื่น (บาท)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={otherCost || ''}
                          onChange={(e) => setOtherCost(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                      </div>

                      {/* 4. ค่าบริการนอกสถานที่ */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          ค่าบริการนอกสถานที่ (บาท)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={onsiteServiceFee || ''}
                          onChange={(e) => setOnsiteServiceFee(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          placeholder="0"
                        />
                      </div>

                      {/* 5. ระยะเวลารับประกันแท้จริง */}
                      <div>
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          ระยะเวลารับประกัน (วัน) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={actualWarrantyDays || ''}
                          onChange={(e) => setActualWarrantyDays(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                          placeholder="เช่น 30, 60, 90"
                        />
                      </div>
                    </div>

                    {/* Summary card */}
                    <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>ราคาประเมิน: {formatCurrency(estimatedPrice)} {onsiteServiceFee > 0 ? `+ บริการนอกสถานที่: ${formatCurrency(onsiteServiceFee)}` : ''}</span>
                        <span>ต้นทุนรวม: {formatCurrency(currentTotalCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 border-t border-slate-100 pt-1 text-sm">
                        <span>กำไรสุทธิประเมิน:</span>
                        <span className="font-mono">{formatCurrency(estimatedProfit)}</span>
                      </div>
                    </div>

                    {/* Step 3 Save button */}
                    <button
                      type="button"
                      onClick={handleSaveStep3}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกขั้นตอนที่ 3 (ไปขั้นตอนที่ 4)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 4. รอส่ง: มีแค่ จัดส่งพัสดุ และ มารับเอง + ปุ่มบันทึก -> ขั้นที่ 5 */}
              {/* ========================================================= */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                minAllowedStep > 4
                  ? 'border-slate-200 bg-slate-50/80 opacity-75' // Locked
                  : activeStep === 4
                  ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-400/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      minAllowedStep > 4
                        ? 'bg-emerald-600 text-white'
                        : activeStep === 4
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {minAllowedStep > 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          4. รอส่ง
                        </span>
                        {minAllowedStep > 4 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>บันทึกแล้ว (ล็อค)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        เลือก จัดส่งทางพัสดุ หรือ มารับเอง
                      </p>
                    </div>
                  </div>

                  {minAllowedStep < 4 && (
                    <span className="text-[11px] text-slate-400 font-medium">รอขั้นตอนที่ 3</span>
                  )}
                </div>

                {/* Active Form in Step 4: ONLY 2 buttons as requested */}
                {minAllowedStep === 4 && activeStep === 4 && (
                  <div className="mt-3 pt-3 border-t border-cyan-200 space-y-3 animate-in fade-in">
                    {/* Two choice buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStep4Sub('4.1_shipping')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          step4Sub === '4.1_shipping'
                            ? 'bg-cyan-100 border-cyan-500 font-bold text-cyan-900 ring-1 ring-cyan-400 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-cyan-600" />
                            <span>จัดส่งทางพัสดุ</span>
                          </span>
                          {step4Sub === '4.1_shipping' && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                          กรอกเลขพัสดุ & ค่าส่ง
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep4Sub('4.2_pickup')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          step4Sub === '4.2_pickup'
                            ? 'bg-emerald-100 border-emerald-500 font-bold text-emerald-900 ring-1 ring-emerald-400 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>มารับเอง</span>
                          </span>
                          {step4Sub === '4.2_pickup' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                          ลูกค้ามารับเองที่ร้าน (ค่าส่ง 0)
                        </p>
                      </button>
                    </div>

                    {/* Shipping Inputs if 4.1 vs Pickup info if 4.2 */}
                    {step4Sub === '4.1_shipping' ? (
                      <div className="bg-white p-3 rounded-xl border border-cyan-200 space-y-2.5 shadow-2xs">
                        <div>
                          <label className="block text-xs font-bold text-cyan-950 mb-1">
                            เลขพัสดุ (Tracking Number)
                          </label>
                          <input
                            type="text"
                            placeholder="เช่น Flash TH09281394, Kerry KEX991204, EMS ED123..."
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-cyan-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-cyan-950 mb-1">
                            ค่าส่ง (บาท) <span className="text-cyan-600 font-normal">(บันทึกลงในตารางหน้ารายได้)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={shippingCost || ''}
                              onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value) || 0))}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-cyan-300 rounded-lg text-xs font-mono font-bold text-cyan-950 pr-8 focus:ring-2 focus:ring-cyan-500"
                            />
                            <span className="absolute right-3 top-2 text-xs text-slate-400">บาท</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <PackageCheck className="w-4 h-4 text-emerald-600" />
                          <span>ลูกค้ามารับเครื่องเองที่ร้าน</span>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          กำหนดค่าส่งอัตโนมัติเป็น 0 บาท และบันทึกสถานะรอรับมอบที่ร้าน
                        </p>
                      </div>
                    )}

                    {/* Step 4 Save button */}
                    <button
                      type="button"
                      onClick={handleSaveStep4}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกขั้นตอนที่ 4 (ไปขั้นตอนที่ 5)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 5. ส่งมอบเรียบร้อย: ลบรายละเอียดส่วนเกินออก แนบรูปถ่าย/ไฟล์ + บันทึกหน้ารายได้, ประกัน */}
              {/* ========================================================= */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                minAllowedStep > 5
                  ? 'border-slate-200 bg-slate-50/80 opacity-75' // Locked
                  : activeStep === 5
                  ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-400/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      minAllowedStep > 5
                        ? 'bg-emerald-600 text-white'
                        : activeStep === 5
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}>
                      {minAllowedStep > 5 ? <Check className="w-3.5 h-3.5" /> : '5'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          5. ส่งมอบเรียบร้อย
                        </span>
                        {minAllowedStep > 5 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>บันทึกแล้ว (ล็อค)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        บันทึก ทุกอย่างลงตารางในหน้า รายได้ และ ประกัน (สิ้นสุดกระบวนการ)
                      </p>
                    </div>
                  </div>

                  {minAllowedStep < 5 && (
                    <span className="text-[11px] text-slate-400 font-medium">รอขั้นตอนที่ 4</span>
                  )}
                </div>

                {/* Active Form in Step 5: Clean, concise + Image attachment */}
                {minAllowedStep === 5 && activeStep === 5 && (
                  <div className="mt-3 pt-3 border-t border-teal-200 space-y-3 animate-in fade-in">
                    
                    {/* Concise Summary Banner */}
                    <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-teal-950 font-bold border-b border-teal-100 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-teal-600" />
                          <span>ยืนยันการส่งมอบเครื่อง</span>
                        </span>
                        <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                          {step4Sub === '4.1_shipping' 
                            ? `จัดส่งพัสดุ (${trackingNumber || 'ไม่มีเลขพัสดุ'})` 
                            : 'ลูกค้ามารับเองที่ร้าน'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-0.5">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">บันทึกหน้ารายได้:</span>
                          <span className="font-bold text-slate-800">
                            ราคา: {formatCurrency(estimatedPrice)} • กำไร: {formatCurrency(estimatedProfit)}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 block text-[10px]">บันทึกหน้าประกัน:</span>
                          <span className="font-bold text-slate-800">
                            รับประกัน: {actualWarrantyDays} วัน (เริ่มนับจากวันนี้)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attachment Box: สามารถแนบรูปถ่าย หรือ ไฟล์ กรณีจัดส่งแล้ว และ กรณีมารับเอง */}
                    <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                          <span>แนบรูปถ่าย หรือ ไฟล์หลักฐาน ({step4Sub === '4.1_shipping' ? 'สลิปพัสดุ / กล่อง' : 'ลูกค้าเซ็นรับเครื่อง'})</span>
                        </span>
                        <span className="text-[10px] text-slate-400">(ไม่บังคับ)</span>
                      </div>

                      {deliveryAttachment ? (
                        <div className="space-y-2">
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-40 bg-slate-50 flex items-center justify-center p-2">
                            <img 
                              src={deliveryAttachment} 
                              alt="หลักฐานส่งมอบ" 
                              className="max-h-36 object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveAttachment}
                              className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow transition-colors cursor-pointer"
                              title="ลบรูป"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {deliveryAttachmentName && (
                            <div className="text-[11px] text-slate-600 truncate flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{deliveryAttachmentName}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="delivery-file-input"
                          />
                          <label
                            htmlFor="delivery-file-input"
                            className="flex flex-col items-center justify-center border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/30 hover:bg-teal-50/60 p-3.5 rounded-xl cursor-pointer transition-colors"
                          >
                            <Upload className="w-5 h-5 text-teal-600 mb-1" />
                            <span className="text-xs font-semibold text-teal-900">
                              คลิกเพื่อแนบรูปถ่าย หรือ ไฟล์เอกสาร
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              JPG, PNG หรือ PDF (ขนาดไม่เกิน 8MB)
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Step 5 Save button: บันทึกส่งมอบเรียบร้อย */}
                    <button
                      type="button"
                      onClick={handleSaveStep5}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกส่งมอบเรียบร้อย (บันทึกหน้ารายได้ & ประกัน)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technician Notes (Always visible if not terminal) */}
          {!isTerminal && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุช่าง / รายละเอียดการดำเนินการ:
              </label>
              <textarea
                rows={2}
                placeholder="ระบุข้อความเพิ่มเติมหรือบันทึกอาการสำหรับงานนี้..."
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Cancellation Option (At bottom) */}
          {!isTerminal && (
            <div className="pt-2 border-t border-slate-200">
              {showCancelMode ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>ระบุเหตุผลการยกเลิก</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCancelMode(false)}
                      className="text-slate-500 hover:text-slate-700 text-[11px] cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {CANCELLATION_REASONS.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setCancellationReason(r)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          cancellationReason === r
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="พิมพ์รายละเอียดเหตุผลเพิ่มเติม..."
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />

                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    ยืนยันยกเลิกงานซ่อมนี้
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCancelMode(true)}
                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ต้องการยกเลิกงานซ่อมนี้?</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิด
          </button>
          
          <span className="text-[11px] text-slate-500 font-medium">
            ระบบจะบันทึกและล็อคขั้นตอนตามลำดับที่กด
          </span>
        </div>
      </div>
    </div>
  );
};
