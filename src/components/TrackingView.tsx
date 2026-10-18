import React, { useState } from 'react';
import { 
  Search, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  AlertCircle, 
  Phone, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';
import { RepairJob, ShopSettings } from '../types/repair';
import { STATUS_MAP, formatDateThai, formatCurrency, getWarrantyStatus } from '../utils/formatters';

interface TrackingViewProps {
  jobs: RepairJob[];
  shopSettings: ShopSettings;
  onOpenJobDetail: (job: RepairJob) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  jobs,
  shopSettings,
  onOpenJobDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedJob, setSearchedJob] = useState<RepairJob | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.trim().toLowerCase();
    const found = jobs.find(j => 
      j.id.toLowerCase() === term || 
      j.customer.phone.replace(/[^0-9]/g, '') === term.replace(/[^0-9]/g, '') ||
      (j.device.serialNumber && j.device.serialNumber.toLowerCase() === term)
    );

    setSearchedJob(found || null);
    setHasSearched(true);
  };

  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    // Stepper order:
    // 0: Received (pending)
    // 1: In Progress / Parts (in_progress, waiting_parts)
    // 2: Completed (completed)
    // 3: Delivered (delivered)
    if (currentStatus === 'cancelled') {
      return 'cancelled';
    }

    const statusWeights: Record<string, number> = {
      pending: 0,
      in_progress: 1,
      waiting_parts: 1,
      completed: 2,
      delivered: 3,
    };

    const currentWeight = statusWeights[currentStatus] ?? 0;
    if (currentWeight > stepIndex) return 'done';
    if (currentWeight === stepIndex) return 'current';
    return 'upcoming';
  };

  const warrantyResult = searchedJob ? getWarrantyStatus(
    searchedJob.warranty.warrantyDays,
    searchedJob.warranty.startDate,
    searchedJob.warranty.endDate
  ) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Search className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          ระบบติดตามสถานะงานซ่อม (Repair Tracking)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          กรอกรหัสงานซ่อม (เช่น REP-202610-001) หรือเบอร์โทรศัพท์ของท่าน เพื่อตรวจสอบสถานะงานซ่อมแบบเรียลไทม์
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-2 flex gap-2">
          <input
            type="text"
            required
            placeholder="เช่น REP-202610-001 หรือ 081-456-7890"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow transition-all"
          >
            ค้นหา
          </button>
        </form>

        {/* Quick sample chips */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 pt-2">
            <span>ตัวอย่างงานในระบบ:</span>
            {jobs.slice(0, 4).map(j => (
              <button
                key={j.id}
                type="button"
                onClick={() => {
                  setSearchTerm(j.id);
                  setSearchedJob(j);
                  setHasSearched(true);
                }}
                className="text-blue-600 hover:underline bg-slate-100 px-2 py-0.5 rounded font-mono"
              >
                {j.id} ({STATUS_MAP[j.status]?.shortLabel})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Display */}
      {hasSearched && (
        <>
          {searchedJob ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-6 p-6 sm:p-8 animate-in fade-in duration-200">
              {/* Header result */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {searchedJob.id}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_MAP[searchedJob.status]?.badgeClass}`}>
                      {STATUS_MAP[searchedJob.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">
                    {searchedJob.device.brand} {searchedJob.device.model}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    เจ้าของเครื่อง: {searchedJob.customer.name} • วันที่รับเครื่อง: {formatDateThai(searchedJob.createdAt, true)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">ราคาค่าซ่อม</span>
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(searchedJob.financials.price)}
                  </span>
                </div>
              </div>

              {/* Cancelled Banner if cancelled */}
              {searchedJob.status === 'cancelled' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>งานซ่อมนี้ถูกยกเลิกแล้ว</span>
                  </div>
                  <p className="text-rose-700">
                    เหตุผลการยกเลิก: <strong>{searchedJob.cancellationReason || 'ไม่ได้ระบุ'}</strong>
                  </p>
                  {searchedJob.cancellationNotes && (
                    <p className="text-rose-600">รายละเอียดเพิ่มเติม: {searchedJob.cancellationNotes}</p>
                  )}
                </div>
              )}

              {/* Progress Stepper (Only if not cancelled) */}
              {searchedJob.status !== 'cancelled' && (
                <div className="py-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                    ขั้นตอนความคืบหน้าการซ่อม
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
                    {/* Step 1: Received */}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-600 text-white shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-xs text-slate-800">1. รับเครื่องเข้าระบบ</span>
                      <span className="text-[11px] text-slate-400">{formatDateThai(searchedJob.createdAt)}</span>
                    </div>

                    {/* Step 2: Under Repair / Parts */}
                    {(() => {
                      const st = getStepStatus(1, searchedJob.status);
                      const isWaitingParts = searchedJob.status === 'waiting_parts';
                      return (
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                            st === 'done' 
                              ? 'bg-emerald-600 text-white' 
                              : st === 'current'
                              ? isWaitingParts ? 'bg-purple-600 text-white ring-4 ring-purple-100 animate-pulse' : 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {st === 'done' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isWaitingParts ? (
                              <Package className="w-5 h-5" />
                            ) : (
                              <Wrench className="w-5 h-5" />
                            )}
                          </div>
                          <span className={`font-semibold text-xs ${st === 'current' ? 'text-blue-700' : 'text-slate-800'}`}>
                            {isWaitingParts ? '2. รออะไหล่จัดส่ง' : '2. กำลังซ่อมแซม'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {st === 'current' ? 'ช่างกำลังดำเนินการ' : st === 'done' ? 'ตรวจเช็คแล้ว' : 'รอคิวตรวจ'}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Step 3: Completed */}
                    {(() => {
                      const st = getStepStatus(2, searchedJob.status);
                      return (
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                            st === 'done' 
                              ? 'bg-emerald-600 text-white' 
                              : st === 'current'
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <span className={`font-semibold text-xs ${st === 'current' ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                            3. ซ่อมเสร็จเรียบร้อย
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {st === 'current' ? 'พร้อมให้ลูกค้ามารับ' : st === 'done' ? 'เสร็จสมบูรณ์' : 'รอดำเนินการ'}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Step 4: Delivered */}
                    {(() => {
                      const st = getStepStatus(3, searchedJob.status);
                      return (
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                            st === 'current' || st === 'done'
                              ? 'bg-teal-600 text-white' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <span className={`font-semibold text-xs ${st === 'current' ? 'text-teal-700' : 'text-slate-800'}`}>
                            4. ส่งมอบ & รับประกัน
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {st === 'current' || st === 'done' ? 'รับเครื่องแล้ว' : 'ส่งมอบเมื่อมารับ'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Details breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    รายละเอียดงาน
                  </span>
                  <div>อาการเสีย: <strong className="text-slate-800">{searchedJob.issueDescription}</strong></div>
                  <div>ช่างผู้รับผิดชอบ: <span>{searchedJob.technician}</span></div>
                  <div>วันนัดรับเครื่อง: <span className="font-semibold text-blue-700">{searchedJob.dueDate ? formatDateThai(searchedJob.dueDate) : 'แจ้งภายหลัง'}</span></div>
                  {searchedJob.technicianNotes && (
                    <div className="text-slate-600 bg-white p-2 rounded border border-slate-200 mt-1">
                      โน้ตช่าง: {searchedJob.technicianNotes}
                    </div>
                  )}
                </div>

                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    ข้อมูลการรับประกัน
                  </span>
                  <div className="flex items-center justify-between">
                    <span>ระยะเวลารับประกัน:</span>
                    <strong className="text-blue-700">{searchedJob.warranty.warrantyDays} วัน</strong>
                  </div>
                  {warrantyResult && (
                    <div className="flex items-center justify-between">
                      <span>สถานะประกัน:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${warrantyResult.badgeClass}`}>
                        {warrantyResult.label}
                      </span>
                    </div>
                  )}
                  {searchedJob.warranty.endDate && (
                    <div className="flex items-center justify-between">
                      <span>วันสิ้นสุดรับประกัน:</span>
                      <strong>{formatDateThai(searchedJob.warranty.endDate)}</strong>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1">
                    {searchedJob.warranty.terms || shopSettings.defaultWarrantyTerms}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>ติดต่อศูนย์บริการ: <strong>{shopSettings.phone}</strong></span>
                </div>
                <button
                  onClick={() => onOpenJobDetail(searchedJob)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  เปิดดูรายละเอียดเต็มในระบบ
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">ไม่พบข้อมูลงานซ่อมตามรหัสที่ระบุ</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                โปรดตรวจสอบความถูกต้องของรหัสงานซ่อม (เช่น REP-202610-001) หรือเบอร์โทรศัพท์อีกครั้ง
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
