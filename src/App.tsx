/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { JobsTableView } from './components/JobsTableView';
import { CompletedJobsView } from './components/CompletedJobsView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { WarrantyAlertsView } from './components/WarrantyAlertsView';
import { TrackingView } from './components/TrackingView';
import { NewJobModal } from './components/NewJobModal';
import { JobDetailModal } from './components/JobDetailModal';
import { StatusUpdateModal } from './components/StatusUpdateModal';
import { CostUpdateModal } from './components/CostUpdateModal';
import { PrintTicketModal } from './components/PrintTicketModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { SourceCodeModal } from './components/SourceCodeModal';
import { MobileGuideModal } from './components/MobileGuideModal';
import { LicenseManagerModal } from './components/LicenseManagerModal';
import { SubscriptionExpiredModal } from './components/SubscriptionExpiredModal';
import { RepairJob, RepairStatus, ShopSettings } from './types/repair';
import { LicenseConfig } from './types/license';
import { getStoredLicense, calculateLicenseStatus } from './utils/license';
import { 
  getStoredJobs, 
  getStoredSettings, 
  saveStoredSettings, 
  createNewJob, 
  updateExistingJob,
  changeJobStatus, 
  deleteJobById, 
  clearAllJobs,
  resetAllDataToDefault 
} from './utils/storage';

