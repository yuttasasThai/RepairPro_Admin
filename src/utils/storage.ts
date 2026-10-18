import { RepairJob, ShopSettings, RepairStatus, CancellationReason } from '../types/repair';
import { INITIAL_REPAIR_JOBS, DEFAULT_SHOP_SETTINGS } from '../data/seedData';
import { getTenantStoragePrefix } from './license';

export function getJobsStorageKey(): string {
  return `repair_pro_jobs_v2${getTenantStoragePrefix()}`;
}

export function getSettingsStorageKey(): string {
  return `repair_pro_settings_v2${getTenantStoragePrefix()}`;
}

export function getStoredJobs(): RepairJob[] {
  try {
    const key = getJobsStorageKey();
    // Clean up old v1 seed data if present on default
    if (localStorage.getItem('repair_pro_jobs_v1')) {
      localStorage.removeItem('repair_pro_jobs_v1');
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch (err) {
    console.error('Error loading stored jobs:', err);
    return [];
  }
}

export function saveStoredJobs(jobs: RepairJob[]): void {
  try {
    const key = getJobsStorageKey();
    localStorage.setItem(key, JSON.stringify(jobs));
  } catch (err) {
    console.error('Error saving jobs:', err);
  }
}

export function getStoredSettings(): ShopSettings {
  try {
    const key = getSettingsStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_SHOP_SETTINGS));
      return DEFAULT_SHOP_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SHOP_SETTINGS,
      ...parsed,
      technicians: Array.isArray(parsed.technicians) && parsed.technicians.length > 0 
        ? parsed.technicians 
        : DEFAULT_SHOP_SETTINGS.technicians,
      customCategories: Array.isArray(parsed.customCategories) && parsed.customCategories.length > 0
        ? parsed.customCategories
        : (DEFAULT_SHOP_SETTINGS.customCategories || ['มือถือ / สมาร์ทโฟน', 'โน้ตบุ๊ก / คอมพิวเตอร์', 'เครื่องใช้ไฟฟ้า', 'แท็บเล็ต / iPad']),
    };
  } catch {
    return DEFAULT_SHOP_SETTINGS;
  }
}

