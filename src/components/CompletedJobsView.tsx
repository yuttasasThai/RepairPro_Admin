import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Truck, 
  Package, 
  Eye, 
  ArrowUpDown,
  Image as ImageIcon
} from 'lucide-react';
import { RepairJob } from '../types/repair';
import { formatDateThai } from '../utils/formatters';
import { exportJobsToExcel } from '../utils/excelExport';
import { DonutPieChart, PieChartData } from './PieChart';

interface CompletedJobsViewProps {
  jobs: RepairJob[];
  onOpenJobDetail: (job: RepairJob) => void;
  onOpenCostUpdate?: (job: RepairJob) => void;
  onOpenPrint?: (job: RepairJob) => void;
}

export const CompletedJobsView: React.FC<CompletedJobsViewProps> = ({
  jobs,
  onOpenJobDetail,
}) => {
  const [sortField, setSortField] = useState<'id' | 'deliveredAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter jobs that are finished / delivered
  const finishedJobs = useMemo(() => {
    return jobs.filter(job => 
      job.status === 'delivered' || job.status === 'picked_up' || job.status === 'completed' || job.status === 'ready_to_ship'
    );
  }, [jobs]);

  // Sorting
  const sortedJobs = useMemo(() => {
    return [...finishedJobs].sort((a, b) => {
      let valA: any = a[sortField] || a.createdAt;
      let valB: any = b[sortField] || b.createdAt;

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [finishedJobs, sortField, sortOrder]);

  // 3) ส่วนบนเเสดงกราฟวงกลมงานที่ซ่อมเสร็จ (Pie chart of completed jobs: จัดส่งพัสดุ vs มารับเอง)
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

  const handleToggleSort = (field: 'id' | 'deliveredAt') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportExcel = () => {
    if (sortedJobs.length === 0) {
      return;
    }
    exportJobsToExcel(sortedJobs, 'งานซ่อมเสร็จแล้ว_RepairProShop');
  };

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* 3) ส่วนบนเเสดงกราฟวงกลมงานที่ซ่อมเสร็จ */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DonutPieChart 
              data={completedPieData} 
              total={finishedJobs.length} 
              size={150} 
              centerTitle="ซ่อมเสร็จแล้ว"
              centerValue={`${finishedJobs.length}`}
              unitLabel="งาน"
            />

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                สถิติงานซ่อมเสร็จและการจัดส่ง
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รวมทั้งหมด {finishedJobs.length} งาน
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-xs">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <span className="text-sky-900 font-semibold">จัดส่งพัสดุ:</span>
                  <strong className="text-sky-700 font-mono">
                    {completedPieData.find(c => c.label === 'จัดส่งพัสดุ')?.count || 0} งาน
                  </strong>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-900 font-semibold">มารับเอง:</span>
                  <strong className="text-emerald-700 font-mono">
                    {completedPieData.find(c => c.label === 'มารับเองที่ร้าน')?.count || 0} งาน
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200/80 p-3 rounded-xl max-w-xs self-stretch md:self-auto flex flex-col justify-center">
            <span className="font-bold text-slate-700 block mb-1">
              คำแนะนำ
            </span>
            <span>
              งานที่ระบุเลขพัสดุจะเริ่มนับวันประกันตั้งแต่วันส่งพัสดุ ส่วนกรณีมารับเองจะเริ่มนับจากวันที่รับเครื่อง
            </span>
          </div>
        </div>
      </div>

      {/* Main Table: 4 คอลัมน์ (เลขjob, ประเภทงาน, รายการ, เลขพัสดุ/มารับเอง) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden w-full">
        {/* Table Header Action Bar (ไม่มีช่องค้นหาตามสั่ง) */}
        <div className="p-3.5 sm:px-5 border-b border-slate-200 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              รายการงานซ่อมเสร็จแล้ว ({sortedJobs.length} งาน)
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={sortedJobs.length === 0}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
              sortedJobs.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 select-none">
              <tr>
                {/* 1. เลขjob */}
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[22%] sm:w-[20%]"
                  onClick={() => handleToggleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>1. เลข Job</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. ประเภทงาน */}
                <th className="py-3.5 px-3 whitespace-nowrap w-[18%] sm:w-[16%] text-center">
                  <span>2. ประเภทงาน</span>
                </th>

                {/* 3. รายการ */}
                <th className="py-3.5 px-4 w-[38%] sm:w-[42%]">
                  <span>3. รายการ</span>
                </th>

                {/* 4. เลขพัสดุ/มารับเอง */}
                <th className="py-3.5 px-4 text-center whitespace-nowrap w-[22%]">
                  <span>4. เลขพัสดุ / มารับเอง</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-slate-700">
                        ยังไม่มีรายการงานที่ซ่อมเสร็จแล้ว
                      </p>
                      <p className="text-xs text-slate-400">
                        เมื่องานซ่อมผ่านสถานะ "ซ่อมแล้ว" หรือ "ส่งแล้ว" จะแสดงในหน้านี้โดยอัตโนมัติ
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => {
                  const hasTracking = job.trackingNumber && job.trackingNumber.trim() !== '';

                  return (
                    <tr 
                      key={job.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => onOpenJobDetail(job)}
                    >
                      {/* 1. เลขjob */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-blue-700 text-xs sm:text-sm group-hover:underline flex items-center gap-1">
                          <span>{job.id}</span>
                          <Eye className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {job.deliveredAt ? formatDateThai(job.deliveredAt) : formatDateThai(job.createdAt)}
                        </div>
                      </td>

                      {/* 2. ประเภทงาน (เหมือนหน้ารายได้) */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-top text-center">
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

                      {/* 3. รายการ */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {job.device.brand} {job.device.model}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 font-medium">
                          ลูกค้า: {job.customer.name} {job.customer.phone ? `(${job.customer.phone})` : ''}
                        </div>
                        {job.issueDescription && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            อาการ: {job.issueDescription}
                          </div>
                        )}
                      </td>

                      {/* 4. เลขพัสดุ / มารับเอง (หากยังอยู่สถานะก่อนหน้า ให้ใส่เครื่องหมายขีดกลาง (-) จนกว่าจะถึงสถานะรอส่ง) */}
                      <td className="py-3.5 px-4 text-center align-top whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {job.status === 'completed' || (job.status !== 'ready_to_ship' && job.status !== 'delivered' && job.status !== 'picked_up') ? (
                            <span className="text-slate-400 font-bold text-base select-none">-</span>
                          ) : job.status === 'picked_up' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              <span>มารับเองที่ร้าน</span>
                            </span>
                          ) : job.status === 'delivered' ? (
                            job.trackingNumber && job.trackingNumber.trim() !== '' ? (
                              <span className="inline-flex items-center gap-1 text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                                <Truck className="w-3.5 h-3.5 text-sky-600" />
                                <span>{job.trackingNumber}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                <Truck className="w-3.5 h-3.5 text-teal-600" />
                                <span>จัดส่งแล้ว</span>
                              </span>
                            )
                          ) : job.status === 'ready_to_ship' ? (
                            job.trackingNumber && job.trackingNumber.trim() !== '' ? (
                              <span className="inline-flex items-center gap-1 text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                                <Truck className="w-3.5 h-3.5 text-cyan-600" />
                                <span>รอส่ง: {job.trackingNumber}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                <Package className="w-3.5 h-3.5 text-cyan-600" />
                                <span>รอส่ง</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-bold text-base select-none">-</span>
                          )}

                          {job.deliveryAttachment && (
                            <button
                              onClick={() => onOpenJobDetail(job)}
                              className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                              title="ดูรูปภาพหลักฐานส่งมอบ"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>มีรูปหลักฐาน</span>
                            </button>
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
    </div>
  );
};
