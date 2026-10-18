import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldX, 
  Eye, 
  FileSpreadsheet, 
  ArrowUpDown,
  Package
} from 'lucide-react';
import { RepairJob } from '../types/repair';
import { formatDateThai } from '../utils/formatters';
import { exportJobsToExcel } from '../utils/excelExport';
import { DonutPieChart, PieChartData } from './PieChart';

interface WarrantyAlertsViewProps {
  jobs: RepairJob[];
  onOpenJobDetail: (job: RepairJob) => void;
}

export const WarrantyAlertsView: React.FC<WarrantyAlertsViewProps> = ({
  jobs,
  onOpenJobDetail,
}) => {
  const [inWarrantySortField, setInWarrantySortField] = useState<'id' | 'remainingDays'>('remainingDays');
  const [inWarrantySortOrder, setInWarrantySortOrder] = useState<'asc' | 'desc'>('asc');

  const [expiredSortField, setExpiredSortField] = useState<'id' | 'remainingDays'>('id');
  const [expiredSortOrder, setExpiredSortOrder] = useState<'asc' | 'desc'>('desc');

  // งานที่จะบันทึกลงในตารางประกันคืองานที่ซ่อมเสร็จแล้ว (งานที่ยกเลิกไม่เอามาลงที่หน้าประกัน)
  const warrantyJobs = useMemo(() => {
    return jobs.filter(job => {
      if (job.status === 'cancelled') return false;
      return job.status === 'delivered' || job.status === 'picked_up' || job.status === 'completed' || job.status === 'ready_to_ship';
    });
  }, [jobs]);

  // ประมวลผลสถานะประกันและประกันคงเหลือ:
  // - เริ่มนับประกันหลังจากส่งพัสดุ หรือ ลูกค้ามารับเครื่อง
  // - 4.1 ช่องสถานะประกัน: จะเเสดงสถานะ "หมดประกัน" หรือ "ในประกัน"
  // - 4.2 คอลัมน์ ประกันคงเหลือ:
  //      หากหมดประกัน ระยะประกัน = 0
  //      หากในประกัน ระยะประกัน = วันประกันทั้งหมด - วันส่งพัสดุ (หรือวันรับเครื่อง)
  const processedJobs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return warrantyJobs.map(job => {
      const warrantyDays = job.warranty?.warrantyDays || 0;
      const isShippedOrPickedUp = job.status === 'delivered' || job.status === 'picked_up' || !!job.deliveredAt;

      let remainingDays = warrantyDays;
      let status: 'ในประกัน' | 'หมดประกัน' = 'ในประกัน';
      let remainingDisplay = `${warrantyDays} วัน`;

      if (warrantyDays <= 0) {
        status = 'หมดประกัน';
        remainingDays = 0;
        remainingDisplay = '0 วัน';
      } else if (isShippedOrPickedUp) {
        const deliveryDateStr = job.deliveredAt 
          ? job.deliveredAt.split('T')[0] 
          : (job.warranty?.startDate || new Date().toISOString().split('T')[0]);

        const deliveryDate = new Date(deliveryDateStr);
        deliveryDate.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - deliveryDate.getTime();
        const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

        // หากในประกัน ระยะประกัน = วันประกันทั้งหมด - วันส่งพัสดุ/วันรับเครื่อง
        remainingDays = warrantyDays - daysPassed;

        if (remainingDays <= 0) {
          status = 'หมดประกัน';
          remainingDays = 0;
          remainingDisplay = '0 วัน';
        } else {
          status = 'ในประกัน';
          remainingDisplay = `${remainingDays} วัน`;
        }
      } else {
        // งานซ่อมเสร็จแล้ว แต่ยังไม่ส่งพัสดุ/ยังไม่มารับ (จะเริ่มนับประกันหลังจากส่งหรือรับมอบ)
        status = 'ในประกัน';
        remainingDays = warrantyDays;
        remainingDisplay = `${warrantyDays} วัน`;
      }

      return {
        job,
        status,
        remainingDays,
        remainingDisplay,
        isShippedOrPickedUp,
      };
    });
  }, [warrantyJobs]);

  // แยก 2 กลุ่มตามข้อ 2.2: ตารางงานในประกัน กับ ตารางงานนอกประกัน (หมดประกัน)
  const inWarrantyJobs = useMemo(() => {
    const list = processedJobs.filter(p => p.status === 'ในประกัน');
    return list.sort((a, b) => {
      const valA = inWarrantySortField === 'remainingDays' ? a.remainingDays : a.job.id;
      const valB = inWarrantySortField === 'remainingDays' ? b.remainingDays : b.job.id;
      if (inWarrantySortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [processedJobs, inWarrantySortField, inWarrantySortOrder]);

  const expiredJobs = useMemo(() => {
    const list = processedJobs.filter(p => p.status === 'หมดประกัน');
    return list.sort((a, b) => {
      const valA = expiredSortField === 'remainingDays' ? a.remainingDays : a.job.id;
      const valB = expiredSortField === 'remainingDays' ? b.remainingDays : b.job.id;
      if (expiredSortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [processedJobs, expiredSortField, expiredSortOrder]);

  // Counts for Pie Chart
  const inWarrantyCount = inWarrantyJobs.length;
  const expiredCount = expiredJobs.length;

  const warrantyPieData: PieChartData[] = useMemo(() => {
    const total = processedJobs.length;
    if (total === 0) return [];

    const list: PieChartData[] = [];
    if (inWarrantyCount > 0) {
      list.push({
        label: 'ในประกัน',
        count: inWarrantyCount,
        color: '#059669',
        percentage: Math.round((inWarrantyCount / total) * 100),
        formattedValue: `${inWarrantyCount} งาน`,
      });
    }
    if (expiredCount > 0) {
      list.push({
        label: 'หมดประกัน',
        count: expiredCount,
        color: '#ef4444',
        percentage: Math.round((expiredCount / total) * 100),
        formattedValue: `${expiredCount} งาน`,
      });
    }

    return list;
  }, [processedJobs.length, inWarrantyCount, expiredCount]);

  const handleToggleInWarrantySort = (field: 'id' | 'remainingDays') => {
    if (inWarrantySortField === field) {
      setInWarrantySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setInWarrantySortField(field);
      setInWarrantySortOrder('asc');
    }
  };

  const handleToggleExpiredSort = (field: 'id' | 'remainingDays') => {
    if (expiredSortField === field) {
      setExpiredSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setExpiredSortField(field);
      setExpiredSortOrder('desc');
    }
  };

  const handleExportAll = () => {
    if (processedJobs.length === 0) return;
    exportJobsToExcel(processedJobs.map(s => s.job), 'รายงานสถานะประกัน_RepairProShop');
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* ส่วนบนเเสดงกราฟวงกลมงานทั้งหมด จำนวนงานที่อยู่ในประกัน จำนวนงานที่หมดประกัน */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <DonutPieChart 
            data={warrantyPieData} 
            total={processedJobs.length} 
            size={150} 
            centerTitle="งานซ่อมเสร็จ"
            centerValue={`${processedJobs.length}`}
            unitLabel="งาน"
          />

          <div className="flex-1 w-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  สัดส่วนงานตามการรับประกัน (เฉพาะงานซ่อมเสร็จแล้ว)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  รวมงานซ่อมเสร็จทั้งหมด {processedJobs.length} งาน • เริ่มนับประกันหลังจากส่งพัสดุ หรือ ลูกค้ามารับเครื่อง
                </p>
              </div>

              <button
                onClick={handleExportAll}
                disabled={processedJobs.length === 0}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                  processedJobs.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                }`}
                title="ส่งออกไฟล์ Excel ทั้งหมด"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก Excel</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
              <div className="bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-2 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] text-emerald-800 font-semibold">ในประกัน</span>
                </div>
                <strong className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                  {inWarrantyCount} งาน
                </strong>
              </div>

              <div className="bg-rose-50/80 border border-rose-200/80 px-3.5 py-2 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <ShieldX className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] text-rose-800 font-semibold">หมดประกัน</span>
                </div>
                <strong className="text-base font-bold text-rose-700 font-mono mt-0.5 block">
                  {expiredCount} งาน
                </strong>
              </div>

              <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl col-span-2 sm:col-span-1 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500">เงื่อนไขคำนวณ</span>
                <span className="text-[11px] text-slate-700 font-medium">
                  ประกันคงเหลือ = วันประกัน - วันส่ง/วันรับ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.2 แยก 2 ตาราง: ตารางงานในประกัน กับ ตารางงานนอกประกัน เพื่อให้ง่ายในการดู */}

      {/* ตารางที่ 1: ตารางงานในประกัน */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs overflow-hidden w-full">
        {/* Table Header Bar */}
        <div className="p-3.5 sm:px-5 bg-emerald-50/60 border-b border-emerald-200/80 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-950 text-sm">
                ตารางงานในประกัน ({inWarrantyJobs.length} งาน)
              </span>
              <span className="hidden sm:inline text-[11px] text-emerald-700 ml-2">
                • กำลังคุ้มครองตามระยะเวลารับประกัน
              </span>
            </div>
          </div>

          <span className="text-emerald-800 font-semibold text-xs px-2.5 py-0.5 bg-emerald-100 rounded-full border border-emerald-200">
            ในประกัน {inWarrantyJobs.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 select-none">
              <tr>
                {/* 1. เลขjob */}
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[18%] min-w-[130px]"
                  onClick={() => handleToggleInWarrantySort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>1. เลข Job</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. ประเภทงาน */}
                <th className="py-3 px-3 whitespace-nowrap text-center w-[14%] min-w-[110px]">
                  <span>2. ประเภทงาน</span>
                </th>

                {/* 3. รายการ (2.1 ปรับช่องคอลัมน์รายการให้กว้างประมาณเบอร์โทร เพื่อให้เห็นมุมมองที่พอดี) */}
                <th className="py-3 px-4 w-[38%] min-w-[180px] sm:min-w-[210px] max-w-[240px]">
                  <span>3. รายการ</span>
                </th>

                {/* 4. สถานะประกัน */}
                <th className="py-3 px-3 text-center whitespace-nowrap w-[15%] min-w-[110px]">
                  <span>4. สถานะประกัน</span>
                </th>

                {/* 5. ประกันคงเหลือ */}
                <th 
                  className="py-3 px-4 text-center whitespace-nowrap w-[15%] min-w-[120px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleToggleInWarrantySort('remainingDays')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>5. ประกันคงเหลือ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inWarrantyJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <ShieldCheck className="w-8 h-8 text-emerald-300" />
                      <p className="font-semibold text-slate-600">
                        ไม่มีรายการงานที่อยู่ในประกันในขณะนี้
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                inWarrantyJobs.map(({ job, remainingDisplay, isShippedOrPickedUp }) => {
                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      onClick={() => onOpenJobDetail(job)}
                    >
                      {/* 1. เลขjob */}
                      <td className="py-3 px-4 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-blue-700 text-xs sm:text-sm group-hover:underline flex items-center gap-1">
                          <span>{job.id}</span>
                          <Eye className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {job.status === 'picked_up' && job.deliveredAt ? (
                            `รับเครื่อง: ${formatDateThai(job.deliveredAt)}`
                          ) : job.deliveredAt ? (
                            `ส่งพัสดุ: ${formatDateThai(job.deliveredAt)}`
                          ) : (
                            formatDateThai(job.createdAt)
                          )}
                        </div>
                      </td>

                      {/* 2. ประเภทงาน */}
                      <td className="py-3 px-3 whitespace-nowrap align-top text-center">
                        {job.jobType === 'งานในประกัน' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>ในประกัน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>งานใหม่</span>
                          </span>
                        )}
                      </td>

                      {/* 3. รายการ (ความกว้างกะทัดรัดประมาณเบอร์โทร พอดีสายตา) */}
                      <td className="py-3 px-4 align-top max-w-[240px]">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {job.device.brand} {job.device.model}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium truncate">
                          {job.customer.name} {job.customer.phone ? `(${job.customer.phone})` : ''}
                        </div>
                        {job.issueDescription && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {job.issueDescription}
                          </div>
                        )}
                      </td>

                      {/* 4. สถานะประกัน */}
                      <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>ในประกัน</span>
                        </span>
                      </td>

                      {/* 5. ประกันคงเหลือ */}
                      <td className="py-3 px-4 text-center align-top whitespace-nowrap font-mono font-bold">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-emerald-700 text-xs bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {remainingDisplay}
                          </span>
                          {!isShippedOrPickedUp && (
                            <span className="text-[9px] text-slate-400 font-sans mt-0.5">
                              (เริ่มนับเมื่อส่ง/รับ)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ตารางที่ 2: ตารางงานนอกประกัน / หมดประกัน */}
      <div className="bg-white rounded-2xl border border-rose-200/90 shadow-2xs overflow-hidden w-full">
        {/* Table Header Bar */}
        <div className="p-3.5 sm:px-5 bg-rose-50/60 border-b border-rose-200/80 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <ShieldX className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-rose-950 text-sm">
                ตารางงานนอกประกัน / หมดประกัน ({expiredJobs.length} งาน)
              </span>
              <span className="hidden sm:inline text-[11px] text-rose-700 ml-2">
                • ครบกำหนดสิ้นสุดระยะเวลารับประกันแล้ว
              </span>
            </div>
          </div>

          <span className="text-rose-800 font-semibold text-xs px-2.5 py-0.5 bg-rose-100 rounded-full border border-rose-200">
            หมดประกัน {expiredJobs.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 select-none">
              <tr>
                {/* 1. เลขjob */}
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[18%] min-w-[130px]"
                  onClick={() => handleToggleExpiredSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>1. เลข Job</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. ประเภทงาน */}
                <th className="py-3 px-3 whitespace-nowrap text-center w-[14%] min-w-[110px]">
                  <span>2. ประเภทงาน</span>
                </th>

                {/* 3. รายการ (2.1 ปรับช่องคอลัมน์รายการให้กว้างประมาณเบอร์โทร เพื่อให้เห็นมุมมองที่พอดี) */}
                <th className="py-3 px-4 w-[38%] min-w-[180px] sm:min-w-[210px] max-w-[240px]">
                  <span>3. รายการ</span>
                </th>

                {/* 4. สถานะประกัน */}
                <th className="py-3 px-3 text-center whitespace-nowrap w-[15%] min-w-[110px]">
                  <span>4. สถานะประกัน</span>
                </th>

                {/* 5. ประกันคงเหลือ */}
                <th 
                  className="py-3 px-4 text-center whitespace-nowrap w-[15%] min-w-[120px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleToggleExpiredSort('id')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>5. ประกันคงเหลือ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expiredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs sm:text-sm">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <Package className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        ยังไม่มีรายการงานที่หมดประกันในระบบ
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                expiredJobs.map(({ job }) => {
                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                      onClick={() => onOpenJobDetail(job)}
                    >
                      {/* 1. เลขjob */}
                      <td className="py-3 px-4 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-blue-700 text-xs sm:text-sm group-hover:underline flex items-center gap-1">
                          <span>{job.id}</span>
                          <Eye className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {job.status === 'picked_up' && job.deliveredAt ? (
                            `รับเครื่อง: ${formatDateThai(job.deliveredAt)}`
                          ) : job.deliveredAt ? (
                            `ส่งพัสดุ: ${formatDateThai(job.deliveredAt)}`
                          ) : (
                            formatDateThai(job.createdAt)
                          )}
                        </div>
                      </td>

                      {/* 2. ประเภทงาน */}
                      <td className="py-3 px-3 whitespace-nowrap align-top text-center">
                        {job.jobType === 'งานในประกัน' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>ในประกัน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>งานใหม่</span>
                          </span>
                        )}
                      </td>

                      {/* 3. รายการ (ความกว้างกะทัดรัดประมาณเบอร์โทร พอดีสายตา) */}
                      <td className="py-3 px-4 align-top max-w-[240px]">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                          {job.device.brand} {job.device.model}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium truncate">
                          {job.customer.name} {job.customer.phone ? `(${job.customer.phone})` : ''}
                        </div>
                        {job.issueDescription && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {job.issueDescription}
                          </div>
                        )}
                      </td>

                      {/* 4. สถานะประกัน */}
                      <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>หมดประกัน</span>
                        </span>
                      </td>

                      {/* 5. ประกันคงเหลือ: หมดประกัน = 0 วัน */}
                      <td className="py-3 px-4 text-center align-top whitespace-nowrap font-mono font-bold">
                        <span className="text-rose-600 text-xs bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                          0 วัน
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
