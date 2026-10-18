import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Truck, Receipt, Check, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { RepairJob, CustomerDecision, CancellationReason } from '../types/repair';
import { formatCurrency, CANCELLATION_REASONS } from '../utils/formatters';

interface CostUpdateModalProps {
  job: RepairJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCosts: (
    jobId: string, 
    costs: {
      price: number;
      onsiteServiceFee?: number;
      partsCost: number;
      shippingCost: number;
      otherCost: number;
      customerDecision?: CustomerDecision;
      cancellationReason?: CancellationReason;
      cancellationNotes?: string;
    }
  ) => void;
}

export const CostUpdateModal: React.FC<CostUpdateModalProps> = ({
  job,
  isOpen,
  onClose,
  onSaveCosts,
}) => {
  if (!isOpen || !job) return null;

  const [price, setPrice] = useState<number | ''>(job.financials.price || 0);
  const [onsiteServiceFee, setOnsiteServiceFee] = useState<number | ''>(job.financials.onsiteServiceFee || 0);
  const [partsCost, setPartsCost] = useState<number | ''>(job.financials.partsCost || 0);
  const [shippingCost, setShippingCost] = useState<number | ''>(job.financials.shippingCost || 0);
  const [otherCost, setOtherCost] = useState<number | ''>(job.financials.otherCost || 0);

  // การตัดสินใจของลูกค้า (ตกลงซ่อม / ยกเลิก)
  const [customerDecision, setCustomerDecision] = useState<CustomerDecision>(
    job.status === 'cancelled' ? 'cancelled' : (job.financials.customerDecision || 'accepted')
  );
  const [cancellationReason, setCancellationReason] = useState<CancellationReason>(
    job.cancellationReason || 'ลูกค้ายกเลิก'
  );
  const [cancellationNotes, setCancellationNotes] = useState<string>(job.cancellationNotes || '');

  useEffect(() => {
    if (job) {
      setPrice(job.financials.price || 0);
      setOnsiteServiceFee(job.financials.onsiteServiceFee || 0);
      setPartsCost(job.financials.partsCost || 0);
      setShippingCost(job.financials.shippingCost || 0);
      setOtherCost(job.financials.otherCost || 0);
      setCustomerDecision(job.status === 'cancelled' ? 'cancelled' : (job.financials.customerDecision || 'accepted'));
      setCancellationReason(job.cancellationReason || 'ลูกค้ายกเลิก');
      setCancellationNotes(job.cancellationNotes || '');
    }
  }, [job]);

  const numPrice = typeof price === 'number' ? price : 0;
  const numOnsiteFee = typeof onsiteServiceFee === 'number' ? onsiteServiceFee : 0;
  const numParts = typeof partsCost === 'number' ? partsCost : 0;
  const numShipping = typeof shippingCost === 'number' ? shippingCost : 0;
  const numOther = typeof otherCost === 'number' ? otherCost : 0;

  const totalCost = numParts + numShipping + numOther;
  const totalIncome = numPrice + numOnsiteFee;
  const profit = totalIncome - totalCost;
  const profitMargin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCosts(job.id, {
      price: numPrice,
      onsiteServiceFee: numOnsiteFee,
      partsCost: numParts,
      shippingCost: numShipping,
      otherCost: numOther,
      customerDecision,
      cancellationReason: customerDecision === 'cancelled' ? cancellationReason : undefined,
      cancellationNotes: customerDecision === 'cancelled' ? cancellationNotes : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">ปรับแก้ข้อมูลซ่อมและต้นทุน</span>
              <span className="text-xs bg-slate-800 text-blue-300 font-mono px-2 py-0.5 rounded">
                {job.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {job.customer.name} • {job.device.brand} {job.device.model} ({job.jobType || 'งานใหม่'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* สถานะลูกค้า: ตกลงซ่อม หรือ ยกเลิก (แก้ไขในตารางแทนเมนูเปิดงาน) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              สถานะลูกค้า (การตัดสินใจซ่อม):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCustomerDecision('accepted')}
                className={`py-1.5 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  customerDecision === 'accepted'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ตกลงซ่อม</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomerDecision('cancelled')}
                className={`py-1.5 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  customerDecision === 'cancelled'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>ลูกค้ายกเลิก</span>
              </button>
            </div>

            {customerDecision === 'cancelled' && (
              <div className="mt-2 pt-2 border-t border-rose-200 space-y-2 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">เหตุผลยกเลิก</label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                  >
                    {CANCELLATION_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-rose-800 mb-1">บันทึกเพิ่มเติม</label>
                  <input
                    type="text"
                    placeholder="รายละเอียดเหตุผล..."
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estimated Price & Onsite Service Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>ราคาประเมินค่าซ่อม</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl font-bold text-sm text-blue-900 focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>ค่าบริการนอกสถานที่</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={onsiteServiceFee}
                  onChange={(e) => setOnsiteServiceFee(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-300 rounded-xl font-bold text-sm text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  บาท
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown: ค่าอะไหล่, ค่าจัดส่ง, ค่าใช้จ่ายอื่นๆ */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-xs text-slate-700 block">
              บันทึกต้นทุนและค่าใช้จ่ายจริง
            </span>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  <span>ค่าอะไหล่ (฿)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>ค่าจัดส่ง (฿)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>ค่าใช้จ่ายอื่นๆ (฿)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Live Profit & Total Cost calculation */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>ต้นทุนรวม (อะไหล่+ส่ง+อื่นๆ):</span>
              <strong className="text-rose-600">{formatCurrency(totalCost)}</strong>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>กำไรสุทธิ:</span>
              </span>
              <div className="text-right">
                <span className="text-base font-extrabold text-emerald-700">
                  {formatCurrency(profit)}
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-200 px-1.5 py-0.2 rounded font-bold ml-1.5">
                  {profitMargin}%
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>บันทึกและอัพเดตตาราง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
