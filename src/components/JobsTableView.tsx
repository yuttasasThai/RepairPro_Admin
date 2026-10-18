import React, { useMemo, useState } from 'react';
import { 
  FileSpreadsheet, 
  Eye, 
  ArrowUpDown
} from 'lucide-react';
import { RepairJob, RepairStatus } from '../types/repair';
import { 
  STATUS_MAP, 
  formatDateThai 
} from '../utils/formatters';
import { exportJobsToExcel } from '../utils/excelExport';
import { DonutPieChart, PieChartData } from './PieChart';

interface JobsTableViewProps {
  jobs: RepairJob[];
  onOpenNewJob?: () => void;
  onOpenJobDetail: (job: RepairJob) => void;
  onOpenStatusUpdate?: (job: RepairJob) => void;
  onOpenCostUpdate?: (job: RepairJob) => void;
  onOpenPrint?: (job: RepairJob) => void;
}

export const JobsTableView: React.FC<JobsTableViewProps> = ({
  jobs,
  onOpenJobDetail,
}) => {
  // Sort state
  const [sortField, setSortField] = useState<'id' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sorted Jobs
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [jobs, sortField, sortOrder]);

  // ส่วนบนเเสดงกราฟวงกลมตารางงาน (Pie chart of repair table jobs by status)
  const tablePieData: PieChartData[] = useMemo(() => {
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

  const inWarrantyCount = useMemo(() => {
    return jobs.filter(j => j.jobType === 'งานในประกัน').length;
  }, [jobs]);

  const newJobTypeCount = useMemo(() => {
    return jobs.filter(j => j.jobType !== 'งานในประกัน').length;
  }, [jobs]);

  const handleToggleSort = (field: 'id' | 'createdAt') => {
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
    exportJobsToExcel(sortedJobs, 'ตารางงานซ่อม_RepairProShop');
  };

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* 2) ส่วนบนเเสดงกราฟวงกลมตารางงาน */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <DonutPieChart 
            data={tablePieData} 
            total={jobs.length} 
            size={150} 
            centerTitle="งานทั้งหมด"
            centerValue={`${jobs.length}`}
            unitLabel="งาน"
          />

          <div className="flex-1 w-full">
            <h2 className="text-sm font-bold text-slate-900">
              สัดส่วนสถานะงานซ่อมในระบบ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รวมทั้งหมด {jobs.length} งาน • ในประกัน {inWarrantyCount} งาน • งานใหม่ {newJobTypeCount} งาน
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {[
                { label: 'รอซ่อม', color: '#f59e0b', status: 'pending' },
                { label: 'กำลังซ่อม', color: '#3b82f6', status: 'in_progress' },
                { label: 'รออะไหล่', color: '#a855f7', status: 'waiting_parts' },
                { label: 'ซ่อมแล้ว', color: '#10b981', status: 'completed' },
                { label: 'รอส่ง', color: '#06b6d4', status: 'ready_to_ship' },
                { label: 'ส่งแล้ว', color: '#0f766e', status: 'delivered' },
                { label: 'มารับเอง', color: '#10b981', status: 'picked_up' },
                { label: 'ยกเลิก', color: '#ef4444', status: 'cancelled' },
              ].map(st => {
                const count = jobs.filter(j => j.status === st.status).length;
                return (
                  <div key={st.label} className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }}></span>
                    <span className="text-slate-600">{st.label}:</span>
                    <strong className="text-slate-900 font-mono">{count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table: เรียงลำดับ 3 คอลัมน์ตรงตามสั่ง: 1. เลขjob, 2. ประเภทงาน, 3. รายการ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full">
        {/* Table Header Action Bar (ลบช่องค้นหาและปุ่มเปิดงานใหม่ออกตามสั่ง) */}
        <div className="p-3.5 sm:px-5 border-b border-slate-200 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              ตารางงานซ่อม ({sortedJobs.length} งาน)
            </span>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={sortedJobs.length === 0}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
              sortedJobs.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title="ส่งออก Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 select-none">
              <tr>
                {/* 1. เลขjob */}
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[24%] sm:w-[20%]"
                  onClick={() => handleToggleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>1. เลข Job</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. ประเภทงาน (เหมือนในหน้ารายได้) */}
                <th className="py-3.5 px-3 whitespace-nowrap text-center w-[20%] sm:w-[18%]">
                  <span>2. ประเภทงาน</span>
                </th>

                {/* 3. รายการ */}
                <th className="py-3.5 px-4 w-[56%] sm:w-[62%]">
                  <span>3. รายการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-slate-700">
                        ยังไม่มีรายการงานซ่อมในระบบ
                      </p>
                      <p className="text-xs text-slate-400">
                        ระบบว่างเปล่า (0 งาน) พร้อมสำหรับการเปิดรับงานซ่อมใหม่
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => {
                  return (
                    <tr 
                      key={job.id} 
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* 1. เลขjob (กดเข้าไปดูรายละเอียด อัพเดตสถานะ หรือแก้ไขได้) */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <button
                          onClick={() => onOpenJobDetail(job)}
                          className="text-left group/btn focus:outline-none"
                          title="คลิกเพื่อดูรายละเอียด อัพเดตสถานะ หรือแก้ไขข้อมูลงาน"
                        >
                          <div className="font-mono font-bold text-blue-700 text-xs sm:text-sm group-hover/btn:underline flex items-center gap-1.5">
                            <span>{job.id}</span>
                            <Eye className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateThai(job.createdAt)}
                          </div>
                        </button>
                      </td>

                      {/* 2. ประเภทงาน: ใช้ป้ายเหมือนกับตารางใน หน้ารายได้ */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-top text-center">
                        {job.jobType === 'งานในประกัน' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>ในประกัน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>งานใหม่</span>
                          </span>
                        )}
                      </td>

                      {/* 3. รายการ: แสดงอุปกรณ์ รุ่น อาการ ลูกค้า และสถานะงานชัดเจน ไม่ตัดข้อความ */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {job.device.brand} {job.device.model}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${STATUS_MAP[job.status]?.badgeClass}`}>
                              {STATUS_MAP[job.status]?.label}
                            </span>
                            {job.trackingNumber && (
                              <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                พัสดุ: {job.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          ลูกค้า: {job.customer.name} {job.customer.phone ? `(${job.customer.phone})` : ''}
                        </div>

                        {job.issueDescription && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            อาการ: {job.issueDescription}
                          </div>
                        )}
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
