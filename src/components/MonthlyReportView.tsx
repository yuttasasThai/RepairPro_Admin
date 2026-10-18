import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  FileSpreadsheet, 
  Eye, 
  ArrowUpDown,
  Truck
} from 'lucide-react';
import { RepairJob } from '../types/repair';
import { formatCurrency } from '../utils/formatters';
import { exportJobsToExcel } from '../utils/excelExport';
import { DonutPieChart, PieChartData } from './PieChart';

interface MonthlyReportViewProps {
  jobs: RepairJob[];
  onOpenJobDetail: (job: RepairJob) => void;
  onOpenCostUpdate?: (job: RepairJob) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  jobs,
  onOpenJobDetail,
}) => {
  const [sortField, setSortField] = useState<'id' | 'price' | 'profit' | 'shippingCost'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sort
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'price') {
        valA = a.financials?.price || 0;
        valB = b.financials?.price || 0;
      } else if (sortField === 'profit') {
        valA = a.financials?.profit || 0;
        valB = b.financials?.profit || 0;
      } else if (sortField === 'shippingCost') {
        valA = a.financials?.shippingCost || 0;
        valB = b.financials?.shippingCost || 0;
      } else {
        valA = a.id;
        valB = b.id;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [jobs, sortField, sortOrder]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.price || 0) + (j.financials?.onsiteServiceFee || 0), 0);
  }, [jobs]);

  const totalOnsiteFee = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.onsiteServiceFee || 0), 0);
  }, [jobs]);

  const totalPartsCost = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.partsCost || 0), 0);
  }, [jobs]);

  const totalShippingCost = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.shippingCost || 0), 0);
  }, [jobs]);

  const totalOtherCosts = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.otherCost || 0), 0);
  }, [jobs]);

  const totalCost = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.totalCost || 0), 0);
  }, [jobs]);

  const totalProfit = useMemo(() => {
    return jobs.reduce((sum, j) => sum + (j.financials?.profit || 0), 0);
  }, [jobs]);

  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // 4) ส่วนบนเเสดงกราฟวงกลม รายได้, ต้นทุน, กำไร
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

  const handleToggleSort = (field: 'id' | 'price' | 'profit' | 'shippingCost') => {
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
    exportJobsToExcel(sortedJobs, 'รายงานรายได้และต้นทุน_RepairProShop');
  };

  return (
    <div className="space-y-4 pb-12 w-full">
      {/* 4) ส่วนบนเเสดงกราฟวงกลม รายได้, ต้นทุน, กำไร */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <DonutPieChart 
              data={financialPieData} 
              total={totalRevenue > 0 ? totalRevenue : totalCost} 
              size={150} 
              centerTitle="รายได้รวม"
              centerValue={formatCurrency(totalRevenue)}
              unitLabel="บาท"
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  สัดส่วนทางการเงิน
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  กำไร {profitMargin}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                จากงานในระบบทั้งหมด {jobs.length} รายการ
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                <div className="bg-blue-50/80 border border-blue-200/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[10px] text-blue-700 font-semibold block">รายได้รวม</span>
                  <strong className="text-xs sm:text-sm font-bold text-blue-900 font-mono">
                    {formatCurrency(totalRevenue)}
                  </strong>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-semibold block">กำไรสุทธิ</span>
                  <strong className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                    {formatCurrency(totalProfit)}
                  </strong>
                </div>

                <div className="bg-rose-50/80 border border-rose-200/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[10px] text-rose-700 font-semibold block">ต้นทุนอะไหล่</span>
                  <strong className="text-xs sm:text-sm font-bold text-rose-700 font-mono">
                    {formatCurrency(totalPartsCost)}
                  </strong>
                </div>

                <div className="bg-teal-50/80 border border-teal-200/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[10px] text-teal-700 font-semibold block flex items-center gap-1">
                    <Truck className="w-2.5 h-2.5 text-teal-600" />
                    <span>ค่าส่งรวม</span>
                  </span>
                  <strong className="text-xs sm:text-sm font-bold text-teal-800 font-mono">
                    {formatCurrency(totalShippingCost)}
                  </strong>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 px-2.5 py-1.5 rounded-xl">
                  <span className="text-[10px] text-amber-700 font-semibold block">บริการนอกสถานที่</span>
                  <strong className="text-xs sm:text-sm font-bold text-amber-800 font-mono">
                    {formatCurrency(totalOnsiteFee)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs bg-slate-50 border border-slate-200/80 p-3 rounded-xl max-w-xs self-stretch md:self-auto flex flex-col justify-center">
            <span className="font-bold text-slate-700 block mb-1">สูตรคำนวณกำไร</span>
            <span className="text-slate-600 leading-relaxed text-[11px]">
              (ราคาประเมิน + ค่าบริการนอกสถานที่) - (ต้นทุนอะไหล่ + <strong>ค่าส่ง</strong> + ค่าใช้จ่ายอื่น) = <strong>กำไร</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table: เพิ่มคอลัมน์ค่าส่ง (รวม 9 คอลัมน์) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden w-full">
        {/* Table Header Action Bar */}
        <div className="p-3.5 sm:px-5 border-b border-slate-200 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              รายการรายได้และต้นทุน ({sortedJobs.length} งาน)
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
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 select-none">
              <tr>
                {/* 1. เลขjob */}
                <th 
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleToggleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    <span>1. เลข Job</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. ประเภทงาน */}
                <th className="py-3 px-3 whitespace-nowrap text-center">
                  <span>2. ประเภทงาน</span>
                </th>

                {/* 3. รายการ */}
                <th className="py-3 px-4 min-w-[150px]">
                  <span>3. รายการ</span>
                </th>

                {/* 4. ราคาประเมิน */}
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleToggleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>4. ราคาประเมิน</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 5. ค่าบริการนอกสถานที่ */}
                <th className="py-3 px-3 text-right whitespace-nowrap">
                  <span>5. ค่าบริการนอกสถานที่</span>
                </th>

                {/* 6. ต้นทุนอะไหล่ */}
                <th className="py-3 px-3 text-right whitespace-nowrap">
                  <span>6. ต้นทุนอะไหล่</span>
                </th>

                {/* 7. ค่าส่ง (เพิ่มใหม่ตามสั่ง) */}
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-teal-800"
                  onClick={() => handleToggleSort('shippingCost')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>7. ค่าส่ง</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 8. ค่าใช้จ่ายอื่น */}
                <th className="py-3 px-3 text-right whitespace-nowrap">
                  <span>8. ค่าใช้จ่ายอื่น</span>
                </th>

                {/* 9. กำไร */}
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                  onClick={() => handleToggleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>9. กำไร</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700">
                        ยังไม่มีข้อมูลงานในระบบ
                      </p>
                      <p className="text-xs text-slate-400">
                        ระบบว่างเปล่า (0 รายการ)
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => {
                  const estimatedPrice = job.financials?.price || 0;
                  const onsiteFee = job.financials?.onsiteServiceFee || 0;
                  const partsCost = job.financials?.partsCost || 0;
                  const shippingCost = job.financials?.shippingCost || 0;
                  const otherCost = job.financials?.otherCost || 0;
                  const profit = job.financials?.profit || 0;

                  return (
                    <tr 
                      key={job.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => onOpenJobDetail(job)}
                    >
                      {/* 1. เลขjob */}
                      <td className="py-3 px-3 whitespace-nowrap align-middle">
                        <div className="font-mono font-bold text-blue-700 text-xs group-hover:underline flex items-center gap-1">
                          <span>{job.id}</span>
                          <Eye className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>

                      {/* 2. ประเภทงาน */}
                      <td className="py-3 px-3 whitespace-nowrap align-middle text-center">
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
                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                          {job.device.brand} {job.device.model}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {job.customer.name}
                        </div>
                      </td>

                      {/* 4. ราคาประเมิน */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 align-middle">
                        {formatCurrency(estimatedPrice)}
                      </td>

                      {/* 5. ค่าบริการนอกสถานที่ */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-700 align-middle">
                        {onsiteFee > 0 ? formatCurrency(onsiteFee) : '-'}
                      </td>

                      {/* 6. ต้นทุนอะไหล่ */}
                      <td className="py-3 px-3 text-right font-mono text-rose-600 align-middle">
                        {partsCost > 0 ? formatCurrency(partsCost) : '-'}
                      </td>

                      {/* 7. ค่าส่ง (เพิ่มใหม่ตามสั่ง) */}
                      <td className="py-3 px-3 text-right font-mono text-teal-700 align-middle font-medium">
                        {shippingCost > 0 ? formatCurrency(shippingCost) : '-'}
                      </td>

                      {/* 8. ค่าใช้จ่ายอื่น */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 align-middle">
                        {otherCost > 0 ? formatCurrency(otherCost) : '-'}
                      </td>

                      {/* 9. กำไร */}
                      <td className="py-3 px-3 text-right font-mono font-bold align-middle">
                        <span className={`px-2 py-0.5 rounded-md ${
                          profit > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          profit < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'text-slate-500'
                        }`}>
                          {formatCurrency(profit)}
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