export default function App() {
  const [jobs, setJobs] = useState<RepairJob[]>(() => getStoredJobs());
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => getStoredSettings());
  const [licenseConfig, setLicenseConfig] = useState<LicenseConfig>(() => getStoredLicense());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [tableStatusFilter, setTableStatusFilter] = useState<RepairStatus | undefined>(undefined);

  const licenseStatus = calculateLicenseStatus(licenseConfig);

  // Modals state
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLicenseManagerOpen, setIsLicenseManagerOpen] = useState(false);
  const [isExpiredModalOpen, setIsExpiredModalOpen] = useState(false);
  const [detailJob, setDetailJob] = useState<RepairJob | null>(null);
  const [statusUpdateJob, setStatusUpdateJob] = useState<RepairJob | null>(null);
  const [selectedCostJob, setSelectedCostJob] = useState<RepairJob | null>(null);
  const [printJob, setPrintJob] = useState<RepairJob | null>(null);
  const [isSourceCodeOpen, setIsSourceCodeOpen] = useState(false);
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);

  // Intercept job creation if license is expired
  const handleOpenNewJob = () => {
    if (licenseStatus.isExpired) {
      setIsExpiredModalOpen(true);
    } else {
      setIsNewJobOpen(true);
    }
  };

  // Sync state if detailJob is updated
  useEffect(() => {
    if (detailJob) {
      const updated = jobs.find(j => j.id === detailJob.id);
      if (updated) {
        setDetailJob(updated);
      }
    }
  }, [jobs]);

  // Handlers
  const handleCreateJob = (jobData: Omit<RepairJob, 'id' | 'createdAt'> & { customCreatedAt?: string }) => {
    const newJob = createNewJob(jobData, jobs);
    setJobs(prev => [newJob, ...prev]);
  };

  const handleUpdateStatus = (
    jobId: string, 
    newStatus: RepairStatus, 
    options: any
  ) => {
    const updated = changeJobStatus(jobId, newStatus, options, jobs);
    setJobs(updated);
  };

  const handleSaveCosts = (
    jobId: string, 
    costs: {
      price: number;
      onsiteServiceFee?: number;
      partsCost: number;
      shippingCost: number;
      otherCost: number;
      customerDecision?: any;
      cancellationReason?: any;
      cancellationNotes?: string;
    }
  ) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const onsiteFee = costs.onsiteServiceFee !== undefined ? costs.onsiteServiceFee : (targetJob.financials.onsiteServiceFee || 0);
    const totalCostCalc = costs.partsCost + costs.shippingCost + costs.otherCost;
    const profitCalc = (costs.price + onsiteFee) - totalCostCalc;

    const updates: any = {
      financials: {
        ...targetJob.financials,
        price: costs.price,
        onsiteServiceFee: onsiteFee,
        partsCost: costs.partsCost,
        shippingCost: costs.shippingCost,
        otherCost: costs.otherCost,
        totalCost: totalCostCalc,
        profit: profitCalc,
        customerDecision: costs.customerDecision || targetJob.financials.customerDecision || 'accepted',
      },
    };

    if (costs.customerDecision === 'cancelled') {
      updates.status = 'cancelled';
      updates.cancellationReason = costs.cancellationReason || targetJob.cancellationReason || 'ลูกค้ายกเลิก';
      updates.cancellationNotes = costs.cancellationNotes;
    } else if (costs.customerDecision === 'accepted' && targetJob.status === 'cancelled') {
      updates.status = 'pending';
      updates.cancellationReason = undefined;
      updates.cancellationNotes = undefined;
    }

    const updated = updateExistingJob(jobId, updates, jobs);
    setJobs(updated);
  };

  const handleAddNewTechnician = (newTechName: string) => {
    const currentTechs = shopSettings.technicians || [];
    if (!currentTechs.includes(newTechName)) {
      const updatedTechs = [...currentTechs, newTechName];
      const updatedSettings = { ...shopSettings, technicians: updatedTechs };
      setShopSettings(updatedSettings);
      saveStoredSettings(updatedSettings);
    }
  };

  const handleAddNewCategory = (newCatName: string) => {
    const currentCats = shopSettings.customCategories || [];
    if (!currentCats.includes(newCatName)) {
      const updatedCats = [...currentCats, newCatName];
      const updatedSettings = { ...shopSettings, customCategories: updatedCats };
      setShopSettings(updatedSettings);
      saveStoredSettings(updatedSettings);
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const updated = deleteJobById(jobId, jobs);
    setJobs(updated);
  };

  const handleSaveSettings = (newSettings: ShopSettings) => {
    setShopSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleResetData = () => {
    const emptyJobs = clearAllJobs();
    setJobs(emptyJobs);
    setDetailJob(null);
    setStatusUpdateJob(null);
    setSelectedCostJob(null);
    setPrintJob(null);
  };

  const handleNavigateToJobsWithStatus = (filterStatus?: RepairStatus) => {
    setTableStatusFilter(filterStatus);
    setActiveTab('jobs');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      {/* Navigation Bar */}
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewJob={handleOpenNewJob}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        onOpenSourceCode={() => setIsSourceCodeOpen(true)}
        onOpenMobileGuide={() => setIsMobileGuideOpen(true)}
        onOpenLicenseManager={() => setIsLicenseManagerOpen(true)}
        licenseConfig={licenseConfig}
        licenseStatus={licenseStatus}
        jobs={jobs}
        shopSettings={shopSettings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'dashboard' && (
          <DashboardView
            jobs={jobs}
            shopSettings={shopSettings}
            onOpenNewJob={handleOpenNewJob}
            onOpenJobDetail={(j) => setDetailJob(j)}
            onOpenStatusUpdate={(j) => setStatusUpdateJob(j)}
            onOpenCostUpdate={(j) => setSelectedCostJob(j)}
            onOpenPrint={(j) => setPrintJob(j)}
            onNavigateToWarranty={() => setActiveTab('warranty')}
            onNavigateToJobs={handleNavigateToJobsWithStatus}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsTableView
            jobs={jobs}
            onOpenNewJob={() => setIsNewJobOpen(true)}
            onOpenJobDetail={(j) => setDetailJob(j)}
            onOpenStatusUpdate={(j) => setStatusUpdateJob(j)}
            onOpenCostUpdate={(j) => setSelectedCostJob(j)}
            onOpenPrint={(j) => setPrintJob(j)}
          />
        )}

        {activeTab === 'completed_jobs' && (
          <CompletedJobsView
            jobs={jobs}
            onOpenJobDetail={(j) => setDetailJob(j)}
            onOpenCostUpdate={(j) => setSelectedCostJob(j)}
            onOpenPrint={(j) => setPrintJob(j)}
          />
        )}

        {(activeTab === 'revenue' || (activeTab as string) === 'monthly') && (
          <MonthlyReportView
            jobs={jobs}
            onOpenJobDetail={(j) => setDetailJob(j)}
          />
        )}

        {activeTab === 'warranty' && (
          <WarrantyAlertsView
            jobs={jobs}
            onOpenJobDetail={(j) => setDetailJob(j)}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingView
            jobs={jobs}
            shopSettings={shopSettings}
            onOpenJobDetail={(j) => setDetailJob(j)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>RepairProShop</strong> © 2026 - ระบบบันทึกงานซ่อมและติดตามสถานะงาน
          </div>
          <div className="text-slate-400">
            {shopSettings.shopName} • โทร {shopSettings.phone}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onSubmit={handleCreateJob}
        defaultWarrantyDays={shopSettings.defaultWarrantyDays}
        defaultWarrantyTerms={shopSettings.defaultWarrantyTerms}
        techniciansList={shopSettings.technicians || []}
        onAddNewTechnician={handleAddNewTechnician}
        categoriesList={shopSettings.customCategories || []}
        onAddNewCategory={handleAddNewCategory}
      />

      <JobDetailModal
        job={detailJob}
        isOpen={detailJob !== null}
        onClose={() => setDetailJob(null)}
        onOpenStatusUpdate={(j) => setStatusUpdateJob(j)}
        onOpenPrint={(j) => setPrintJob(j)}
        onDeleteJob={handleDeleteJob}
        shopSettings={shopSettings}
      />

      <StatusUpdateModal
        job={statusUpdateJob}
        isOpen={statusUpdateJob !== null}
        onClose={() => setStatusUpdateJob(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <CostUpdateModal
        job={selectedCostJob}
        isOpen={selectedCostJob !== null}
        onClose={() => setSelectedCostJob(null)}
        onSaveCosts={handleSaveCosts}
      />

      <PrintTicketModal
        job={printJob}
        shopSettings={shopSettings}
        isOpen={printJob !== null}
        onClose={() => setPrintJob(null)}
      />

      <ShopSettingsModal
        settings={shopSettings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onResetData={handleResetData}
        onOpenSourceCode={() => setIsSourceCodeOpen(true)}
        onOpenMobileGuide={() => setIsMobileGuideOpen(true)}
        onOpenLicenseManager={() => setIsLicenseManagerOpen(true)}
      />

      <SourceCodeModal
        isOpen={isSourceCodeOpen}
        onClose={() => setIsSourceCodeOpen(false)}
      />

      <MobileGuideModal
        isOpen={isMobileGuideOpen}
        onClose={() => setIsMobileGuideOpen(false)}
      />

      <LicenseManagerModal
        isOpen={isLicenseManagerOpen}
        onClose={() => setIsLicenseManagerOpen(false)}
        licenseConfig={licenseConfig}
        licenseStatus={licenseStatus}
        onLicenseUpdated={(newConfig) => setLicenseConfig(newConfig)}
      />

      <SubscriptionExpiredModal
        isOpen={isExpiredModalOpen}
        onClose={() => setIsExpiredModalOpen(false)}
        licenseConfig={licenseConfig}
        licenseStatus={licenseStatus}
        onLicenseUpdated={(newConfig) => setLicenseConfig(newConfig)}
        onOpenAdminManager={() => setIsLicenseManagerOpen(true)}
      />
    </div>
  );
}
