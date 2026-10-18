import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Package, 
  Truck, 
  XCircle, 
  Phone, 
  ArrowUpRight, 
  Eye, 
  ShieldCheck,
  ShieldX,
  Sparkles,
  Layers,
  Inbox,
  Search,
  X,
  Printer,
  User,
  Filter
} from 'lucide-react';
import { RepairJob, RepairStatus, ShopSettings } from '../types/repair';
import { 
  STATUS_MAP, 
  formatCurrency, 
  formatDateThai, 
  getJobWarrantyStatus 
} from '../utils/formatters';
import { DonutPieChart, PieChartData } from './PieChart';

interface DashboardViewProps {
  jobs: RepairJob[];
  shopSettings: ShopSettings;
  onOpenNewJob: () => void;
  onOpenJobDetail: (job: RepairJob) => void;
  onOpenStatusUpdate: (job: RepairJob) => void;
  onOpenCostUpdate: (job: RepairJob) => void;
  onOpenPrint: (job: RepairJob) => void;
  onNavigateToWarranty: () => void;
  onNavigateToJobs: (filterStatus?: RepairStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jobs,
  shopSettings,
  onOpenNewJob,
  onOpenJobDetail,
  onOpenStatusUpdate,
  onOpenCostUpdate,
  onOpenPrint,
  onNavigateToWarranty,
  onNavigateToJobs,
}) => {
  // Quick Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered jobs for quick access by customer name or phone number
  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedQueryPhone = query.replace(/\D/g, '');

    return jobs.filter(job => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (job.status !== statusFilter) {
          return false;
        }
      }

      // 2. Search query filter (customer name or phone)
      if (!query) return true;

      // Filter by customer name
      const customerName = (job.customer.name || '').toLowerCase();
      if (customerName.includes(query)) return true;

      // Filter by customer phone
      const rawPhone = job.customer.phone || '';
      if (rawPhone.toLowerCase().includes(query)) return true;
      if (normalizedQueryPhone.length > 0) {
        const cleanPhone = rawPhone.replace(/\D/g, '');
        if (cleanPhone.includes(normalizedQueryPhone)) return true;
      }

      // Also match Job ID or device model for convenience
      const jobId = (job.id || '').toLowerCase();
      if (jobId.includes(query)) return true;

      const deviceDesc = `${job.device.brand || ''} ${job.device.model || ''}`.toLowerCase();
      if (deviceDesc.includes(query)) return true;

      return false;
    });
  }, [jobs, searchQuery, statusFilter]);

  // งานเข้าใหม่ (สถานะ pending หรือ งานใหม่ที่ยังไม่ส่งมอบ)
  const newJobsCount = useMemo(() => {
    return jobs.filter(j => j.status === 'pending').length;
  }, [jobs]);

  const totalJobsCount = jobs.length;

  const inProgressCount = useMemo(() => {
    return jobs.filter(j => j.status === 'in_progress' || j.status === 'waiting_parts').length;
  }, [jobs]);

  const completedDeliveredCount = useMemo(() => {
    return jobs.filter(j => j.status === 'delivered' || j.status === 'picked_up' || j.status === 'completed').length;
  }, [jobs]);

  // Financial aggregates
  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials.price || 0) + (j.financials.onsiteServiceFee || 0), 0);
  }, [jobs]);

  const totalCost = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials.totalCost || 0), 0);
  }, [jobs]);

  const totalProfit = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials.profit || 0), 0);
  }, [jobs]);

  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // 1. กราฟวงกลมของหน้าตารางงาน (Repair Table Jobs Pie: แบ่งตามสถานะงาน)
  const tableStatusPieData: PieChartData[] = useMemo(() => {
    const total = jobs.length;
    if (total === 0) return [];

    const countStatus = (s: RepairStatus) => jobs.filter(j => j.status === s).length;

    const raw = [
      { label: 'รอซ่อม', count: countStatus('pending'), color: '#f59e0b' },
      { label: 'กำลังซ่อม', count: countStatus('in_progress'), color: '#3b82f6' },
      { label: 'รออะไหล่', count: countStatus('waiting_parts'), color: '#a855f7' },
      { label: 'ซ่อมแล้ว', count: countStatus('completed'), color: '#10b981' },
      { label: 'รอส่ง', count: countStatus('ready_to_ship'), color: '#06b6d4' },
      { label: 'ส่งแล้ว', count: countStatus('delivered'), color: '#0f766e' },
      { label: 'มารับเอง', count: countStatus('picked_up'), color: '#10b981' },
      { label: 'ยกเลิก', count: countStatus('cancelled'), color: '#ef4444' },
    ];

    return raw
      .filter(item => item.count > 0)
      .map(item => ({
        ...item,
        percentage: Math.round((item.count / total) * 100),
        formattedValue: `${item.count} งาน`,
      }));
  }, [jobs]);

  // 2. กราฟวงกลมของหน้างานซ่อมเสร็จ (Completed Repairs: จัดส่งพัสดุ vs มารับเอง)
  const finishedJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'delivered' || j.status === 'picked_up' || j.status === 'completed' || j.status === 'ready_to_ship');
  }, [jobs]);

  const completedPieData: PieChartData[] = useMemo(() => {
    const total = finishedJobs.length;
    if (total === 0) return [];

    const parcelCount = finishedJobs.filter(j => j.trackingNumber && j.trackingNumber.trim() !== '').length;
    const pickupCount = total - parcelCount;

    const list: PieChartData[] = [];
    if (parcelCount > 0) {
      list.push({
        label: 'จัดส่งพัสดุ',
        count: parcelCount,
        color: '#0284c7',
        percentage: Math.round((parcelCount / total) * 100),
        formattedValue: `${parcelCount} งาน`,
      });
    }
    if (pickupCount > 0) {
      list.push({
        label: 'มารับเองที่ร้าน',
        count: pickupCount,
        color: '#10b981',
        percentage: Math.round((pickupCount / total) * 100),
        formattedValue: `${pickupCount} งาน`,
      });
    }

    return list;
  }, [finishedJobs]);

  // 3. กราฟวงกลมของรายได้ (Revenue, Cost, Profit)
  const financialPieData: PieChartData[] = useMemo(() => {
    if (totalRevenue <= 0 && totalCost <= 0) return [];

    const basis = totalRevenue > 0 ? totalRevenue : totalCost;
    const costPercent = basis > 0 ? Math.round((totalCost / basis) * 100) : 0;
    const profitPercent = basis > 0 && totalProfit > 0 ? Math.round((totalProfit / basis) * 100) : 0;

    const list: PieChartData[] = [];
    if (totalCost > 0) {
      list.push({
        label: 'ต้นทุนรวม',
        count: totalCost,
        color: '#f43f5e',
        percentage: costPercent,
        formattedValue: formatCurrency(totalCost),
      });
    }
    if (totalProfit > 0) {
      list.push({
        label: 'กำไรสุทธิ',
        count: totalProfit,
        color: '#10b981',
        percentage: profitPercent,
        formattedValue: formatCurrency(totalProfit),
      });
    }

    return list;
  }, [totalRevenue, totalCost, totalProfit]);

  // 4. กราฟวงกลมจำนวนงานที่อยู่ในประกัน / หมดประกัน
  const warrantyPieData: PieChartData[] = useMemo(() => {
    const total = jobs.length;
    if (total === 0) return [];

    let inWarranty = 0;
    let outWarranty = 0;
    let notStarted = 0;

    jobs.forEach(job => {
      const res = getJobWarrantyStatus(job);
      if (res.status === 'active' || res.status === 'expiring_soon') {
        inWarranty++;
      } else if (res.status === 'expired' || res.status === 'none') {
        outWarranty++;
      } else if (res.status === 'not_started') {
        notStarted++;
      } else {
        outWarranty++;
      }
    });

    const list: PieChartData[] = [];
    if (inWarranty > 0) {
      list.push({
        label: 'อยู่ในประกัน',
        count: inWarranty,
        color: '#059669',
        percentage: Math.round((inWarranty / total) * 100),
        formattedValue: `${inWarranty} งาน`,
      });
    }
    if (outWarranty > 0) {
      list.push({
        label: 'หมดประกัน / ไม่มีประกัน',
        count: outWarranty,
        color: '#f97316',
        percentage: Math.round((outWarranty / total) * 100),
        formattedValue: `${outWarranty} งาน`,
      });
    }
    if (notStarted > 0) {
      list.push({
        label: 'ยังไม่เริ่มนับประกัน',
        count: notStarted,
        color: '#64748b',
        percentage: Math.round((notStarted / total) * 100),
        formattedValue: `${notStarted} งาน`,
      });
    }

    return list;
  }, [jobs]);

  // Delivery counts for chart 2
  const parcelCount = useMemo(() => {
    return finishedJobs.filter(j => j.trackingNumber && j.trackingNumber.trim() !== '').length;
  }, [finishedJobs]);
  const pickupCount = finishedJobs.length - parcelCount;

  // Warranty counts for chart 4
  const warrantyCounts = useMemo(() => {
    let inWarranty = 0;
    let outWarranty = 0;
    let notStarted = 0;

    jobs.forEach(job => {
      const res = getJobWarrantyStatus(job);
      if (res.status === 'active' || res.status === 'expiring_soon') {
        inWarranty++;
      } else if (res.status === 'not_started') {
        notStarted++;
      } else {
        outWarranty++;
      }
    });

    return { inWarranty, outWarranty, notStarted };
  }, [jobs]);

  return (
    <div className="space-y-2.5 pb-2">
      {/* 1. Header Card: RepairProShop Branding, Contact Info & New Jobs Count in one row */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-3 sm:py-2.5 sm:px-4 shadow-sm border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <Wrench className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight font-mono text-white">
                  RepairProShop
                </h1>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  แดชบอร์ดภาพรวมระบบ
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-300 mt-0.5">
                <span className="font-medium text-slate-200">{shopSettings.shopName}</span>
                <span>•</span>
                <a 
                  href={`tel:${shopSettings.phone}`}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <Phone className="w-3 h-3" />
                  <span>{shopSettings.phone}</span>
                </a>
                <span>•</span>
                <span className="text-slate-300">LINE: {shopSettings.lineId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Compact New Incoming Jobs Metric */}
            <div className="bg-amber-500/15 border border-amber-400/60 rounded-xl px-3 py-1 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <span className="text-[10px] text-amber-300 font-medium block leading-tight">งานเข้าใหม่ (รอซ่อม)</span>
                <span className="text-xs sm:text-sm font-black font-mono text-amber-400 leading-tight">
                  {newJobsCount} <span className="text-[10px] font-normal text-amber-200">งาน</span>
                </span>
              </div>
            </div>

            <button
              onClick={onOpenNewJob}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 hover:scale-102 cursor-pointer"
            >
              <span>+ เปิด Job ใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. สี่กราฟวงกลมหลัก - CSS Grid Layout (grid-cols-1 md:grid-cols-2 gap-4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: กราฟวงกลมของหน้าตารางงาน */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                1. กราฟวงกลมตารางงาน
              </h2>
              <span className="text-[10px] text-slate-400">สัดส่วนตามสถานะงานซ่อม</span>
            </div>
            <button
              onClick={() => onNavigateToJobs()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>ไปตาราง</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 flex items-center justify-center">
              <DonutPieChart 
                data={tableStatusPieData} 
                total={jobs.length} 
                size={115} 
                centerTitle="งานทั้งหมด"
                centerValue={`${jobs.length}`}
                unitLabel="งาน"
              />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1 min-w-0">
              {[
                { label: 'รอซ่อม', color: '#f59e0b', status: 'pending' as RepairStatus },
                { label: 'กำลังซ่อม', color: '#3b82f6', status: 'in_progress' as RepairStatus },
                { label: 'รออะไหล่', color: '#a855f7', status: 'waiting_parts' as RepairStatus },
                { label: 'ซ่อมแล้ว', color: '#10b981', status: 'completed' as RepairStatus },
                { label: 'รอส่ง', color: '#06b6d4', status: 'ready_to_ship' as RepairStatus },
                { label: 'ส่งแล้ว', color: '#0f766e', status: 'delivered' as RepairStatus },
                { label: 'มารับเอง', color: '#10b981', status: 'picked_up' as RepairStatus },
                { label: 'ยกเลิก', color: '#ef4444', status: 'cancelled' as RepairStatus },
              ].map(st => {
                const found = tableStatusPieData.find(p => p.label === st.label);
                const count = found ? found.count : 0;
                return (
                  <button
                    key={st.label}
                    onClick={() => onNavigateToJobs(st.status)}
                    className="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded hover:bg-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                      <span className="text-slate-600 truncate">{st.label}</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono ml-1">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 2: กราฟวงกลมของหน้างานซ่อมเสร็จ */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                2. กราฟวงกลมงานซ่อมเสร็จ
              </h2>
              <span className="text-[10px] text-slate-400">วิธีจัดส่งพัสดุ vs มารับเอง</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {finishedJobs.length} งาน
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 flex items-center justify-center">
              <DonutPieChart 
                data={completedPieData} 
                total={finishedJobs.length} 
                size={115} 
                centerTitle="งานซ่อมเสร็จ"
                centerValue={`${finishedJobs.length}`}
                unitLabel="งาน"
              />
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center justify-between text-[11px] bg-sky-50/90 px-2.5 py-1.5 rounded-xl border border-sky-100">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="text-sky-900 font-semibold truncate">จัดส่งพัสดุ</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-sky-700 font-mono">{parcelCount} งาน</span>
                  <span className="text-[10px] text-sky-500 ml-1">
                    ({finishedJobs.length > 0 ? Math.round((parcelCount / finishedJobs.length) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-900 font-semibold truncate">มารับเองที่ร้าน</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-emerald-700 font-mono">{pickupCount} งาน</span>
                  <span className="text-[10px] text-emerald-500 ml-1">
                    ({finishedJobs.length > 0 ? Math.round((pickupCount / finishedJobs.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: กราฟวงกลมของรายได้ */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                3. กราฟวงกลมของรายได้
              </h2>
              <span className="text-[10px] text-slate-400">สัดส่วนต้นทุนเทียบกับกำไร</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              กำไร {profitMargin}%
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 flex items-center justify-center">
              <DonutPieChart 
                data={financialPieData} 
                total={totalRevenue > 0 ? totalRevenue : totalCost} 
                size={115} 
                centerTitle="รายได้รวม"
                centerValue={formatCurrency(totalRevenue)}
                unitLabel="บาท"
              />
            </div>

            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-100">
                <span className="text-blue-900 font-semibold truncate">รายได้รวม:</span>
                <span className="font-bold text-blue-700 font-mono shrink-0">{formatCurrency(totalRevenue)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-rose-50/70 px-2.5 py-1 rounded-lg border border-rose-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-700 truncate">ต้นทุน:</span>
                </div>
                <span className="font-bold text-rose-600 font-mono shrink-0">{formatCurrency(totalCost)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-emerald-50/70 px-2.5 py-1 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 truncate">กำไรสุทธิ:</span>
                </div>
                <span className="font-bold text-emerald-600 font-mono shrink-0">{formatCurrency(totalProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: กราฟวงกลมจำนวนงานที่อยู่ประกันหมดประกัน */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden">
          <div className="border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                4. กราฟวงกลมสถานะประกัน
              </h2>
              <span className="text-[10px] text-slate-400">ในประกัน vs หมดประกัน</span>
            </div>
            <button
              onClick={onNavigateToWarranty}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
            >
              <span>ดูประกัน</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 flex items-center justify-center">
              <DonutPieChart 
                data={warrantyPieData} 
                total={jobs.length} 
                size={115} 
                centerTitle="ความคุ้มครอง"
                centerValue={`${warrantyCounts.inWarranty}`}
                unitLabel="ในประกัน"
              />
            </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="flex items-center justify-between text-[11px] bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-800 font-semibold truncate">อยู่ในประกัน</span>
                </div>
                <span className="font-bold text-emerald-700 font-mono shrink-0">
                  {warrantyCounts.inWarranty} งาน
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-orange-50/90 px-2.5 py-1.5 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldX className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span className="text-orange-800 font-semibold truncate">หมดประกัน</span>
                </div>
                <span className="font-bold text-orange-700 font-mono shrink-0">
                  {warrantyCounts.outWarranty} งาน
                </span>
              </div>

              {warrantyCounts.notStarted > 0 && (
                <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-slate-600 truncate">ยังไม่เริ่มนับ:</span>
                  </div>
                  <span className="font-bold text-slate-700 font-mono shrink-0">
                    {warrantyCounts.notStarted} งาน
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. รายการงานซ่อมและช่องค้นหาด่วน (Quick Search & Jobs List) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Search Bar Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/20">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    ค้นหางานซ่อมด่วน (Quick Job Search)
                  </h2>
                  <span className="bg-blue-50 text-blue-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">
                    {filteredJobs.length} / {jobs.length} งาน
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  ค้นหาด้วยชื่อลูกค้า หรือเบอร์โทรศัพท์ เพื่อเข้าถึงและอัปเดตงานซ่อมได้ทันที
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToJobs()}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>ดูตารางงานทั้งหมด</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Input and Status Pills */}
          <div className="flex flex-col lg:flex-row gap-2.5">
            {/* Input with Search & Clear icon */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทรศัพท์ (เช่น สมชาย หรือ 0812345678)..."
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick status filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'pending', label: 'รอซ่อม' },
                { id: 'in_progress', label: 'กำลังซ่อม' },
                { id: 'waiting_parts', label: 'รออะไหล่' },
                { id: 'completed', label: 'ซ่อมแล้ว' },
                { id: 'delivered', label: 'ส่งแล้ว' },
                { id: 'picked_up', label: 'มารับเอง' },
              ].map((pill) => {
                const isActive = statusFilter === pill.id;
                const count = pill.id === 'all' 
                  ? jobs.length 
                  : jobs.filter(j => j.status === pill.id).length;

                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Jobs List - Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 whitespace-nowrap w-[15%]">รหัส Job / วันที่</th>
                <th className="py-2.5 px-3 whitespace-nowrap w-[22%]">ลูกค้า / เบอร์โทร</th>
                <th className="py-2.5 px-3 w-[25%]">อุปกรณ์ / อาการ</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center w-[14%]">สถานะงาน</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right w-[12%]">ราคา</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center w-[12%]">จัดการด่วน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Inbox className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">
                        {jobs.length === 0 
                          ? 'ยังไม่มีรายการงานซ่อมในระบบ' 
                          : `ไม่พบงานซ่อมที่ตรงกับชื่อลูกค้าหรือเบอร์โทร "${searchQuery}"`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {jobs.length === 0 
                          ? 'เปิดรับงานซ่อมใหม่เพื่อเริ่มต้นบันทึกข้อมูล' 
                          : 'ลองตรวจสอบความถูกต้องของชื่อ หรือค้นหาด้วยเลขเบอร์โทรศัพท์'}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                        >
                          ล้างคำค้นหาทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const statusInfo = STATUS_MAP[job.status] || { label: job.status, badgeClass: 'bg-slate-100 text-slate-700' };
                  const totalPrice = (job.financials.price || 0) + (job.financials.onsiteServiceFee || 0);

                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* 1. Job ID & Date */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenJobDetail(job)}
                          className="text-left group/btn focus:outline-none cursor-pointer"
                          title="คลิกเพื่อดูรายละเอียดงานซ่อม"
                        >
                          <div className="font-mono font-bold text-blue-700 text-xs group-hover/btn:underline flex items-center gap-1">
                            <span>{job.id}</span>
                            <Eye className="w-3 h-3 text-blue-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateThai(job.createdAt)}
                          </div>
                        </button>
                      </td>

                      {/* 2. Customer Name & Phone */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.customer.name}</span>
                        </div>
                        {job.customer.phone ? (
                          <a 
                            href={`tel:${job.customer.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-mono font-medium mt-0.5 hover:underline"
                            title="คลิกเพื่อโทรออก"
                          >
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{job.customer.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">- ไม่ระบุเบอร์ -</span>
                        )}
                      </td>

                      {/* 3. Device & Issue */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-slate-800">
                          {job.device.brand} {job.device.model}
                        </div>
                        {job.issueDescription && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={job.issueDescription}>
                            อาการ: {job.issueDescription}
                          </div>
                        )}
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                        {job.trackingNumber && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            พัสดุ: {job.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* 5. Price */}
                      <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                        <div className="font-bold font-mono text-slate-900">
                          {formatCurrency(totalPrice)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          กำไร: {formatCurrency(job.financials.profit || 0)}
                        </div>
                      </td>

                      {/* 6. Quick Action Buttons */}
                      <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenJobDetail(job)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
                            title="ดูรายละเอียดงาน"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenStatusUpdate(job)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer"
                            title="อัปเดตสถานะงาน"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCostUpdate(job)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
                            title="อัปเดตราคา / ต้นทุน"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPrint(job)}
                            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                            title="พิมพ์ใบรับงาน / ใบเสร็จ"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Jobs List - Mobile Card View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredJobs.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-xs">
                {jobs.length === 0 
                  ? 'ยังไม่มีรายการงานซ่อมในระบบ' 
                  : `ไม่พบงานซ่อมที่ตรงกับ "${searchQuery}"`}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="mt-2 text-xs text-blue-600 font-semibold underline"
                >
                  ล้างคำค้นหา
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => {
              const statusInfo = STATUS_MAP[job.status] || { label: job.status, badgeClass: 'bg-slate-100 text-slate-700' };
              const totalPrice = (job.financials.price || 0) + (job.financials.onsiteServiceFee || 0);

              return (
                <div key={job.id} className="p-3 space-y-2 hover:bg-slate-50 transition-colors">
                  {/* Top: Job ID & Status & Date */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenJobDetail(job)}
                      className="font-mono font-bold text-blue-700 text-xs underline cursor-pointer"
                    >
                      {job.id}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateThai(job.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Phone */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-slate-900 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{job.customer.name}</span>
                    </div>
                    {job.customer.phone && (
                      <a 
                        href={`tel:${job.customer.phone}`}
                        className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold shrink-0"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{job.customer.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Device & Issue */}
                  <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="font-semibold text-slate-800">
                      {job.device.brand} {job.device.model}
                    </div>
                    {job.issueDescription && (
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        อาการ: {job.issueDescription}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Price & Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      {formatCurrency(totalPrice)}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenJobDetail(job)}
                        className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 rounded border border-blue-200 cursor-pointer"
                      >
                        ดูงาน
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenStatusUpdate(job)}
                        className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded border border-amber-200 cursor-pointer"
                      >
                        สถานะ
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCostUpdate(job)}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 cursor-pointer"
                      >
                        ราคา
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPrint(job)}
                        className="p-1 text-slate-600 bg-slate-100 rounded border border-slate-200 cursor-pointer"
                        title="พิมพ์ใบรับงาน"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
