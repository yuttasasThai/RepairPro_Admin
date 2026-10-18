import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  UserCheck, 
  UserPlus,
  Layers,
  Sparkles
} from 'lucide-react';
import { RepairJob, JobType, RepairStatus } from '../types/repair';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: Omit<RepairJob, 'id' | 'createdAt'> & { customCreatedAt?: string }) => void;
  defaultWarrantyDays?: number;
  defaultWarrantyTerms?: string;
  techniciansList: string[];
  onAddNewTechnician?: (name: string) => void;
  categoriesList?: string[];
  onAddNewCategory?: (name: string) => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultWarrantyDays = 90,
  defaultWarrantyTerms = 'รับประกันเฉพาะอะไหล่ที่เปลี่ยน ไม่ครอบคลุมเครื่องตกน้ำ หรือตกกระแทก',
  techniciansList = [],
  onAddNewTechnician,
  categoriesList = [],
  onAddNewCategory,
}) => {
  if (!isOpen) return null;

  // วดป (Date & Time)
  const [jobDateTime, setJobDateTime] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  });

  // ประเภทงาน: งานใหม่ หรือ งานในประกัน (ตามสั่ง)
  const [jobType, setJobType] = useState<JobType>('งานใหม่');

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // รายการ (ประเภทอุปกรณ์สร้างเองจากหน้าตั้งค่า)
  const defaultCategory = categoriesList.length > 0 ? categoriesList[0] : 'อุปกรณ์ทั่วไป';
  const [category, setCategory] = useState<string>(defaultCategory);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // อาการเสีย
  const [issueDescription, setIssueDescription] = useState('');

  // ประเมินค่าซ่อม (ใส่ถึงแค่ราคาประเมิน)
  const [estimatedPrice, setEstimatedPrice] = useState<number | ''>(jobType === 'งานในประกัน' ? 0 : 1500);

  // ช่างที่รับผิดชอบ
  const [selectedTechnician, setSelectedTechnician] = useState<string>(
    techniciansList[0] || 'ช่างประจำร้าน'
  );
  const [isAddingNewTech, setIsAddingNewTech] = useState(false);
  const [newTechName, setNewTechName] = useState('');

  // ระยะเวลารับประกัน
  const [warrantyDays, setWarrantyDays] = useState<number>(defaultWarrantyDays);

  const numericPrice = typeof estimatedPrice === 'number' ? estimatedPrice : 0;

  const handleCreateNewTechnician = () => {
    if (!newTechName.trim()) return;
    const name = newTechName.trim();
    if (onAddNewTechnician) {
      onAddNewTechnician(name);
    }
    setSelectedTechnician(name);
    setNewTechName('');
    setIsAddingNewTech(false);
  };

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (onAddNewCategory) {
      onAddNewCategory(cat);
    }
    setCategory(cat);
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !issueDescription.trim()) {
      alert('กรุณากรอกชื่อลูกค้า, เบอร์โทรศัพท์ และอาการเสียให้ครบถ้วน');
      return;
    }

    if (warrantyDays === undefined || warrantyDays === null || isNaN(warrantyDays) || warrantyDays <= 0) {
      alert('กรุณาระบุระยะเวลารับประกัน (วัน) ให้ถูกต้องก่อนบันทึก Job');
      return;
    }

    const initialStatus: RepairStatus = 'pending'; // รอซ่อมเสมอ (สถานะตกลงซ่อม/ยกเลิก มาแก้ไขในตารางแทน)

    // ค่าอะไหล่, ค่าส่ง, ค่าใช้จ่ายอื่นๆ เริ่มต้น 0 เพื่อนำไปปรับแก้ในตารางหลังบันทึกเปิด Job
    const jobPayload: Omit<RepairJob, 'id' | 'createdAt'> & { customCreatedAt?: string } = {
      customCreatedAt: new Date(jobDateTime).toISOString(),
      jobType,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
      },
      device: {
        category,
        categoryLabel: category || 'อุปกรณ์',
        brand: brand.trim() || 'ทั่วไป',
        model: model.trim() || 'ไม่ระบุรุ่น',
        serialNumber: serialNumber.trim() || undefined,
      },
      issueDescription: issueDescription.trim(),
      technician: selectedTechnician.trim() || 'ช่างประจำร้าน',
      status: initialStatus,
      financials: {
        price: numericPrice,
        partsCost: 0,
        shippingCost: 0,
        otherCost: 0,
        laborCost: 0,
        totalCost: 0,
        profit: numericPrice,
        customerDecision: 'accepted',
        deposit: 0,
        paidAmount: 0,
        paymentStatus: 'unpaid',
      },
      warranty: {
        warrantyDays: warrantyDays,
        terms: defaultWarrantyTerms,
      },
    };

    onSubmit(jobPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 my-4 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="font-bold text-base">เปิด Job ใหม่</h2>
              <p className="text-[11px] text-slate-400">บันทึก วดป ข้อมูลเครื่อง อาการเสีย และราคาประเมิน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-xs sm:text-sm">
          {/* Section 0: ประเภทงาน (งานใหม่ หรือ งานในประกัน ตามสั่ง) */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>ประเภทการรับงาน:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setJobType('งานใหม่');
                  if (estimatedPrice === 0) setEstimatedPrice(1500);
                }}
                className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  jobType === 'งานใหม่'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>🆕 งานใหม่ (คิดค่าบริการ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setJobType('งานในประกัน');
                  setEstimatedPrice(0);
                }}
                className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  jobType === 'งานในประกัน'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>🛡️ งานในประกัน (เคลมฟรี/ในระยะ)</span>
              </button>
            </div>
          </div>

          {/* Section 1: วดป & ลูกค้า */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>วดป (วันที่รับงาน)</span>
              </label>
              <input
                type="datetime-local"
                required
                value={jobDateTime}
                onChange={(e) => setJobDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อลูกค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น คุณสมชาย"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เบอร์โทรลูกค้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="เช่น 081-456-7890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono"
              />
            </div>
          </div>

          {/* Section 2: รายการอุปกรณ์ (ประเภทสร้างเองในหน้าตั้งค่า) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>รายการอุปกรณ์</span>
              </span>
              {!isAddingNewCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ เพิ่มประเภทอุปกรณ์</span>
                </button>
              )}
            </div>

            {isAddingNewCategory && (
              <div className="flex gap-2 items-center p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg animate-in fade-in">
                <input
                  type="text"
                  autoFocus
                  placeholder="พิมพ์ประเภทอุปกรณ์ใหม่ เช่น ทีวี, กล้อง..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCategory(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">ประเภท</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  {categoriesList.length === 0 ? (
                    <option value="อุปกรณ์ทั่วไป">อุปกรณ์ทั่วไป</option>
                  ) : (
                    categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">ยี่ห้อ (Brand)</label>
                <input
                  type="text"
                  placeholder="เช่น Apple, Asus, Samsung"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">รุ่น (Model)</label>
                <input
                  type="text"
                  placeholder="เช่น iPhone 15, Vivo V29"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">S/N หรือ IMEI</label>
                <input
                  type="text"
                  placeholder="IMEI/SN (ถ้ามี)"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: อาการเสีย */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อาการเสีย <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="ระบุอาการเสีย เช่น จอแตกเปิดไม่ติด, ชาร์จไม่เข้า, พัดลมไม่หมุน..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>

          {/* Section 4: ใส่ถึงแค่ราคาประเมิน (สถานะตกลงซ่อม/ยกเลิก ตัดออกตามสั่ง ให้ไปแก้ในตารางแทน) */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>ราคาประเมิน (ค่าซ่อม) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-blue-700 font-medium">
                {jobType === 'งานในประกัน' ? 'งานเคลมประกัน (0 บาท)' : 'ใส่ถึงแค่ราคาประเมิน'}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                required
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-bold text-base text-blue-800 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                บาท
              </span>
            </div>

            <p className="text-[11px] text-slate-500 bg-white/80 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
              <span>💡</span>
              <span><strong>สถานะลูกค้า (ตกลงซ่อม, ยกเลิก), ค่าอะไหล่, ค่าส่ง, ค่าใช้จ่ายอื่นๆ และกำไร</strong> ปรับแก้ในตารางงานซ่อมหลังเปิดงาน</span>
            </p>
          </div>

          {/* Section 5: ช่างที่รับผิดชอบ */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>ช่างที่รับผิดชอบ</span>
              </label>
              {!isAddingNewTech && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewTech(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มชื่อช่างใหม่</span>
                </button>
              )}
            </div>

            {!isAddingNewTech ? (
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 text-xs sm:text-sm"
              >
                {techniciansList.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2 items-center pt-1 animate-in fade-in">
                <input
                  type="text"
                  autoFocus
                  placeholder="พิมพ์ชื่อช่างใหม่ เช่น ช่างกล้า..."
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-indigo-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleCreateNewTechnician}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                >
                  บันทึกลง List
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewTech(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>

          {/* Section 6: ระยะเวลารับประกัน (กรณีงานในประกัน และ งานใหม่ ให้ใส่ระยะประกันด้วยก่อน บันทึกJobงาน) */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ระยะเวลารับประกัน (วัน) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-emerald-800 font-medium">
                {jobType === 'งานในประกัน' ? '🛡️ ระบุระยะประกันของงานเคลม' : '🆕 ระบุระยะประกันของงานใหม่'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <select
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={30}>30 วัน (1 เดือน)</option>
                  <option value={60}>60 วัน (2 เดือน)</option>
                  <option value={90}>90 วัน (3 เดือน - มาตรฐาน)</option>
                  <option value={180}>180 วัน (6 เดือน)</option>
                  <option value={365}>365 วัน (1 ปี)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ระบุจำนวนวันเอง"
                  value={warrantyDays || ''}
                  onChange={(e) => setWarrantyDays(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-500 shrink-0">วัน</span>
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-500 font-medium">เลือกด่วน:</span>
              {[30, 60, 90, 180, 365].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWarrantyDays(days)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                    warrantyDays === days
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {days} วัน
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>บันทึกเปิด Job</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