export function saveStoredSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(getSettingsStorageKey(), JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

export function generateJobId(existingJobs: RepairJob[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `REP-${year}${month}-`;
  
  // Find highest suffix number for this month
  const currentMonthJobs = existingJobs.filter(j => j.id.startsWith(prefix));
  let maxNum = 0;
  for (const job of currentMonthJobs) {
    const numPart = job.id.replace(prefix, '');
    const num = parseInt(numPart, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextNum}`;
}

export function createNewJob(
  jobData: Omit<RepairJob, 'id' | 'createdAt' | 'status'> & { status?: RepairStatus; customCreatedAt?: string },
  existingJobs: RepairJob[]
): RepairJob {
  const now = new Date().toISOString();
  const id = generateJobId(existingJobs);
  const status = jobData.status || 'pending';
  const createdAt = jobData.customCreatedAt || now;
  const jobType = jobData.jobType || 'งานใหม่';
  
  const newJob: RepairJob = {
    ...jobData,
    jobType,
    id,
    createdAt,
    status,
    history: [
      {
        status,
        timestamp: createdAt,
        note: 'เปิดใบรับงานซ่อมเข้าระบบ',
      },
    ],
  };

  const updated = [newJob, ...existingJobs];
  saveStoredJobs(updated);
  return newJob;
}

export function updateExistingJob(
  id: string,
  updates: Partial<RepairJob>,
  existingJobs: RepairJob[]
): RepairJob[] {
  const updated = existingJobs.map(job => {
    if (job.id === id) {
      // Recalculate profit if financials are updated
      const pCost = updates.financials?.partsCost ?? job.financials.partsCost ?? 0;
      const sCost = updates.financials?.shippingCost ?? job.financials.shippingCost ?? 0;
      const oCost = updates.financials?.otherCost ?? job.financials.otherCost ?? 0;
      const lCost = updates.financials?.laborCost ?? job.financials.laborCost ?? 0;
      const priceVal = updates.financials?.price ?? job.financials.price ?? 0;
      const totalCostCalc = pCost + sCost + oCost + lCost;
      const profitCalc = priceVal - totalCostCalc;

      const updatedFinancials = updates.financials ? {
        ...job.financials,
        ...updates.financials,
        totalCost: totalCostCalc,
        profit: profitCalc,
      } : job.financials;

      return {
        ...job,
        ...updates,
        financials: updatedFinancials,
      };
    }
    return job;
  });

  saveStoredJobs(updated);
  return updated;
}

export function changeJobStatus(
  id: string,
  newStatus: RepairStatus,
  options: {
    price?: number;
    cancellationReason?: CancellationReason;
    cancellationNotes?: string;
    technicianNotes?: string;
    statusNote?: string;
    trackingNumber?: string;
    actualWarrantyDays?: number;
    waitingParts?: any[];
    partsCost?: number;
    otherCost?: number;
    onsiteServiceFee?: number;
    shippingCost?: number;
    deliveryAttachment?: string;
    deliveryAttachmentName?: string;
  },
  existingJobs: RepairJob[]
): RepairJob[] {
  const STATUS_ORDER: Record<RepairStatus, number> = {
    pending: 0,
    in_progress: 1,
    waiting_parts: 1,
    completed: 2,
    ready_to_ship: 3,
    delivered: 4,
    picked_up: 4,
    cancelled: 99,
  };

  const now = new Date().toISOString();
  const todayDateStr = now.split('T')[0];

  const updated = existingJobs.map(job => {
    if (job.id !== id) return job;

    // Strict forward-only rule: terminal states cannot change, and status cannot go backwards
    if (job.status === 'delivered' || job.status === 'picked_up' || job.status === 'cancelled') {
      return job; // Cannot change terminal states
    }
    if (newStatus !== 'cancelled') {
      const currentOrder = STATUS_ORDER[job.status] ?? 0;
      const targetOrder = STATUS_ORDER[newStatus] ?? 0;
      if (targetOrder < currentOrder) {
        return job; // Disallow backwards status
      }
    }

    const historyEntry = {
      status: newStatus,
      timestamp: now,
      note: options.statusNote || (
        newStatus === 'cancelled' 
          ? `ยกเลิกงาน: ${options.cancellationReason || 'ไม่ระบุ'}` 
          : `เปลี่ยนสถานะเป็น ${newStatus}`
      ),
    };

    const currentHistory = job.history || [];
    const extraUpdates: Partial<RepairJob> = {};

    if (options.trackingNumber !== undefined) {
      extraUpdates.trackingNumber = options.trackingNumber;
    }

    if (options.waitingParts !== undefined) {
      extraUpdates.waitingParts = options.waitingParts;
    }

    if (options.deliveryAttachment !== undefined) {
      extraUpdates.deliveryAttachment = options.deliveryAttachment;
      extraUpdates.deliveryAttachmentName = options.deliveryAttachmentName;
    }

    const currentWarrantyDays = options.actualWarrantyDays !== undefined && options.actualWarrantyDays > 0
      ? options.actualWarrantyDays
      : (job.warranty?.warrantyDays || 90);

    if (newStatus === 'completed') {
      extraUpdates.completedAt = job.completedAt || now;
      extraUpdates.warranty = {
        ...job.warranty,
        warrantyDays: currentWarrantyDays,
      };
    } else if (newStatus === 'ready_to_ship') {
      if (!job.completedAt) {
        extraUpdates.completedAt = now;
      }
      extraUpdates.warranty = {
        ...job.warranty,
        warrantyDays: currentWarrantyDays,
      };
    } else if (newStatus === 'delivered' || newStatus === 'picked_up') {
      const deliveryIso = now;
      const deliveryDateStr = todayDateStr;
      extraUpdates.deliveredAt = job.deliveredAt || deliveryIso;
      if (!job.completedAt) {
        extraUpdates.completedAt = now;
      }
      if (currentWarrantyDays > 0) {
        const endDate = new Date(deliveryDateStr);
        endDate.setDate(endDate.getDate() + currentWarrantyDays);
        extraUpdates.warranty = {
          ...job.warranty,
          warrantyDays: currentWarrantyDays,
          startDate: deliveryDateStr,
          endDate: endDate.toISOString().split('T')[0],
        };
      }
    } else if (newStatus === 'cancelled') {
      extraUpdates.cancellationReason = options.cancellationReason;
      extraUpdates.cancellationNotes = options.cancellationNotes || '';
    }

    // Financial updates from status update (e.g. price edited at step 3, partsCost, otherCost, onsiteServiceFee, shippingCost)
    if (
      options.price !== undefined ||
      options.partsCost !== undefined ||
      options.otherCost !== undefined ||
      options.onsiteServiceFee !== undefined ||
      options.shippingCost !== undefined
    ) {
      const currentFin = job.financials || { price: 0, partsCost: 0, shippingCost: 0, otherCost: 0, laborCost: 0, totalCost: 0, profit: 0, paymentStatus: 'unpaid', deposit: 0, paidAmount: 0 };
      const newPrice = options.price !== undefined ? options.price : (currentFin.price || 0);
      const newOnsiteFee = options.onsiteServiceFee !== undefined ? options.onsiteServiceFee : (currentFin.onsiteServiceFee || 0);
      const newPartsCost = options.partsCost !== undefined ? options.partsCost : (currentFin.partsCost || 0);
      const newShippingCost = options.shippingCost !== undefined ? options.shippingCost : (currentFin.shippingCost || 0);
      const newOtherCost = options.otherCost !== undefined ? options.otherCost : (currentFin.otherCost || 0);
      const newLaborCost = currentFin.laborCost || 0;
      const newTotalCost = newPartsCost + newShippingCost + newOtherCost + newLaborCost;
      const newProfit = (newPrice + newOnsiteFee) - newTotalCost;

      extraUpdates.financials = {
        ...currentFin,
        price: newPrice,
        onsiteServiceFee: newOnsiteFee,
        partsCost: newPartsCost,
        shippingCost: newShippingCost,
        otherCost: newOtherCost,
        totalCost: newTotalCost,
        profit: newProfit,
      };
    }

    if (options.technicianNotes !== undefined) {
      extraUpdates.technicianNotes = options.technicianNotes;
    }

    return {
      ...job,
      ...extraUpdates,
      status: newStatus,
      history: [...currentHistory, historyEntry],
    };
  });

  saveStoredJobs(updated);
  return updated;
}

export function deleteJobById(id: string, existingJobs: RepairJob[]): RepairJob[] {
  const updated = existingJobs.filter(j => j.id !== id);
  saveStoredJobs(updated);
  return updated;
}

export function clearAllJobs(): RepairJob[] {
  try {
    localStorage.setItem(getJobsStorageKey(), JSON.stringify([]));
    if (getJobsStorageKey() === 'repair_pro_jobs_v2') {
      localStorage.removeItem('repair_pro_jobs_v1');
    }
  } catch (err) {
    console.error('Error clearing jobs:', err);
  }
  return [];
}

export function resetAllDataToDefault(): RepairJob[] {
  try {
    localStorage.setItem(getJobsStorageKey(), JSON.stringify([]));
    if (getJobsStorageKey() === 'repair_pro_jobs_v2') {
      localStorage.removeItem('repair_pro_jobs_v1');
    }
    localStorage.setItem(getSettingsStorageKey(), JSON.stringify(DEFAULT_SHOP_SETTINGS));
  } catch (err) {
    console.error('Error resetting all data:', err);
  }
  return [];
}

