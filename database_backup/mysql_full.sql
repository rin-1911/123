SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- CreateTable
CREATE TABLE `ChannelSource` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `storeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ChannelSource_storeId_isActive_idx`(`storeId`, `isActive`),
    UNIQUE INDEX `ChannelSource_storeId_name_key`(`storeId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConfigFlag` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `key` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `value` TEXT NOT NULL DEFAULT '{}',
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConfigFlag_key_idx`(`key`),
    UNIQUE INDEX `ConfigFlag_scope_storeId_key_key`(`scope`, `storeId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `receptionTotal` INTEGER NOT NULL DEFAULT 0,
    `initialTotal` INTEGER NOT NULL DEFAULT 0,
    `dealsTotal` INTEGER NOT NULL DEFAULT 0,
    `initialDealsTotal` INTEGER NOT NULL DEFAULT 0,
    `cashInCents` INTEGER NOT NULL DEFAULT 0,
    `implantLeads` INTEGER NOT NULL DEFAULT 0,
    `orthoLeads` INTEGER NOT NULL DEFAULT 0,
    `followupAppointments` INTEGER NOT NULL DEFAULT 0,
    `followupCallsDone` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultationViewPermission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `grantedById` VARCHAR(191) NOT NULL,
    `canViewAll` BOOLEAN NOT NULL DEFAULT false,
    `canViewStats` BOOLEAN NOT NULL DEFAULT true,
    `canExport` BOOLEAN NOT NULL DEFAULT false,
    `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConsultationViewPermission_storeId_idx`(`storeId`),
    UNIQUE INDEX `ConsultationViewPermission_userId_storeId_key`(`userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyReport` (
    `id` VARCHAR(191) NOT NULL,
    `reportDate` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `schemaId` VARCHAR(191) NULL,
    `formData` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DailyReport_userId_reportDate_idx`(`userId`, `reportDate`),
    INDEX `DailyReport_departmentId_reportDate_idx`(`departmentId`, `reportDate`),
    INDEX `DailyReport_storeId_reportDate_idx`(`storeId`, `reportDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `attendance` TEXT NULL,
    `recruitment` TEXT NULL,
    `personnel` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `assets` TEXT NULL,
    `hygiene` TEXT NULL,
    `logistics` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Department_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyReportTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `schemaId` VARCHAR(191) NOT NULL DEFAULT '',
    `configJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DailyReportTemplate_departmentId_idx`(`departmentId`),
    INDEX `DailyReportTemplate_role_idx`(`role`),
    UNIQUE INDEX `DailyReportTemplate_role_departmentId_schemaId_key`(`role`, `departmentId`, `schemaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DictionaryItem` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DictionaryItem_category_isActive_idx`(`category`, `isActive`),
    UNIQUE INDEX `DictionaryItem_category_name_key`(`category`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceHrAdminReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `cashInCents` INTEGER NOT NULL DEFAULT 0,
    `refundsInCents` INTEGER NOT NULL DEFAULT 0,
    `cashPayInCents` INTEGER NOT NULL DEFAULT 0,
    `cardPayInCents` INTEGER NOT NULL DEFAULT 0,
    `onlinePayInCents` INTEGER NOT NULL DEFAULT 0,
    `expenseTotalInCents` INTEGER NOT NULL DEFAULT 0,
    `expenseMaterialInCents` INTEGER NOT NULL DEFAULT 0,
    `expenseProcessingInCents` INTEGER NOT NULL DEFAULT 0,
    `expenseMarketingInCents` INTEGER NOT NULL DEFAULT 0,
    `expenseAdminInCents` INTEGER NOT NULL DEFAULT 0,
    `reconciliationIssues` INTEGER NOT NULL DEFAULT 0,
    `staffScheduled` INTEGER NOT NULL DEFAULT 0,
    `staffPresent` INTEGER NOT NULL DEFAULT 0,
    `staffAbsent` INTEGER NOT NULL DEFAULT 0,
    `hiresCount` INTEGER NOT NULL DEFAULT 0,
    `resignationsCount` INTEGER NOT NULL DEFAULT 0,
    `trainingSessions` INTEGER NOT NULL DEFAULT 0,
    `traineesCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FrontDeskReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `new_patients_count` INTEGER NOT NULL DEFAULT 0,
    `newVisits` INTEGER NOT NULL DEFAULT 0,
    `returningVisits` INTEGER NOT NULL DEFAULT 0,
    `newAppointments` INTEGER NOT NULL DEFAULT 0,
    `rescheduledAppointments` INTEGER NOT NULL DEFAULT 0,
    `canceledAppointments` INTEGER NOT NULL DEFAULT 0,
    `noShowAppointments` INTEGER NOT NULL DEFAULT 0,
    `initialTriage` INTEGER NOT NULL DEFAULT 0,
    `revisitTriage` INTEGER NOT NULL DEFAULT 0,
    `paymentsCount` INTEGER NOT NULL DEFAULT 0,
    `refundsCount` INTEGER NOT NULL DEFAULT 0,
    `complaintsCount` INTEGER NOT NULL DEFAULT 0,
    `resolvedCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicalReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `patientsSeen` INTEGER NOT NULL DEFAULT 0,
    `rootCanals` INTEGER NOT NULL DEFAULT 0,
    `fillings` INTEGER NOT NULL DEFAULT 0,
    `extractions` INTEGER NOT NULL DEFAULT 0,
    `fixedProsthesisDelivered` INTEGER NOT NULL DEFAULT 0,
    `removableProsthesisDeliv` INTEGER NOT NULL DEFAULT 0,
    `implantSurgeries` INTEGER NOT NULL DEFAULT 0,
    `orthoStarts` INTEGER NOT NULL DEFAULT 0,
    `orthoFollowups` INTEGER NOT NULL DEFAULT 0,
    `riskEvents` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NursingReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `workType` VARCHAR(191) NOT NULL,
    `panoramicXrays` INTEGER NOT NULL DEFAULT 0,
    `cbctScans` INTEGER NOT NULL DEFAULT 0,
    `intraoralScansPhotos` INTEGER NOT NULL DEFAULT 0,
    `sterilizerCycles` INTEGER NOT NULL DEFAULT 0,
    `instrumentPacks` INTEGER NOT NULL DEFAULT 0,
    `consumableIncidents` INTEGER NOT NULL DEFAULT 0,
    `doctorsAssisted` INTEGER NOT NULL DEFAULT 0,
    `overtimeMinutes` INTEGER NOT NULL DEFAULT 0,
    `hygieneVisits` INTEGER NOT NULL DEFAULT 0,
    `perioTherapies` INTEGER NOT NULL DEFAULT 0,
    `referralsToDoctor` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfflineMarketingReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `touchpoints` INTEGER NOT NULL DEFAULT 0,
    `leadsNew` INTEGER NOT NULL DEFAULT 0,
    `leadsValid` INTEGER NOT NULL DEFAULT 0,
    `appointmentsBooked` INTEGER NOT NULL DEFAULT 0,
    `visitsArrived` INTEGER NOT NULL DEFAULT 0,
    `costInCents` INTEGER NOT NULL DEFAULT 0,
    `partnershipsNew` INTEGER NOT NULL DEFAULT 0,
    `partnershipsMaintained` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OnlineGrowthReport` (
    `dailyReportId` VARCHAR(191) NOT NULL,
    `leads_today` INTEGER NOT NULL DEFAULT 0,
    `leads_month` INTEGER NOT NULL DEFAULT 0,
    `visits_today` INTEGER NOT NULL DEFAULT 0,
    `deals_today` INTEGER NOT NULL DEFAULT 0,
    `visits_month` INTEGER NOT NULL DEFAULT 0,
    `deals_month` INTEGER NOT NULL DEFAULT 0,
    `revenue_today` INTEGER NOT NULL DEFAULT 0,
    `followup_today` INTEGER NOT NULL DEFAULT 0,
    `intentional_tomorrow` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`dailyReportId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatientConsultation` (
    `id` VARCHAR(191) NOT NULL,
    `patientName` VARCHAR(191) NOT NULL,
    `patientPhone` VARCHAR(191) NULL,
    `patientAge` INTEGER NULL,
    `patientGender` VARCHAR(191) NULL,
    `visitDate` VARCHAR(191) NOT NULL,
    `visitType` VARCHAR(191) NOT NULL DEFAULT 'INITIAL',
    `source` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `toothPositions` VARCHAR(191) NULL,
    `chiefComplaint` TEXT NULL,
    `diagnosis` TEXT NULL,
    `intendedProjects` TEXT NULL,
    `intentionLevel` VARCHAR(191) NULL,
    `dealStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dealProjects` TEXT NULL,
    `dealAmount` INTEGER NOT NULL DEFAULT 0,
    `depositAmount` INTEGER NOT NULL DEFAULT 0,
    `paymentMethod` VARCHAR(191) NULL,
    `noDealReason` TEXT NULL,
    `noDealDetail` TEXT NULL,
    `nextFollowDate` VARCHAR(191) NULL,
    `nextFollowNote` TEXT NULL,
    `followHistory` TEXT NULL,
    `remark` TEXT NULL,
    `consultantId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PatientConsultation_consultantId_visitDate_idx`(`consultantId`, `visitDate`),
    INDEX `PatientConsultation_dealStatus_idx`(`dealStatus`),
    INDEX `PatientConsultation_patientPhone_idx`(`patientPhone`),
    INDEX `PatientConsultation_storeId_visitDate_idx`(`storeId`, `visitDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `chairCnt` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Store_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreDayLock` (
    `id` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `reportDate` VARCHAR(191) NOT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `lockedById` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,

    INDEX `StoreDayLock_reportDate_idx`(`reportDate`),
    UNIQUE INDEX `StoreDayLock_storeId_reportDate_key`(`storeId`, `reportDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `roles` VARCHAR(191) NOT NULL DEFAULT '["STAFF"]',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `nursingRole` VARCHAR(191) NULL,
    `marketingSubDept` VARCHAR(191) NULL,
    `customFormConfig` TEXT NULL,
    `storeId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `extraDepartmentIds` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_account_key`(`account`),
    INDEX `User_departmentId_idx`(`departmentId`),
    INDEX `User_storeId_idx`(`storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserStoreAccess` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `storeId` VARCHAR(191) NOT NULL,
    `roles` VARCHAR(191) NOT NULL DEFAULT '["STAFF"]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserStoreAccess_storeId_idx`(`storeId`),
    UNIQUE INDEX `UserStoreAccess_userId_storeId_key`(`userId`, `storeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChannelSource` ADD CONSTRAINT `ChannelSource_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConfigFlag` ADD CONSTRAINT `ConfigFlag_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationReport` ADD CONSTRAINT `ConsultationReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationViewPermission` ADD CONSTRAINT `ConsultationViewPermission_grantedById_fkey` FOREIGN KEY (`grantedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConsultationViewPermission` ADD CONSTRAINT `ConsultationViewPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HrReport` ADD CONSTRAINT `HrReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminReport` ADD CONSTRAINT `AdminReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyReportTemplate` ADD CONSTRAINT `DailyReportTemplate_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceHrAdminReport` ADD CONSTRAINT `FinanceHrAdminReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FrontDeskReport` ADD CONSTRAINT `FrontDeskReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicalReport` ADD CONSTRAINT `MedicalReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NursingReport` ADD CONSTRAINT `NursingReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfflineMarketingReport` ADD CONSTRAINT `OfflineMarketingReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OnlineGrowthReport` ADD CONSTRAINT `OnlineGrowthReport_dailyReportId_fkey` FOREIGN KEY (`dailyReportId`) REFERENCES `DailyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientConsultation` ADD CONSTRAINT `PatientConsultation_consultantId_fkey` FOREIGN KEY (`consultantId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientConsultation` ADD CONSTRAINT `PatientConsultation_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreDayLock` ADD CONSTRAINT `StoreDayLock_lockedById_fkey` FOREIGN KEY (`lockedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreDayLock` ADD CONSTRAINT `StoreDayLock_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserStoreAccess` ADD CONSTRAINT `UserStoreAccess_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserStoreAccess` ADD CONSTRAINT `UserStoreAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
INSERT INTO `Department` (`code`, `createdAt`, `id`, `name`, `updatedAt`) VALUES
('CONSULTATION', '2025-12-17 19:36:09', 'cmjaewjqq0000p8bidt3kbbec', '咨询部', '2025-12-17 19:36:09'),
('OFFLINE_MARKETING', '2025-12-17 19:36:09', 'cmjaewk6t0001p8biaxwq7y1l', '线下市场', '2025-12-17 19:36:09'),
('FINANCE_HR_ADMIN', '2025-12-17 19:36:09', 'cmjaewk6w0002p8bis94wbri5', '财务', '2025-12-17 19:36:09'),
('MANAGEMENT', '2025-12-17 19:36:09', 'cmjaewk710003p8bi3vp1b6sf', '管理层', '2025-12-17 19:36:09'),
('HR', '2025-12-17 19:36:09', 'cmjaewk740004p8bi3m3k6dv8', '人事行政', '2025-12-17 19:36:09'),
('ONLINE_GROWTH', '2025-12-17 19:36:09', 'cmjaewk7d0005p8bi32n2xvpd', '网络新媒体', '2025-12-17 19:36:09'),
('FRONT_DESK', '2025-12-17 19:36:09', 'cmjaewk7m0006p8bi2n1aup8s', '前台客服', '2025-12-17 19:36:09'),
('MEDICAL', '2025-12-17 19:36:09', 'cmjaewk7q0007p8bi8otrtkrt', '医疗部', '2025-12-17 19:36:09'),
('NURSING', '2025-12-17 19:36:09', 'cmjaewk7s0008p8biksd7sbgm', '护理部', '2025-12-17 19:36:09');

INSERT INTO `Store` (`address`, `chairCnt`, `city`, `code`, `createdAt`, `id`, `isActive`, `name`, `updatedAt`) VALUES
('文山市某某路123号', 10, '文山', 'XJ', '2025-12-17 19:36:10', 'cmjaewkql0009p8bi4i938lcd', 1, '鑫洁口腔', '2025-12-17 19:36:10'),
('文山市城南新区456号', 12, '文山', 'DF-CN', '2025-12-17 19:36:11', 'cmjaewl9e000ap8bijmphhg1l', 1, '德弗口腔城南店', '2025-12-17 19:36:11'),
(NULL, 0, NULL, 'HQ', '2026-01-04 13:24:25', 'cmjzrjunc00001r1fj1zejg0o', 1, '总部', '2026-01-04 13:24:25');

INSERT INTO `DictionaryItem` (`category`, `createdAt`, `id`, `isActive`, `name`, `sortOrder`, `updatedAt`, `value`) VALUES
('AD', '2026-01-03 10:20:44', 'cmjy5jrom0005likdjo8vm2x5', 1, '腾讯AD', 0, '2026-01-03 10:20:44', '腾讯AD'),
('AD', '2026-01-03 10:20:56', 'cmjy5k0sv0006likdroadcjli', 1, '高德AD', 0, '2026-01-03 10:20:56', '高德AD'),
('AD', '2026-01-03 10:21:06', 'cmjy5k8h30007likdn2nw7wkj', 1, '小红书AD', 0, '2026-01-03 10:21:06', '小红书AD'),
('AD', '2026-01-03 10:21:12', 'cmjy5kd940008likdb88a8avj', 1, '百度AD', 0, '2026-01-03 10:21:12', '百度AD'),
('AD', '2026-01-03 10:21:25', 'cmjy5kn7g0009likd1ewpe0fp', 1, '抖音AD', 0, '2026-01-03 10:21:25', '抖音AD'),
('AD', '2026-01-03 10:21:39', 'cmjy5ky3f000alikdsmus2fso', 1, '其它', 0, '2026-01-03 10:21:39', '其它'),
('buy', '2026-01-03 10:23:39', 'cmjy5niav000blikdmy20m6vt', 1, '抖音团购', 0, '2026-01-03 10:23:39', '抖音团购'),
('buy', '2026-01-03 10:23:45', 'cmjy5nmw9000clikdy2nsurvv', 1, '美团团购', 0, '2026-01-03 10:23:45', '美团团购'),
('buy', '2026-01-03 10:23:51', 'cmjy5nrdi000dlikdsym2uohy', 1, '高德团购', 0, '2026-01-03 10:23:51', '高德团购'),
('buy', '2026-01-03 10:23:57', 'cmjy5nw1w000elikd7x105t10', 1, '快手团购', 0, '2026-01-03 10:23:57', '快手团购'),
('buy', '2026-01-03 10:24:05', 'cmjy5o2bm000flikd3cakumn7', 1, '其它', 0, '2026-01-03 10:24:05', '其它'),
('user_roles', '2026-01-11 11:52:29', 'cmk9ockkh0000lv8xgxig9wf9', 1, '员工', 1, '2026-01-11 11:52:29', 'STAFF'),
('user_roles', '2026-01-11 11:52:29', 'cmk9ockrv0001lv8xud65ytbr', 1, '部门负责人', 2, '2026-01-11 11:52:29', 'DEPT_LEAD'),
('user_roles', '2026-01-11 11:52:30', 'cmk9ockwl0002lv8xg38gr606', 1, '财务人员', 3, '2026-01-11 11:52:30', 'FINANCE'),
('user_roles', '2026-01-11 11:52:30', 'cmk9ocl190003lv8xjkn1r9rj', 1, '医疗质控', 4, '2026-01-11 11:52:30', 'MEDICAL_QC'),
('user_roles', '2026-01-11 11:52:30', 'cmk9ocl5w0004lv8xywf94x5e', 1, '店长', 5, '2026-01-11 11:52:30', 'STORE_MANAGER'),
('user_roles', '2026-01-11 11:52:30', 'cmk9oclaj0005lv8xfzjtu1vb', 1, '区域经理', 6, '2026-01-11 11:52:30', 'REGION_MANAGER'),
('user_roles', '2026-01-11 11:52:30', 'cmk9oclf50006lv8xk6e8tcag', 1, '总部管理员', 7, '2026-01-11 11:52:30', 'HQ_ADMIN');

INSERT INTO `ConfigFlag` (`createdAt`, `description`, `id`, `isActive`, `key`, `scope`, `storeId`, `updatedAt`, `value`) VALUES
('2025-12-18 03:18:35', '种植激励开关', 'cmjavf8eg002b6z819qfmigcj', 1, 'implant_incentive', 'GLOBAL', NULL, '2025-12-18 03:18:35', '{"enabled":true,"rate":0.05}'),
('2025-12-18 03:18:35', '正畸激励开关', 'cmjavf8q2002c6z81yl9be8up', 1, 'ortho_incentive', 'GLOBAL', NULL, '2025-12-18 03:18:35', '{"enabled":true,"rate":0.03}'),
('2026-01-15 13:47:02', '部门报表口径角色配置', 'cmkfi79y500019vnx3zy6hp4q', 1, 'DEPT_REPORT_ROLE_BY_DEPT_CODE', 'GLOBAL', NULL, '2026-01-15 13:47:02', '{"FRONT_DESK":"DEPT_LEAD"}');

INSERT INTO `ChannelSource` (`createdAt`, `id`, `isActive`, `name`, `sortOrder`, `storeId`, `updatedAt`) VALUES
('2025-12-18 03:18:29', 'cmjavf46y001o6z81bmdgg9b4', 1, '自然到店', 0, NULL, '2025-12-18 03:18:29'),
('2025-12-18 03:18:30', 'cmjavf4j2001q6z81i3v3nhts', 1, '老客转介绍', 1, NULL, '2025-12-18 03:18:30'),
('2025-12-18 03:18:30', 'cmjavf4uo001s6z81pc1xoptk', 1, '美团/大众点评', 2, NULL, '2025-12-18 03:18:30'),
('2025-12-18 03:18:30', 'cmjavf56b001u6z81idjpn5wc', 1, '抖音', 3, NULL, '2025-12-18 03:18:30'),
('2025-12-18 03:18:31', 'cmjavf5hy001w6z811mcd1vij', 1, '小红书', 4, NULL, '2025-12-18 03:18:31'),
('2025-12-18 03:18:31', 'cmjavf5tl001y6z814ol8ed0l', 1, '微信公众号', 5, NULL, '2025-12-18 03:18:31'),
('2025-12-18 03:18:32', 'cmjavf65500206z81fd1awcyc', 1, '朋友圈广告', 6, NULL, '2025-12-18 03:18:32'),
('2025-12-18 03:18:32', 'cmjavf6gp00226z815iuuitg5', 1, '地推活动', 7, NULL, '2025-12-18 03:18:32'),
('2025-12-18 03:18:32', 'cmjavf6sc00246z81b20ayc3z', 1, '社区合作', 8, NULL, '2025-12-18 03:18:32'),
('2025-12-18 03:18:33', 'cmjavf73y00266z81tel4gj2u', 1, '企业合作', 9, NULL, '2025-12-18 03:18:33'),
('2025-12-18 03:18:33', 'cmjavf7fk00286z81va7wbj9l', 1, '学校合作', 10, NULL, '2025-12-18 03:18:33'),
('2025-12-18 03:18:34', 'cmjavf7r4002a6z81m7t6q9se', 1, '其他', 11, NULL, '2025-12-18 03:18:34');

INSERT INTO `User` (`account`, `createdAt`, `customFormConfig`, `departmentId`, `extraDepartmentIds`, `id`, `isActive`, `marketingSubDept`, `name`, `nursingRole`, `passwordHash`, `roles`, `storeId`, `updatedAt`) VALUES
('15288614008', '2025-12-19 03:20:41', '{"enabledFields":["totalReceived","totalRefund","netCashFlow","prepaidNet","arrearsBalance","arrearsAge030","arrearsAge3160","arrearsAge60Plus","costMaterial","costProcessing","costLabor","costMarketing","costRentUtility","costOther","adjustExceptionTop","largeRefund","highValueException","paymentPlan","inventoryAlert"],"fieldLabels":{},"customFields":[],"hiddenSections":[]}', 'cmjaewk6w0002p8bis94wbri5', NULL, 'cmjcaxsr90001kdmfl4515oxx', 1, NULL, '何鑫鑫', NULL, '$2a$10$xlbSYEhSmK2Wx13KlHFEHe8Dp1eZhQAmEcfbalppfOWChUW.jtQpq', '["FINANCE"]', NULL, '2025-12-26 11:50:53'),
('19048674868', '2025-12-19 07:26:01', NULL, 'cmjaewjqq0000p8bidt3kbbec', NULL, 'cmjcjpael0003we3p0i6trpw3', 1, NULL, '胡代蝉', NULL, '$2a$10$ucgX8VAhg9mISa8sX9B9n.rszXl.yOEPcUT9uw3gn6IG4ZvMeJtUK', '["STAFF"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:48:52'),
('18508766777', '2025-12-26 06:29:58', NULL, 'cmjaewk710003p8bi3vp1b6sf', NULL, 'cmjmhs68q0001ieh1rys9bd8f', 1, NULL, '胡毅', NULL, '$2a$10$NBN4agtRJ0xb2lxwKYZgs.GsLguWYrpsj5xixT464I9OG2q60Ouay', '["STAFF"]', 'cmjaewl9e000ap8bijmphhg1l', '2025-12-26 11:49:09'),
('15912374473', '2025-12-19 08:12:01', '{"enabledFields":["totalVisits","firstVisits","returnVisits","dealCount","cashInYuan","avgTicket","implantCount","implantAmount","orthoCount","orthoAmount","restoreCount","restoreAmount","pediatricCount","pediatricAmount","returnAppointment7Days","chairsOpen","chairsUsed","chairUtilization","doctorOnDuty","doctorAbsent","waitTimeOverCount","complaintEvent","complaintProgress","priceException","tomorrowVisitForecast","keyCustomerList","promotionPlan"],"fieldLabels":{},"customFields":[],"hiddenSections":[]}', 'cmjaewk710003p8bi3vp1b6sf', NULL, 'cmjclcgcd0007z8guu2d73vpv', 1, NULL, '何美诗', NULL, '$2a$10$JLaID5810wtk6RKMqi4zWO0tmdXf84yI2YjOk08.fQbQJ.KTnp2CK', '["STORE_MANAGER"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:49:42'),
('19987699602', '2025-12-20 09:37:33', NULL, 'cmjaewk7s0008p8biksd7sbgm', NULL, 'cmje3ub1e0001qir2vikqhx84', 1, NULL, '吴正飞', 'hygienist', '$2a$10$YYgPd8j23AtXONjyfjZqxOa1p1Gbw8IFEBVeDE8QymEJQiSrSSXyq', '["STAFF"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:50:00'),
('15126956210', '2025-12-20 09:44:52', NULL, 'cmjaewk7s0008p8biksd7sbgm', NULL, 'cmje43piw0003qir2kjvbov0i', 1, NULL, '杨佳佳', 'assistant', '$2a$10$bpsni94Vx08SNRJ8.5N4pObYxDbkq26x5i00w.uWsyqzq1na9THRO', '["STAFF"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:50:15'),
('14769678649', '2025-12-19 07:40:15', NULL, 'cmjaewk6t0001p8biaxwq7y1l', NULL, 'cmjck7la40003z8gugwhp63e3', 1, NULL, '农伟', NULL, '$2a$10$/PrsNcwAVjQCPRGTCVhxEusDtwnBWoiUekXC.AZuqEPtipsGLRbBm', '["STAFF"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:50:30'),
('18896280857', '2025-12-19 07:22:19', '{"enabledFields":["newLeadsTotal","leadsDouyin","leadsXiaohongshu","leadsBaidu","leadsWechat","leadsOther","firstResponseCount","firstResponseRate","validLeads","invalidLeads","invalidReason","followingLeads","lostLeads","appointmentsBooked","appointmentsConfirmed","visitsArrived","noShowCount","scriptVersion","topQuestions","competitorInfo"],"fieldLabels":{},"customFields":[],"hiddenSections":[]}', 'cmjaewk7d0005p8bi32n2xvpd', NULL, 'cmjcjkjhx0001we3pkt349kez', 1, NULL, '刘禹沛', NULL, '$2a$10$75LCKWhfJaFnTr4vZkjw8eYMsz995lGl0J6h9k3d1lhPyz1ZciT4u', '["STAFF"]', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 11:50:40'),
('15687566362', '2025-12-19 07:29:59', NULL, 'cmjaewk7m0006p8bi2n1aup8s', NULL, 'cmjcjuek50001bxop8qatav0n', 1, NULL, '王雯琳', NULL, '$2a$10$W8v.nBr6jd0.ulzCLXq0R.tAhJm58IpdQ8rmbxDIBIyrxTuaB2A1.', '["STAFF","DEPT_LEAD"]', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 14:32:14'),
('admin', '2025-12-18 13:20:57', NULL, 'cmjaewk710003p8bi3vp1b6sf', NULL, 'cmjbgxvsj0002ew77aulo7yip', 1, NULL, '何总', NULL, '$2a$10$Ibt5dqx/9bE2W9uyGnbaDehV5K.msFpHTj6OBD9.cdP7Un.EZYei.', '["HQ_ADMIN"]', NULL, '2026-01-09 09:42:42');

INSERT INTO `DailyReportTemplate` (`configJson`, `createdAt`, `departmentId`, `id`, `role`, `schemaId`, `updatedAt`) VALUES
('{"version":2,"containers":[{"id":"core_metrics_core_metrics","type":"general","title":"今日核心数据","fields":[{"id":"leads_today","type":"number","label":"今日建档","required":true,"reportEnabled":true},{"id":"leads_month","type":"number","label":"月建档","required":true,"reportEnabled":true},{"id":"visits_today","type":"number","label":"今日到店","required":true,"reportEnabled":true},{"id":"visits_month","type":"number","label":"本月到店","required":true,"reportEnabled":true},{"id":"deals_today","type":"number","label":"到店成交","required":true,"reportEnabled":true},{"id":"deals_month","type":"number","label":"本月成交","required":true,"reportEnabled":true},{"id":"revenue_today","type":"money","label":"今日业绩","required":true,"reportEnabled":true},{"id":"field_1767435300230","type":"money","label":"补款金额","required":true,"reportEnabled":true},{"id":"field_1767435368366","type":"money","label":"再消费金额","required":true,"reportEnabled":true},{"id":"field_1767435416638","type":"number","label":"今日初诊","required":true,"reportEnabled":true},{"id":"field_1767435427558","type":"number","label":"今日复诊","required":true,"reportEnabled":true},{"id":"field_1767435437205","type":"number","label":"本月初诊","required":true,"reportEnabled":true},{"id":"field_1767435448053","type":"number","label":"本月复诊","required":true,"reportEnabled":true},{"id":"followup_today","type":"number","label":"今日回访","required":true,"reportEnabled":true},{"id":"intentional_tomorrow","type":"number","label":"明日意向顾客","required":true,"reportEnabled":true}],"reportEnabled":true},{"id":"channel_performance_channel_performance","type":"general","title":"渠道表现","fields":[{"id":"field_1767435543408","type":"dynamic_rows","label":"信息流明细","required":false,"rowFields":[{"id":"rf_1767435604685","type":"dynamic_select","label":"渠道名称","dynamicOptionsKey":"AD"},{"id":"rf_1767435704893","type":"number","label":"到店人数"},{"id":"rf_1767435748613","type":"number","label":"成交人数"},{"id":"rf_1767435755253","type":"number","label":"成交金额"}],"addRowLabel":"+ 新增","reportEnabled":true},{"id":"field_1767435768270","type":"dynamic_rows","label":"团购明细","required":false,"rowFields":[{"id":"rf_1767435780837","type":"dynamic_select","label":"渠道明细","dynamicOptionsKey":"buy"},{"id":"rf_1767435850526","type":"number","label":"到店人数"},{"id":"rf_1767435864182","type":"number","label":"成交人数"},{"id":"rf_1767435873678","type":"number","label":"成交金额"}],"addRowLabel":"+ 新增","reportEnabled":true},{"id":"third_party_channels","type":"dynamic_rows","label":"三方渠道明细","rowFields":[{"id":"name","type":"text","label":"渠道名称"},{"id":"visits","type":"number","label":"到店人数"},{"id":"deals","type":"number","label":"成交人数"},{"id":"amount","type":"money","label":"成交金额"}],"reportEnabled":true}],"reportEnabled":true},{"id":"work_summary_work_summary","type":"general","title":"工作总结","fields":[{"id":"main_tasks","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"main_issues","type":"textarea","label":"明日计划","required":true,"reportEnabled":true},{"id":"field_1767435520622","type":"text","label":"备注","required":false,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 10:24:53', 'cmjaewk7d0005p8bi32n2xvpd', 'cmjy5p3rc000hlikdfgyqjcg6', 'STAFF', '', '2026-01-15 13:46:53'),
('{"version":2,"containers":[{"id":"daily_spots","type":"general","title":"多点位清单","fields":[{"id":"spot_details","type":"dynamic_rows","label":"点位明细","rowFields":[{"id":"spot_name","type":"text","label":"点位名称","dynamicOptionsKey":"marketing_spots"},{"id":"valid_leads_phone","type":"number","label":"有效线索(电话)"},{"id":"direct_visits","type":"number","label":"现场引流到诊"},{"id":"visit_deal","type":"number","label":"到诊成交"},{"id":"cash_expected","type":"money","label":"应收"},{"id":"cash_received","type":"money","label":"实收"},{"id":"remark","type":"text","label":"备注","fullWidth":true}],"addRowLabel":"+ 新增点位","reportEnabled":true}],"reportEnabled":true},{"id":"daily_plan","type":"general","title":"计划","fields":[{"id":"today_plan","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"tomorrow_plan","type":"textarea","label":"明日计划","required":true,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 07:02:44', 'cmjaewk6t0001p8biaxwq7y1l', 'cmjxyh4h6000fo7zo5lbvdwhz', 'STAFF', 'expansion', '2026-01-15 13:46:54'),
('{"version":2,"containers":[{"id":"dailyWork_dailyWork","type":"general","title":"今日工作汇报","fields":[{"id":"followUpCount","hint":"总拨打次数","type":"number","label":"今日回访量","required":true,"reportEnabled":true},{"id":"validCallCount","hint":"接通并有效沟通","type":"number","label":"有效通话数","required":true,"reportEnabled":true},{"id":"invalidCallCount","hint":"未接通/挂断","type":"number","label":"无效通话数","reportEnabled":true},{"id":"appointmentCount","hint":"成功预约到店","type":"number","label":"预约人数","required":true,"reportEnabled":true},{"id":"classACount","hint":"高意向、近期可转化","type":"number","label":"A类高意向客户(新增)","required":false,"reportEnabled":true},{"id":"classBCount","hint":"有意向需跟进","type":"number","label":"B类普通客户(新增)","reportEnabled":true},{"id":"classCCount","hint":"长期跟进培育","type":"number","label":"C类待培育客户(新增)","reportEnabled":true},{"id":"todayRecordsCount","hint":"新建客户档案数","type":"number","label":"今日建档量","required":true,"reportEnabled":true},{"id":"dealCount","hint":"今日成交客户数","type":"number","label":"成交人数","required":true,"reportEnabled":true},{"id":"todayExpected","type":"money","label":"当日应收","required":true,"reportEnabled":true},{"id":"todayActual","type":"money","label":"当日实收","required":true,"reportEnabled":true},{"id":"todayProblems","hint":"客户拒接、异议处理等","type":"textarea","label":"今日遇到问题","required":true,"reportEnabled":true},{"id":"tomorrowPlan","hint":"重点客户跟进等","type":"textarea","label":"明日工作计划","required":true,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 07:02:10', 'cmjaewk6t0001p8biaxwq7y1l', 'cmjxyge88000do7zoettstrn0', 'STAFF', 'customerService', '2026-01-15 13:46:54'),
('{"version":2,"containers":[]}', '2026-01-03 07:01:20', 'cmjaewk7s0008p8biksd7sbgm', 'cmjxyfc970005o7zoyroyyhyj', 'STAFF', 'assistantLead', '2026-01-15 13:26:45'),
('{"version":2,"containers":[]}', '2026-01-03 07:01:35', 'cmjaewk7s0008p8biksd7sbgm', 'cmjxyfng70009o7zoaemzuv7x', 'STAFF', 'hygienistLead', '2026-01-15 13:26:45'),
('{"version":2,"containers":[]}', '2026-01-03 07:01:45', 'cmjaewk7s0008p8biksd7sbgm', 'cmjxyfuy0000bo7zox9trmiml', 'STAFF', 'headNurse', '2026-01-15 13:26:45'),
('{"version":2,"containers":[{"id":"daily_daily","type":"general","title":"店长经营日报","fields":[{"id":"totalVisits","type":"number","label":"当日总到诊","required":true,"reportEnabled":false},{"id":"firstVisits","type":"number","label":"首诊人数","required":true,"reportEnabled":false},{"id":"returnVisits","type":"number","label":"复诊人数","required":true,"reportEnabled":false},{"id":"dealCount","type":"number","label":"当日成交人数","required":true,"reportEnabled":false},{"id":"cashInYuan","type":"money","label":"实收金额","required":true,"reportEnabled":false},{"id":"avgTicket","type":"money","label":"客单价","reportEnabled":false},{"id":"restoreCount","type":"number","label":"综合-人数","reportEnabled":false},{"id":"restoreAmount","type":"money","label":"综合-金额","reportEnabled":false},{"id":"todayIssues","hint":"请输入...","type":"textarea","label":"今日异常/风险/需协调","reportEnabled":false},{"id":"tomorrowKeyFocus","hint":"请输入...","type":"textarea","label":"明日重点安排","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-04 09:54:19', 'cmjaewk710003p8bi3vp1b6sf', 'cmjzk1n2w0009s9rbbhtk4hic', 'STORE_MANAGER', '', '2026-01-15 13:26:45'),
('{"version":2,"containers":[{"id":"daily_data_daily_data","type":"general","title":"当日总结","fields":[{"id":"receptionTotal","hint":"到咨询台完成初诊沟通的总人数","type":"number","label":"当日接诊人数","required":true,"reportEnabled":true},{"id":"firstVisitCount","type":"number","label":"首诊接诊人数","required":true,"reportEnabled":true},{"id":"returnVisitCount","type":"number","label":"复诊接诊人数","required":true,"reportEnabled":true},{"id":"dealCount","hint":"含定金/预付","type":"number","label":"成交人数","required":true,"reportEnabled":true},{"id":"noDealCount","type":"number","label":"未成交人数","required":false,"reportEnabled":true},{"id":"cashInYuan","hint":"个人贡献口径","type":"money","label":"当日实收金额","required":true,"reportEnabled":true},{"id":"noDealReason","hint":"请详细填写未成交的具体原因，如价格、方案、信任度等","type":"textarea","label":"未成交原因说明","required":false,"reportEnabled":true},{"id":"today_plan","hint":"今日工作完成情况总结","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"tomorrow_plan","hint":"明日重点跟进客户及工作安排","type":"textarea","label":"明日计划","required":true,"reportEnabled":true},{"id":"daily_data_remark","hint":"针对今日数据的特殊说明","type":"textarea","label":"备注","reportEnabled":true}],"reportEnabled":true},{"id":"data_detail_data_detail","type":"general","title":"数据详细","fields":[{"id":"implant_visit","type":"number","label":"种植-到诊","required":false,"reportEnabled":true},{"id":"implant_deal","type":"number","label":"种植-成交","required":false,"reportEnabled":true},{"id":"implant_amount","type":"money","label":"种植-金额","required":false,"reportEnabled":true},{"id":"ortho_visit","type":"number","label":"正畸-到诊","required":false,"reportEnabled":true},{"id":"ortho_deal","type":"number","label":"正畸-成交","required":false,"reportEnabled":true},{"id":"ortho_amount","type":"money","label":"正畸-金额","required":false,"reportEnabled":true},{"id":"restore_visit","type":"number","label":"修复/综合-到诊","required":false,"reportEnabled":true},{"id":"restore_deal","type":"number","label":"修复/综合-成交","required":false,"reportEnabled":true},{"id":"restore_amount","type":"money","label":"修复/综合-金额","required":false,"reportEnabled":true},{"id":"pediatric_visit","type":"number","label":"儿牙-到诊","required":false,"reportEnabled":true},{"id":"pediatric_deal","type":"number","label":"儿牙-成交","required":false,"reportEnabled":true},{"id":"pediatric_amount","type":"money","label":"儿牙-金额","required":false,"reportEnabled":true},{"id":"other_visit","type":"number","label":"其他-到诊","required":false,"reportEnabled":true},{"id":"other_deal","type":"number","label":"其他-成交","required":false,"reportEnabled":true},{"id":"other_amount","type":"money","label":"其他-金额","required":false,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-04 09:45:47', 'cmjaewjqq0000p8bidt3kbbec', 'cmjzjqo7m0005s9rbdmyl3avm', 'STAFF', '', '2026-01-15 13:46:55'),
('{"version":2,"containers":[{"id":"container_1767437331389","type":"general","title":"今日主要","fields":[{"id":"field_1767437332252","type":"dynamic_rows","label":"患者","required":false,"rowFields":[{"id":"rf_1767437342949","type":"text","label":"名称"},{"id":"rf_1767437356061","type":"text","label":"操作"}],"addRowLabel":"+ 新增记录","reportEnabled":true}],"reportEnabled":true},{"id":"container_1767437400765","type":"general","title":"总结","fields":[{"id":"field_1767437407861","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"field_1767437415788","type":"textarea","label":"明日计划","required":true,"reportEnabled":true},{"id":"field_1767438013932","type":"text","label":"备注","required":false,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 07:01:05', 'cmjaewk7s0008p8biksd7sbgm', 'cmjxyf0i40003o7zoonjya3r0', 'STAFF', 'assistant', '2026-01-15 13:46:56'),
('{"version":2,"containers":[{"id":"container_1767537144538","type":"general","title":"总结","fields":[{"id":"field_1767537155265","type":"textarea","label":"今日总结","required":false,"reportEnabled":false},{"id":"field_1767537163906","type":"textarea","label":"明日计划","required":false,"reportEnabled":false}],"reportEnabled":false}]}', '2026-01-04 14:32:53', 'cmjaewk7m0006p8bi2n1aup8s', 'cmjztzvzr00051r1f1i3h17h8', 'STAFF', '', '2026-01-15 13:26:46'),
('{"version":2,"containers":[{"id":"attendance_mgmt_attendance_mgmt","type":"general","title":"一、考勤管理","fields":[{"id":"att_expected","type":"number","label":"应到人数","required":true,"reportEnabled":true},{"id":"att_actual","type":"number","label":"实到人数","required":true,"reportEnabled":true},{"id":"att_rest","type":"number","label":"休息人数","required":true,"reportEnabled":true},{"id":"att_late_early_count","type":"number","label":"迟到/早退人数","required":true,"reportEnabled":true},{"id":"att_late_early_details","hint":"点击添加记录每位迟到/早退人员信息","type":"dynamic_rows","label":"迟到/早退明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"type","type":"text","label":"类型"},{"id":"reason","type":"text","label":"原因"},{"id":"duration","type":"text","label":"时长"}],"reportEnabled":true},{"id":"att_absent","type":"number","label":"旷工人数","required":true,"reportEnabled":true},{"id":"att_leave_count","type":"number","label":"请假人数","required":true,"reportEnabled":true},{"id":"att_leave_details","hint":"点击添加记录每位请假人员信息","type":"dynamic_rows","label":"请假明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"reason","type":"text","label":"请假原因"},{"id":"duration","type":"text","label":"请假时长"}],"reportEnabled":true},{"id":"att_overtime_count","type":"number","label":"加班人数","reportEnabled":true},{"id":"att_overtime_details","hint":"点击添加记录每位加班人员信息","type":"dynamic_rows","label":"加班明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"duration","type":"text","label":"加班时长"}],"reportEnabled":true},{"id":"att_other","type":"textarea","label":"其他说明","reportEnabled":true}],"reportEnabled":true},{"id":"recruit_board_recruit_board","type":"general","title":"二、招聘看板","fields":[{"id":"rec_greetings","type":"number","label":"打招呼人数","reportEnabled":true},{"id":"rec_intentional","type":"number","label":"意向人数","reportEnabled":true},{"id":"rec_positions","hint":"例：医生、咨询、前台","type":"text","label":"招聘岗位","reportEnabled":true},{"id":"rec_results","type":"textarea","label":"招聘结果","reportEnabled":true},{"id":"rec_interviews","type":"number","label":"面试人数","reportEnabled":true},{"id":"rec_interview_results","type":"textarea","label":"面试结果","reportEnabled":true},{"id":"rec_supplement","type":"textarea","label":"其他补充","reportEnabled":true}],"reportEnabled":true},{"id":"personnel_mgmt_onboardivider","type":"general","title":"【入职管理】","fields":[{"id":"p_onboard_details","hint":"记录今日入职的人员信息","type":"dynamic_rows","label":"今日入职人员","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"dept","type":"text","label":"入职部门"},{"id":"time","type":"text","label":"入职时间"},{"id":"process","type":"text","label":"流程进度"}],"reportEnabled":true},{"id":"p_onboard_note","hint":"其他需要说明的入职事项","type":"textarea","label":"入职备注","reportEnabled":true}],"reportEnabled":true},{"id":"personnel_mgmt_contract_divider","type":"general","title":"【合同签订】","fields":[{"id":"p_contract_details","hint":"记录今日签订合同的人员（含试岗期、试用期、免责协议、劳动合同等）","type":"dynamic_rows","label":"今日合同签订","rowFields":[{"id":"name","type":"text","label":"员工姓名"},{"id":"contract_type","type":"text","label":"合同类型"},{"id":"note","type":"text","label":"备注"}],"reportEnabled":true}],"reportEnabled":true},{"id":"personnel_mgmt_resign_divider","type":"general","title":"【离职管理】","fields":[{"id":"p_resign_details","hint":"记录离职人员及交接情况","type":"dynamic_rows","label":"今日离职人员","rowFields":[{"id":"name","type":"text","label":"离职人员"},{"id":"dept","type":"text","label":"离职部门"},{"id":"handover","type":"text","label":"交接情况"}],"reportEnabled":true},{"id":"p_resign_note","hint":"其他需要说明的离职事项","type":"textarea","label":"离职备注","reportEnabled":true},{"id":"p_other","type":"textarea","label":"其他人事事项","reportEnabled":true}],"reportEnabled":true}]}', '2026-01-07 02:51:28', 'cmjaewk740004p8bi3m3k6dv8', 'cmk3f9ebp00019tnpuw676jzm', 'STAFF', '', '2026-01-15 13:46:56'),
('{"version":2,"containers":[{"id":"container_1767429352155","type":"general","title":"今日数据","fields":[{"id":"field_1767429365660","type":"number","label":"洁牙接诊","required":true,"reportEnabled":true},{"id":"field_1767429400083","type":"number","label":"开发","required":true,"reportEnabled":true},{"id":"field_1767430160195","type":"money","label":"个人产出","required":true,"reportEnabled":true},{"id":"field_1767430135979","type":"textarea","label":"未开发成功原因","required":true,"reportEnabled":true}],"reportEnabled":true},{"id":"container_1767430337539","type":"general","title":"总结","fields":[{"id":"field_1767430343972","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"field_1767430353723","type":"textarea","label":"明日计划","required":true,"reportEnabled":true},{"id":"field_1767438024692","type":"text","label":"备注","required":false,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 07:01:28', 'cmjaewk7s0008p8biksd7sbgm', 'cmjxyfhut0007o7zoyxjzhzwf', 'STAFF', 'hygienist', '2026-01-15 13:46:59'),
('{"version":2,"containers":[{"id":"core_metrics_core_metrics","type":"general","title":"今日核心数据","fields":[{"id":"leads_today","type":"number","label":"今日建档","required":true,"reportEnabled":false},{"id":"leads_month","type":"number","label":"月建档","required":true,"reportEnabled":false},{"id":"visits_today","type":"number","label":"今日到店","required":true,"reportEnabled":false},{"id":"visits_month","type":"number","label":"本月到店","required":true,"reportEnabled":false},{"id":"deals_today","type":"number","label":"到店成交","required":true,"reportEnabled":false},{"id":"deals_month","type":"number","label":"本月成交","required":true,"reportEnabled":false},{"id":"revenue_today","type":"money","label":"今日业绩","required":true,"reportEnabled":false},{"id":"followup_today","type":"number","label":"今日回访","required":true,"reportEnabled":false},{"id":"intentional_tomorrow","type":"number","label":"明日意向顾客","required":true,"reportEnabled":false}],"reportEnabled":false},{"id":"channel_performance_channel_performance","type":"general","title":"渠道表现","fields":[{"id":"dy_v","type":"number","label":"抖音-到店","reportEnabled":false},{"id":"dy_d","type":"number","label":"抖音-成交","reportEnabled":false},{"id":"dy_a","type":"money","label":"抖音-金额","reportEnabled":false},{"id":"third_party_channels","type":"dynamic_rows","label":"三方渠道明细","rowFields":[{"id":"name","type":"text","label":"渠道名称"},{"id":"visits","type":"number","label":"到店人数"},{"id":"deals","type":"number","label":"成交人数"},{"id":"amount","type":"money","label":"成交金额"}],"reportEnabled":false},{"id":"gd_v","type":"number","label":"高德-到店","reportEnabled":false},{"id":"gd_d","type":"number","label":"高德-成交","reportEnabled":false},{"id":"gd_a","type":"money","label":"高德-金额","reportEnabled":false},{"id":"ref_v","type":"number","label":"介绍-到店","reportEnabled":false},{"id":"ref_d","type":"number","label":"介绍-成交","reportEnabled":false},{"id":"ref_a","type":"money","label":"介绍-金额","reportEnabled":false},{"id":"ads_v","type":"number","label":"信息流-到店","reportEnabled":false},{"id":"ads_d","type":"number","label":"信息流-成交","reportEnabled":false},{"id":"ads_a","type":"money","label":"信息流-金额","reportEnabled":false},{"id":"chan_balance","type":"money","label":"补款金额","reportEnabled":false},{"id":"chan_respend","type":"money","label":"再消费金额","reportEnabled":false}],"reportEnabled":false},{"id":"work_summary_work_summary","type":"general","title":"工作总结","fields":[{"id":"main_tasks","type":"textarea","label":"主要工作","required":true,"reportEnabled":false},{"id":"main_issues","type":"textarea","label":"主要问题","required":true,"reportEnabled":false}],"reportEnabled":false},{"id":"tomorrow_plan_tomorrow_plan","type":"general","title":"明日计划","fields":[{"id":"primary_task","type":"textarea","label":"首要任务","required":true,"reportEnabled":false},{"id":"core_goal","hint":"请详细描述明日要达成的业务指标","type":"textarea","label":"核心目标","required":true,"reportEnabled":false},{"id":"daily_notes","type":"textarea","label":"备注","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:08:45', 'cmjaewk7d0005p8bi32n2xvpd', 'cmkfgu1y50001tqx4mlxjy94m', 'DEPT_LEAD', '', '2026-01-15 13:26:46'),
('{"version":2,"containers":[{"id":"teamSummary_teamSummary","type":"general","title":"一、团队汇总","fields":[{"id":"teamReceptionTotal","type":"number","label":"组到诊总数","required":true,"reportEnabled":false},{"id":"teamFirstVisit","type":"number","label":"首诊人数","required":true,"reportEnabled":false},{"id":"teamReturnVisit","type":"number","label":"复诊人数","required":true,"reportEnabled":false},{"id":"teamDealCount","type":"number","label":"组成交人数","required":true,"reportEnabled":false},{"id":"teamCashInYuan","type":"money","label":"组成交金额","required":true,"reportEnabled":false},{"id":"teamAvgTicket","type":"money","label":"客单价","reportEnabled":false},{"id":"implantRatio","type":"number","label":"种植占比","suffix":"%","reportEnabled":false},{"id":"orthoRatio","type":"number","label":"正畸占比","suffix":"%","reportEnabled":false},{"id":"restoreRatio","type":"number","label":"综合占比","suffix":"%","reportEnabled":false},{"id":"pediatricRatio","type":"number","label":"儿牙占比","suffix":"%","reportEnabled":false}],"reportEnabled":false},{"id":"funnelLayers_funnelLayers","type":"general","title":"二、漏斗分层","fields":[{"id":"highIntentNoDeal","hint":"可约二次面谈","type":"number","label":"高意向未成交人数","required":true,"reportEnabled":false},{"id":"midIntentNoDeal","hint":"需内容教育","type":"number","label":"中意向未成交人数","required":true,"reportEnabled":false},{"id":"lowIntentNoDeal","hint":"仅维护","type":"number","label":"低意向未成交人数","required":true,"reportEnabled":false},{"id":"todayNewNoDeal","type":"number","label":"今日新增未成交","required":true,"reportEnabled":false},{"id":"historyNoDealCleared","type":"number","label":"历史未成交清理","required":true,"reportEnabled":false}],"reportEnabled":false},{"id":"alerts_alerts","type":"general","title":"三、异常预警","fields":[{"id":"lowConversionReason","hint":"至少1条","type":"textarea","label":"转化率低于目标原因","reportEnabled":false},{"id":"lowConversionAction","hint":"至少2条","type":"textarea","label":"明日改进动作","reportEnabled":false},{"id":"bigProjectGapReason","type":"textarea","label":"大项目空白原因","reportEnabled":false},{"id":"bigProjectAction","hint":"谁负责、何时会诊","type":"textarea","label":"大项目安排","reportEnabled":false},{"id":"complaintEvent","type":"textarea","label":"客诉/纠纷事件","reportEnabled":false},{"id":"complaintProgress","type":"textarea","label":"处理节点","reportEnabled":false}],"reportEnabled":false},{"id":"tomorrowPlan_tomorrowPlan","type":"general","title":"四、明日排班与重点战役","fields":[{"id":"keyCustomerList","hint":"姓名/项目/金额/阻力点/责任人/约见时间","type":"textarea","label":"明日重点客户清单","required":true,"reportEnabled":false},{"id":"doctorConsultSchedule","hint":"医生/时段/客户","type":"textarea","label":"医生会诊安排","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:08:52', 'cmjaewjqq0000p8bidt3kbbec', 'cmkfgu7hl0003tqx46bu6qfgt', 'DEPT_LEAD', '', '2026-01-15 13:26:46'),
('{"version":2,"containers":[{"id":"module_a_module_a","type":"general","title":"成本支出","fields":[{"id":"exp_materials","type":"money","label":"材料费","reportEnabled":false},{"id":"exp_marketing","type":"money","label":"市场部支出","reportEnabled":false},{"id":"exp_daily","type":"money","label":"日常支出","reportEnabled":false},{"id":"exp_online","type":"money","label":"网络部支出","reportEnabled":false},{"id":"exp_processing","type":"money","label":"加工费","reportEnabled":false},{"id":"exp_refund","type":"money","label":"退费支出","reportEnabled":false},{"id":"exp_water","type":"money","label":"水费","reportEnabled":false},{"id":"exp_electricity","type":"money","label":"电费","reportEnabled":false}],"reportEnabled":false},{"id":"module_b_module_b","type":"general","title":"总支出","fields":[{"id":"pay_wechat","type":"money","label":"微信支出","reportEnabled":false},{"id":"pay_cash","type":"money","label":"现金支出","reportEnabled":false},{"id":"pay_public","type":"money","label":"对公支出","reportEnabled":false}],"reportEnabled":false},{"id":"module_c_module_c","type":"general","title":"总收入","fields":[{"id":"inc_wechat","type":"money","label":"微信（工作机）收入","reportEnabled":false},{"id":"inc_cash","type":"money","label":"现金收入","reportEnabled":false},{"id":"inc_med","type":"money","label":"医保卡收入","reportEnabled":false},{"id":"inc_pos","type":"money","label":"刷卡机收入","reportEnabled":false},{"id":"inc_platform","type":"money","label":"平台收入","reportEnabled":false},{"id":"inc_public","type":"money","label":"对公收入","reportEnabled":false}],"reportEnabled":false},{"id":"module_d_module_d","type":"general","title":"大项","fields":[{"id":"risk_control_desc","type":"textarea","label":"风险控制说明","reportEnabled":false},{"id":"large_refund_reason","type":"textarea","label":"大额退费原因","reportEnabled":false},{"id":"other_notes","type":"textarea","label":"备注","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:08:58', 'cmjaewk6w0002p8bis94wbri5', 'cmkfgubmw0005tqx448y1wy3u', 'DEPT_LEAD', '', '2026-01-15 13:26:46'),
('{"version":2,"containers":[{"id":"treatment_treatment","type":"general","title":"一、诊疗情况","fields":[{"id":"patientsTotal","type":"number","label":"接诊患者总数","required":true,"reportEnabled":false},{"id":"patientsFirst","type":"number","label":"初诊患者","required":true,"reportEnabled":false},{"id":"patientsReturn","type":"number","label":"复诊患者","required":true,"reportEnabled":false},{"id":"implantCases","type":"number","label":"种植手术台数","reportEnabled":false},{"id":"orthoCases","type":"number","label":"正畸调整人数","reportEnabled":false},{"id":"restoreCases","type":"number","label":"修复治疗人数","reportEnabled":false},{"id":"pediatricCases","type":"number","label":"儿牙治疗人数","reportEnabled":false},{"id":"emergencyCases","type":"number","label":"急诊处理人数","reportEnabled":false}],"reportEnabled":false},{"id":"quality_quality","type":"general","title":"二、医疗质量","fields":[{"id":"planOutputCount","type":"number","label":"治疗方案输出数","required":true,"reportEnabled":false},{"id":"consultationCount","type":"number","label":"会诊次数","reportEnabled":false},{"id":"complicationCount","type":"number","label":"并发症/不良反应例数","reportEnabled":false},{"id":"complicationDetail","type":"textarea","label":"并发症详情","reportEnabled":false}],"reportEnabled":false},{"id":"tomorrow_tomorrow","type":"general","title":"三、明日计划","fields":[{"id":"tomorrowSurgery","type":"textarea","label":"明日手术安排","reportEnabled":false},{"id":"tomorrowConsult","type":"textarea","label":"明日会诊安排","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:19:47', 'cmjaewk7q0007p8bi8otrtkrt', 'cmkfh88y2000btqx4668ld54p', 'DEPT_LEAD', '', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"assistWork_assistWork","type":"general","title":"一、配台工作","fields":[{"id":"assistTotal","type":"number","label":"今日配台总次数","required":true,"reportEnabled":false},{"id":"implantAssist","type":"number","label":"种植配台次数","reportEnabled":false},{"id":"orthoAssist","type":"number","label":"正畸配台次数","reportEnabled":false},{"id":"restoreAssist","type":"number","label":"修复配台次数","reportEnabled":false},{"id":"pediatricAssist","type":"number","label":"儿牙配台次数","reportEnabled":false},{"id":"rootCanalAssist","type":"number","label":"根管配台次数","reportEnabled":false},{"id":"surgeryAssist","type":"number","label":"外科手术配台次数","reportEnabled":false},{"id":"otherAssist","type":"number","label":"其他配台次数","reportEnabled":false}],"reportEnabled":false},{"id":"sterilization_sterilization","type":"general","title":"二、消毒灭菌","fields":[{"id":"sterilizerCycles","type":"number","label":"灭菌锅运行次数","required":true,"reportEnabled":false},{"id":"instrumentPacks","type":"number","label":"器械包处理数量","required":true,"reportEnabled":false},{"id":"sterilizationIssue","hint":"如有异常请详细记录","type":"textarea","label":"灭菌异常情况","reportEnabled":false}],"reportEnabled":false},{"id":"materials_materials","type":"general","title":"三、器械与耗材","fields":[{"id":"materialShortage","hint":"缺什么、影响哪些诊疗","type":"textarea","label":"物料短缺情况","reportEnabled":false},{"id":"equipmentIssue","hint":"设备名称、故障描述","type":"textarea","label":"设备异常情况","reportEnabled":false},{"id":"consumableIncidents","hint":"过期/污染/损坏等","type":"number","label":"耗材异常事件","reportEnabled":false}],"reportEnabled":false},{"id":"workload_workload","type":"general","title":"四、工作量与加班","fields":[{"id":"doctorsAssisted","type":"number","label":"配合医生人数","required":true,"reportEnabled":false},{"id":"overtimeMinutes","type":"number","label":"加班时长（分钟）","reportEnabled":false},{"id":"overtimeReason","type":"textarea","label":"加班原因","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:19:54', 'cmjaewk7s0008p8biksd7sbgm', 'cmkfh8e13000dtqx42qfbmrvj', 'DEPT_LEAD', 'assistant', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"assistWork_assistWork","type":"general","title":"一、配台工作","fields":[{"id":"assistTotal","type":"number","label":"今日配台总次数","required":true,"reportEnabled":false},{"id":"implantAssist","type":"number","label":"种植配台次数","reportEnabled":false},{"id":"orthoAssist","type":"number","label":"正畸配台次数","reportEnabled":false},{"id":"restoreAssist","type":"number","label":"修复配台次数","reportEnabled":false},{"id":"pediatricAssist","type":"number","label":"儿牙配台次数","reportEnabled":false},{"id":"rootCanalAssist","type":"number","label":"根管配台次数","reportEnabled":false},{"id":"surgeryAssist","type":"number","label":"外科手术配台次数","reportEnabled":false},{"id":"otherAssist","type":"number","label":"其他配台次数","reportEnabled":false}],"reportEnabled":false},{"id":"sterilization_sterilization","type":"general","title":"二、消毒灭菌","fields":[{"id":"sterilizerCycles","type":"number","label":"灭菌锅运行次数","required":true,"reportEnabled":false},{"id":"instrumentPacks","type":"number","label":"器械包处理数量","required":true,"reportEnabled":false},{"id":"sterilizationIssue","hint":"如有异常请详细记录","type":"textarea","label":"灭菌异常情况","reportEnabled":false}],"reportEnabled":false},{"id":"materials_materials","type":"general","title":"三、器械与耗材","fields":[{"id":"materialShortage","hint":"缺什么、影响哪些诊疗","type":"textarea","label":"物料短缺情况","reportEnabled":false},{"id":"equipmentIssue","hint":"设备名称、故障描述","type":"textarea","label":"设备异常情况","reportEnabled":false},{"id":"consumableIncidents","hint":"过期/污染/损坏等","type":"number","label":"耗材异常事件","reportEnabled":false}],"reportEnabled":false},{"id":"workload_workload","type":"general","title":"四、工作量与加班","fields":[{"id":"doctorsAssisted","type":"number","label":"配合医生人数","required":true,"reportEnabled":false},{"id":"overtimeMinutes","type":"number","label":"加班时长（分钟）","reportEnabled":false},{"id":"overtimeReason","type":"textarea","label":"加班原因","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:03', 'cmjaewk7s0008p8biksd7sbgm', 'cmkfh8krc000ftqx4smsdulgi', 'DEPT_LEAD', 'assistantLead', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"cleaningWork_cleaningWork","type":"general","title":"一、洁牙工作","fields":[{"id":"cleaningTotal","type":"number","label":"今日洁牙人数","required":true,"reportEnabled":false},{"id":"deepCleaningCount","type":"number","label":"深度洁牙人数","reportEnabled":false},{"id":"perioTherapyCount","type":"number","label":"牙周治疗人数","reportEnabled":false},{"id":"polishingCount","type":"number","label":"抛光人数","reportEnabled":false},{"id":"fluorideCount","type":"number","label":"涂氟人数","reportEnabled":false}],"reportEnabled":false},{"id":"revenue_revenue","type":"general","title":"二、业绩统计","fields":[{"id":"revenueTotal","type":"money","label":"今日业绩金额","required":true,"reportEnabled":false},{"id":"avgRevenuePerPatient","type":"money","label":"人均消费","reportEnabled":false}],"reportEnabled":false},{"id":"referral_referral","type":"general","title":"三、转诊情况","fields":[{"id":"referralToDoctor","hint":"发现需要进一步治疗的患者","type":"number","label":"转诊给医生人数","required":true,"reportEnabled":false},{"id":"referralReason","hint":"牙周病/龋齿/正畸需求等","type":"textarea","label":"转诊原因说明","reportEnabled":false},{"id":"followupAppointment","type":"number","label":"预约复诊人数","reportEnabled":false}],"reportEnabled":false},{"id":"patientFeedback_patientFeedback","type":"general","title":"四、患者反馈","fields":[{"id":"satisfiedCount","type":"number","label":"满意患者数","reportEnabled":false},{"id":"complaintCount","type":"number","label":"不满/投诉数","reportEnabled":false},{"id":"complaintDetail","type":"textarea","label":"投诉详情","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:07', 'cmjaewk7s0008p8biksd7sbgm', 'cmkfh8o61000htqx4g7igzzfc', 'DEPT_LEAD', 'hygienist', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"daily_daily","type":"general","title":"店长经营日报","fields":[{"id":"totalVisits","type":"number","label":"当日总到诊","required":true,"reportEnabled":false},{"id":"firstVisits","type":"number","label":"首诊人数","required":true,"reportEnabled":false},{"id":"returnVisits","type":"number","label":"复诊人数","required":true,"reportEnabled":false},{"id":"dealCount","type":"number","label":"当日成交人数","required":true,"reportEnabled":false},{"id":"cashInYuan","type":"money","label":"实收金额","required":true,"reportEnabled":false},{"id":"avgTicket","type":"money","label":"客单价","reportEnabled":false},{"id":"restoreCount","type":"number","label":"综合-人数","reportEnabled":false},{"id":"restoreAmount","type":"money","label":"综合-金额","reportEnabled":false},{"id":"returnAppointment7Days","hint":"未来7天","type":"number","label":"复诊预约锁定人数","required":true,"reportEnabled":false},{"id":"todayIssues","hint":"请输入...","type":"textarea","label":"今日异常/风险/需协调","reportEnabled":false},{"id":"tomorrowKeyFocus","hint":"请输入...","type":"textarea","label":"明日重点安排","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:19:19', 'cmjaewk710003p8bi3vp1b6sf', 'cmkfh7n270007tqx4p6jkkt4v', 'DEPT_LEAD', '', '2026-01-15 13:26:46'),
('{"version":2,"containers":[{"id":"assistWork_assistWork","type":"general","title":"一、配台工作","fields":[{"id":"assistTotal","type":"number","label":"今日配台总次数","required":true,"reportEnabled":false},{"id":"implantAssist","type":"number","label":"种植配台次数","reportEnabled":false},{"id":"orthoAssist","type":"number","label":"正畸配台次数","reportEnabled":false},{"id":"restoreAssist","type":"number","label":"修复配台次数","reportEnabled":false},{"id":"pediatricAssist","type":"number","label":"儿牙配台次数","reportEnabled":false},{"id":"rootCanalAssist","type":"number","label":"根管配台次数","reportEnabled":false},{"id":"surgeryAssist","type":"number","label":"外科手术配台次数","reportEnabled":false},{"id":"otherAssist","type":"number","label":"其他配台次数","reportEnabled":false}],"reportEnabled":false},{"id":"sterilization_sterilization","type":"general","title":"二、消毒灭菌","fields":[{"id":"sterilizerCycles","type":"number","label":"灭菌锅运行次数","required":true,"reportEnabled":false},{"id":"instrumentPacks","type":"number","label":"器械包处理数量","required":true,"reportEnabled":false},{"id":"sterilizationIssue","hint":"如有异常请详细记录","type":"textarea","label":"灭菌异常情况","reportEnabled":false}],"reportEnabled":false},{"id":"materials_materials","type":"general","title":"三、器械与耗材","fields":[{"id":"materialShortage","hint":"缺什么、影响哪些诊疗","type":"textarea","label":"物料短缺情况","reportEnabled":false},{"id":"equipmentIssue","hint":"设备名称、故障描述","type":"textarea","label":"设备异常情况","reportEnabled":false},{"id":"consumableIncidents","hint":"过期/污染/损坏等","type":"number","label":"耗材异常事件","reportEnabled":false}],"reportEnabled":false},{"id":"workload_workload","type":"general","title":"四、工作量与加班","fields":[{"id":"doctorsAssisted","type":"number","label":"配合医生人数","required":true,"reportEnabled":false},{"id":"overtimeMinutes","type":"number","label":"加班时长（分钟）","reportEnabled":false},{"id":"overtimeReason","type":"textarea","label":"加班原因","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:20', 'cmjaewk7s0008p8biksd7sbgm', 'cmkfh8yba000ltqx4fe2vzf7j', 'DEPT_LEAD', 'headNurse', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"daily_spots","type":"general","title":"多点位清单","fields":[{"id":"spot_details","type":"dynamic_rows","label":"点位明细","rowFields":[{"id":"spot_name","type":"dynamic_select","label":"点位名称","dynamicOptionsKey":"marketing_spots"},{"id":"valid_leads_phone","type":"number","label":"有效线索(电话)"},{"id":"direct_visits","type":"number","label":"现场引流到诊"},{"id":"visit_deal","type":"number","label":"到诊成交"},{"id":"cash_expected","type":"money","label":"应收"},{"id":"cash_received","type":"money","label":"实收"},{"id":"remark","type":"text","label":"备注","fullWidth":true}],"addRowLabel":"+ 新增点位","reportEnabled":false}],"reportEnabled":false},{"id":"daily_plan","type":"general","title":"计划","fields":[{"id":"today_plan","type":"textarea","label":"今日计划","reportEnabled":false},{"id":"tomorrow_plan","type":"textarea","label":"明日计划","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:29', 'cmjaewk6t0001p8biaxwq7y1l', 'cmkfh958x000ntqx4jmekrfbh', 'DEPT_LEAD', 'expansion', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"dailyWork_dailyWork","type":"general","title":"今日工作汇报","fields":[{"id":"followUpCount","hint":"总拨打次数","type":"number","label":"今日回访量","required":true,"reportEnabled":false},{"id":"validCallCount","hint":"接通并有效沟通","type":"number","label":"有效通话数","required":true,"reportEnabled":false},{"id":"invalidCallCount","hint":"未接通/挂断","type":"number","label":"无效通话数","reportEnabled":false},{"id":"appointmentCount","hint":"成功预约到店","type":"number","label":"预约人数","required":true,"reportEnabled":false},{"id":"classACount","hint":"高意向、近期可转化","type":"number","label":"A类高意向客户(新增)","required":true,"reportEnabled":false},{"id":"classBCount","hint":"有意向需跟进","type":"number","label":"B类普通客户(新增)","reportEnabled":false},{"id":"classCCount","hint":"长期跟进培育","type":"number","label":"C类待培育客户(新增)","reportEnabled":false},{"id":"todayRecordsCount","hint":"新建客户档案数","type":"number","label":"今日建档量","required":true,"reportEnabled":false},{"id":"dealCount","hint":"今日成交客户数","type":"number","label":"成交人数","required":true,"reportEnabled":false},{"id":"todayExpected","type":"money","label":"当日应收","required":true,"reportEnabled":false},{"id":"todayActual","type":"money","label":"当日实收","required":true,"reportEnabled":false},{"id":"todayProblems","hint":"客户拒接、异议处理等","type":"textarea","label":"今日遇到问题","required":true,"reportEnabled":false},{"id":"tomorrowPlan","hint":"重点客户跟进等","type":"textarea","label":"明日工作计划","required":true,"reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:32', 'cmjaewk6t0001p8biaxwq7y1l', 'cmkfh9787000ptqx4sgf2tjb7', 'DEPT_LEAD', 'customerService', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"container_1767434163342","type":"general","title":"今日接诊","fields":[{"id":"field_1767434202958","type":"number","label":"普诊","required":true,"reportEnabled":true},{"id":"field_1767434216574","type":"number","label":"种植","required":true,"reportEnabled":true},{"id":"field_1767434228334","type":"number","label":"正畸","required":true,"reportEnabled":true},{"id":"field_1767434246831","type":"number","label":"复诊","required":false,"reportEnabled":true},{"id":"field_1767434258702","type":"number","label":"初诊预约","required":false,"reportEnabled":true},{"id":"field_1767434267542","type":"text","label":"复诊预约","required":false,"reportEnabled":true}],"reportEnabled":true},{"id":"container_1767434305814","type":"general","title":"总结","fields":[{"id":"field_1767434317806","type":"textarea","label":"今日总结","required":true,"reportEnabled":true},{"id":"field_1767434330694","type":"textarea","label":"明日计划","required":true,"reportEnabled":true},{"id":"field_1767434341366","type":"textarea","label":"备注","required":false,"reportEnabled":true}],"reportEnabled":true}]}', '2026-01-03 07:00:47', 'cmjaewk7q0007p8bi8otrtkrt', 'cmjxyemr60001o7zoso3wjp5x', 'STAFF', '', '2026-01-15 13:47:00'),
('{"version":2,"containers":[{"id":"attendance_mgmt_attendance_mgmt","type":"general","title":"一、考勤管理","fields":[{"id":"att_expected","type":"number","label":"应到人数","required":true,"reportEnabled":false},{"id":"att_actual","type":"number","label":"实到人数","required":true,"reportEnabled":false},{"id":"att_rest","type":"number","label":"休息人数","required":true,"reportEnabled":false},{"id":"att_late_early_count","type":"number","label":"迟到/早退人数","required":true,"reportEnabled":false},{"id":"att_late_early_details","hint":"点击添加记录每位迟到/早退人员信息","type":"dynamic_rows","label":"迟到/早退明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"type","type":"text","label":"类型"},{"id":"reason","type":"text","label":"原因"},{"id":"duration","type":"text","label":"时长"}],"reportEnabled":false},{"id":"att_absent","type":"number","label":"旷工人数","required":true,"reportEnabled":false},{"id":"att_leave_count","type":"number","label":"请假人数","required":true,"reportEnabled":false},{"id":"att_leave_details","hint":"点击添加记录每位请假人员信息","type":"dynamic_rows","label":"请假明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"reason","type":"text","label":"请假原因"},{"id":"duration","type":"text","label":"请假时长"}],"reportEnabled":false},{"id":"att_overtime_count","type":"number","label":"加班人数","reportEnabled":false},{"id":"att_overtime_details","hint":"点击添加记录每位加班人员信息","type":"dynamic_rows","label":"加班明细","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"duration","type":"text","label":"加班时长"}],"reportEnabled":false},{"id":"att_other","type":"textarea","label":"其他说明","reportEnabled":false}],"reportEnabled":false},{"id":"recruit_board_recruit_board","type":"general","title":"二、招聘看板","fields":[{"id":"rec_greetings","type":"number","label":"打招呼人数","reportEnabled":false},{"id":"rec_intentional","type":"number","label":"意向人数","reportEnabled":false},{"id":"rec_positions","hint":"例：医生、咨询、前台","type":"text","label":"招聘岗位","reportEnabled":false},{"id":"rec_results","type":"textarea","label":"招聘结果","reportEnabled":false},{"id":"rec_interviews","type":"number","label":"面试人数","reportEnabled":false},{"id":"rec_interview_results","type":"textarea","label":"面试结果","reportEnabled":false},{"id":"rec_supplement","type":"textarea","label":"其他补充","reportEnabled":false}],"reportEnabled":false},{"id":"personnel_mgmt_onboardivider","type":"general","title":"【入职管理】","fields":[{"id":"p_onboard_details","hint":"记录今日入职的人员信息","type":"dynamic_rows","label":"今日入职人员","rowFields":[{"id":"name","type":"text","label":"姓名"},{"id":"dept","type":"text","label":"入职部门"},{"id":"time","type":"text","label":"入职时间"},{"id":"process","type":"text","label":"流程进度"}],"reportEnabled":false},{"id":"p_onboard_note","hint":"其他需要说明的入职事项","type":"textarea","label":"入职备注","reportEnabled":false}],"reportEnabled":false},{"id":"personnel_mgmt_contract_divider","type":"general","title":"【合同签订】","fields":[{"id":"p_contract_details","hint":"记录今日签订合同的人员（含试岗期、试用期、免责协议、劳动合同等）","type":"dynamic_rows","label":"今日合同签订","rowFields":[{"id":"name","type":"text","label":"员工姓名"},{"id":"contract_type","type":"text","label":"合同类型"},{"id":"note","type":"text","label":"备注"}],"reportEnabled":false}],"reportEnabled":false},{"id":"personnel_mgmt_resign_divider","type":"general","title":"【离职管理】","fields":[{"id":"p_resign_details","hint":"记录离职人员及交接情况","type":"dynamic_rows","label":"今日离职人员","rowFields":[{"id":"name","type":"text","label":"离职人员"},{"id":"dept","type":"text","label":"离职部门"},{"id":"handover","type":"text","label":"交接情况"}],"reportEnabled":false},{"id":"p_resign_note","hint":"其他需要说明的离职事项","type":"textarea","label":"离职备注","reportEnabled":false},{"id":"p_other","type":"textarea","label":"其他人事事项","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:19:43', 'cmjaewk740004p8bi3m3k6dv8', 'cmkfh85le0009tqx4kqnmj8sd', 'DEPT_LEAD', '', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"cleaningWork_cleaningWork","type":"general","title":"一、洁牙工作","fields":[{"id":"cleaningTotal","type":"number","label":"今日洁牙人数","required":true,"reportEnabled":false},{"id":"deepCleaningCount","type":"number","label":"深度洁牙人数","reportEnabled":false},{"id":"perioTherapyCount","type":"number","label":"牙周治疗人数","reportEnabled":false},{"id":"polishingCount","type":"number","label":"抛光人数","reportEnabled":false},{"id":"fluorideCount","type":"number","label":"涂氟人数","reportEnabled":false}],"reportEnabled":false},{"id":"revenue_revenue","type":"general","title":"二、业绩统计","fields":[{"id":"revenueTotal","type":"money","label":"今日业绩金额","required":true,"reportEnabled":false},{"id":"avgRevenuePerPatient","type":"money","label":"人均消费","reportEnabled":false}],"reportEnabled":false},{"id":"referral_referral","type":"general","title":"三、转诊情况","fields":[{"id":"referralToDoctor","hint":"发现需要进一步治疗的患者","type":"number","label":"转诊给医生人数","required":true,"reportEnabled":false},{"id":"referralReason","hint":"牙周病/龋齿/正畸需求等","type":"textarea","label":"转诊原因说明","reportEnabled":false},{"id":"followupAppointment","type":"number","label":"预约复诊人数","reportEnabled":false}],"reportEnabled":false},{"id":"patientFeedback_patientFeedback","type":"general","title":"四、患者反馈","fields":[{"id":"satisfiedCount","type":"number","label":"满意患者数","reportEnabled":false},{"id":"complaintCount","type":"number","label":"不满/投诉数","reportEnabled":false},{"id":"complaintDetail","type":"textarea","label":"投诉详情","reportEnabled":false}],"reportEnabled":false}]}', '2026-01-15 13:20:13', 'cmjaewk7s0008p8biksd7sbgm', 'cmkfh8t3z000jtqx4f31tthv5', 'DEPT_LEAD', 'hygienistLead', '2026-01-15 13:26:47'),
('{"version":2,"containers":[{"id":"module_a_module_a","type":"general","title":"成本支出","fields":[{"id":"exp_materials","type":"money","label":"材料费","reportEnabled":true},{"id":"exp_marketing","type":"money","label":"市场部支出","reportEnabled":true},{"id":"exp_daily","type":"money","label":"日常支出","reportEnabled":true},{"id":"exp_online","type":"money","label":"网络部支出","reportEnabled":true},{"id":"exp_processing","type":"money","label":"加工费","reportEnabled":true},{"id":"exp_refund","type":"money","label":"退费支出","reportEnabled":true},{"id":"exp_water","type":"money","label":"水费","reportEnabled":true},{"id":"exp_electricity","type":"money","label":"电费","reportEnabled":true}],"reportEnabled":true},{"id":"module_b_module_b","type":"general","title":"总支出","fields":[{"id":"pay_wechat","type":"money","label":"微信支出","reportEnabled":true},{"id":"pay_cash","type":"money","label":"现金支出","reportEnabled":true},{"id":"pay_public","type":"money","label":"对公支出","reportEnabled":true}],"reportEnabled":true},{"id":"module_c_module_c","type":"general","title":"总收入","fields":[{"id":"inc_wechat","type":"money","label":"微信（工作机）收入","reportEnabled":true},{"id":"inc_cash","type":"money","label":"现金收入","reportEnabled":true},{"id":"inc_med","type":"money","label":"医保卡收入","reportEnabled":true},{"id":"inc_pos","type":"money","label":"刷卡机收入","reportEnabled":true},{"id":"inc_platform","type":"money","label":"平台收入","reportEnabled":true},{"id":"inc_public","type":"money","label":"对公收入","reportEnabled":true}],"reportEnabled":true},{"id":"module_d_module_d","type":"general","title":"大项","fields":[{"id":"risk_control_desc","type":"textarea","label":"风险控制说明","reportEnabled":true},{"id":"large_refund_reason","type":"textarea","label":"大额退费原因","reportEnabled":true},{"id":"other_notes","type":"textarea","label":"备注","reportEnabled":true}],"reportEnabled":true}]}', '2026-01-10 12:19:14', 'cmjaewk6w0002p8bis94wbri5', 'cmk89v3sx0001ygza3pfw6xjd', 'STAFF', '', '2026-01-15 13:47:00'),
('{"version":2,"containers":[{"id":"all_content_section_1","type":"general","title":"一、业绩统计","fields":[{"id":"actualRevenue","type":"money","label":"实收业绩","required":true,"reportEnabled":true},{"id":"expectedRevenue","type":"money","label":"应收业绩","required":true,"reportEnabled":true},{"id":"refundAmount","type":"money","label":"今日退费","required":true,"reportEnabled":true}],"reportEnabled":true},{"id":"all_content_section_2","type":"general","title":"二、到院统计","fields":[{"id":"new_patients_count","hint":"今日新建立档案的患者数","type":"number","label":"新增患者(建档)","required":true,"reportEnabled":true},{"id":"totalVisitors","type":"number","label":"总到院人数","required":true,"reportEnabled":true},{"id":"firstVisitCount","type":"number","label":"初诊人数","required":true,"reportEnabled":true},{"id":"returnVisitCount","type":"number","label":"复诊人数","required":true,"reportEnabled":true},{"id":"firstVisitAmount","type":"money","label":"初诊消费金额","required":true,"reportEnabled":true},{"id":"returnVisitAmount","type":"money","label":"复诊消费金额","required":true,"reportEnabled":true}],"reportEnabled":true},{"id":"container_1767537178753","type":"general","title":"总结","fields":[{"id":"field_1767537186345","type":"textarea","label":"今日总结","required":false,"reportEnabled":true},{"id":"field_1767537198353","type":"textarea","label":"明日计划","required":false,"reportEnabled":true}],"reportEnabled":false}]}', '2026-01-04 14:33:30', 'cmjaewk7m0006p8bi2n1aup8s', 'cmjzu0o8200071r1fn0kzpopk', 'DEPT_LEAD', '', '2026-01-15 13:52:54');

INSERT INTO `DailyReport` (`createdAt`, `departmentId`, `formData`, `id`, `note`, `reportDate`, `schemaId`, `status`, `storeId`, `submittedAt`, `updatedAt`, `userId`) VALUES
('2025-12-19 09:58:49', 'cmjaewk7d0005p8bi32n2xvpd', '{"newLeadsTotal":1,"leadsDouyin":0,"leadsXiaohongshu":0,"leadsBaidu":0,"leadsWechat":1,"leadsOther":0,"validLeads":0,"invalidLeads":1,"invalidReason":"只是咨询看看，不需要","appointmentsBooked":1,"appointmentsConfirmed":1,"visitsArrived":1,"noShowCount":0,"scriptVersion":"询问来院时间","topQuestions":"近期没有时间","competitorInfo":"老年一点的觉得种植牙价格稍高，因为广告几百块，我们报价1千多","followingLeads":3,"lostLeads":1,"firstResponseCount":0}', 'cmjcp5sox0002e47ezs2natoi', NULL, '2025-12-19', 'online_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-19 09:58:49', '2025-12-19 09:58:49', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-20 02:49:16', 'cmjaewk7m0006p8bi2n1aup8s', '{"totalArrival":20,"noShowTotal":10,"appointmentRate":10,"noShowReason1":"啦啦啦","noShowReason2":"呼啦啦","noShowReason3":"啦啦啦","noShowImproveAction":"啦啦啦","resourceSufficient":"yes","resourceGap":"啦啦啦"}', 'cmjdp996i0002qnhaa4qsfbxn', '啦啦啦', '2025-12-20', 'front_desk_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-20 02:49:16', '2025-12-20 02:49:16', 'cmjcjuek50001bxop8qatav0n'),
('2025-12-20 10:03:03', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"hygienistCount":3,"tomorrowSchedule":"洁牙上班两人","totalCleaningCount":5,"totalPerioTherapy":0,"workloadAssessment":"busy","qualityCheckCount":3,"qualityIssueCount":0,"qualityIssueDetail":"无","infectionControl":"消毒灭菌达标","materialShortage":"无","equipmentIssue":"无","patientComplaint":"无","safetyIncident":"未发生","trainingDone":"早期儿童矫正","newStaffProgress":"无新人","assistantNurseCount":7,"totalAssistCount":80,"nursingRevenue":1000,"tomorrowPriority":"配台，洁牙，开发转诊"}', 'cmje4r3680006qir27ble5c24', NULL, '2025-12-20', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-20 10:03:03', '2025-12-20 10:03:03', 'cmje3ub1e0001qir2vikqhx84'),
('2025-12-20 10:09:08', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"assistantNurseCount":4,"hygienistCount":3,"absentDetail":"无","tomorrowSchedule":"满足诊疗要求","totalAssistCount":13,"workloadAssessment":"normal","qualityCheckCount":1,"qualityIssueCount":0,"materialShortage":"暂时没有物资缺少","equipmentIssue":"已经报维修人员维修","patientComplaint":"暂时没有","safetyIncident":"无人员上报","trainingDone":"今日无培训","tomorrowPriority":"1.大部分矫正复诊","resourceNeed":"正畸器械要准备充足","coordinationNeed":"暂时没有","totalCleaningCount":10,"nursingRevenue":1000}', 'cmje4yx6l0002mlmno97bahfd', NULL, '2025-12-20', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-20 10:09:08', '2025-12-20 10:09:08', 'cmje43piw0003qir2kjvbov0i'),
('2025-12-25 12:27:57', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":6,"hygienistCount":3,"assistantNurseCount":3,"absentDetail":"正常休息","tomorrowSchedule":"满足","totalAssistCount":6,"sterilizerCyclesTotal":2,"workloadAssessment":"normal","nursingRevenue":1000,"qualityCheckCount":"","qualityIssueCount":"","materialShortage":"暂时没有","equipmentIssue":"无","tomorrowPriority":"1.培训","totalCleaningCount":7}', 'cmjlf4p0n00021x4zy85ebjcy', NULL, '2025-12-25', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-25 12:27:57', '2025-12-25 12:27:57', 'cmje43piw0003qir2kjvbov0i'),
('2025-12-26 10:01:39', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjmpcet00002h9wb5onvb7gy', '今日建档:4       月建档:54\n今日业绩:1732       月业绩:54050\n今日电话数量:51      月电话数量:1089\n今日问题:顾客故意刁难，询问价格觉得不适合，觉得没需求就挂电话\n', '2025-12-26', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 10:01:39', '2025-12-26 10:01:39', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-26 10:04:12', 'cmjaewk6t0001p8biaxwq7y1l', '{"teamDeals":5,"teamDealAmount":7801,"teamVisits":8,"teamAppointments":8,"visitsPerPerson":1,"resourcePlan":"各点位正常安排，老年大学活动明日开展，先带一组过去看情况不知道有多少人","teamValidInfo":71,"leadsPerPerson":6,"teamTouchpoints":1,"teamWechatAdded":1,"top3Channels":".","bottom3Channels":"."}', 'cmjmpfoit0005h9wbmdt6rkx5', NULL, '2025-12-26', 'marketing_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 10:04:12', '2025-12-26 10:04:12', 'cmjck7la40003z8gugwhp63e3'),
('2025-12-26 10:32:21', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"assistantNurseCount":4,"hygienistCount":3,"absentDetail":"无","tomorrowSchedule":"洁牙师3人","totalAssistCount":0,"totalCleaningCount":4,"totalPerioTherapy":0,"sterilizerCyclesTotal":4,"workloadAssessment":"light","nursingRevenue":1000,"qualityCheckCount":3,"qualityIssueCount":0,"qualityIssueDetail":"无","infectionControl":"消毒消菌达标","materialShortage":"无","equipmentIssue":"包装袋上压日期的工作可以更换了","patientComplaint":"无","trainingDone":"喷砂机的使用方法及喷砂技巧","newStaffProgress":"完成","tomorrowPriority":"洗牙，开发患者","coordinationNeed":"无","monthlyRevenue":""}', 'cmjmqfvh30002ljdocm18drdl', NULL, '2025-12-26', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 10:32:21', '2025-12-26 10:32:21', 'cmje3ub1e0001qir2vikqhx84'),
('2025-12-26 13:33:13', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"assistantNurseCount":4,"hygienistCount":3,"absentDetail":"无缺勤","tomorrowSchedule":"满足","totalAssistCount":13,"totalCleaningCount":10,"sterilizerCyclesTotal":3,"workloadAssessment":"normal","nursingRevenue":0,"qualityIssueDetail":"无","infectionControl":"消毒灭菌良好","materialShortage":"物品缺少已经月初上报","equipmentIssue":"无特殊","patientComplaint":"无特殊","safetyIncident":"无特殊","trainingDone":"今日完成两次培训1.矫正\\n2.喷砂","newStaffProgress":"无特殊","tomorrowPriority":"完成正畸复诊工作","resourceNeed":"无","coordinationNeed":"无"}', 'cmjmwwhg20002yg9gzsbcnxkn', NULL, '2025-12-26', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-26 13:33:13', '2025-12-26 13:33:13', 'cmje43piw0003qir2kjvbov0i'),
('2025-12-27 09:59:44', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"assistantNurseCount":4,"hygienistCount":3,"tomorrowSchedule":"洁牙师3人","totalAssistCount":0,"totalCleaningCount":0,"totalPerioTherapy":0,"sterilizerCyclesTotal":6,"workloadAssessment":"normal","nursingRevenue":0,"monthlyRevenue":0,"qualityCheckCount":3,"qualityIssueCount":0,"infectionControl":"消毒灭菌正常","materialShortage":"无","equipmentIssue":"无","patientComplaint":"无","safetyIncident":"无","trainingDone":"未培训","newStaffProgress":"","tomorrowPriority":"洗牙，转诊"}', 'cmjo4ps5k0002ui8pe4zbcbsj', '今天早上种植，下午消毒', '2025-12-27', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-27 09:59:44', '2025-12-27 09:59:44', 'cmje3ub1e0001qir2vikqhx84'),
('2025-12-27 10:00:20', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjo4qkd00005ui8pagt5t3h6', '今日建档:2       月建档:56\n今日业绩:2276       月业绩:56326\n今日电话数量:50    月电话数量:1139\n今日问题:询问价格觉得不适合，觉得没需求就挂电话\n', '2025-12-27', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-27 10:00:20', '2025-12-27 10:00:20', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-27 13:55:15', 'cmjaewk7s0008p8biksd7sbgm', '{"assistTotal":12,"orthoAssist":5,"restoreAssist":4,"rootCanalAssist":1,"otherAssist":2,"sterilizerCycles":2,"instrumentPacks":2,"materialShortage":"无","equipmentIssue":"无特殊","doctorsAssisted":1,"overtimeReason":"今日未加班"}', 'cmjod4o6p0002my6htjlcvg1n', NULL, '2025-12-27', 'nursing_assistant', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-27 13:55:15', '2025-12-27 13:55:15', 'cmje43piw0003qir2kjvbov0i'),
('2026-01-05 09:44:39', 'cmjaewk6t0001p8biaxwq7y1l', '{"spot_details":[{"spot_name":"","valid_leads_phone":224,"direct_visits":1,"visit_deal":1,"cash_expected":4400,"cash_received":4500,"remark":""}],"today_plan":"下雨无法正常摆展，外出买卡宣传","tomorrow_plan":"卫健委已备案，明天正常摆展"}', 'cmk0z52bz000261yj4402ixkg', NULL, '2026-01-05', 'marketing_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-05 09:44:39', '2026-01-05 09:44:39', 'cmjck7la40003z8gugwhp63e3'),
('2025-12-28 09:10:15', 'cmjaewk7s0008p8biksd7sbgm', '{"totalNurseCount":7,"onDutyCount":7,"assistantNurseCount":4,"hygienistCount":3,"totalAssistCount":0,"totalCleaningCount":3,"totalPerioTherapy":0,"sterilizerCyclesTotal":6,"workloadAssessment":"normal","nursingRevenue":0,"monthlyRevenue":0,"qualityCheckCount":2,"qualityIssueCount":0,"materialShortage":"无","equipmentIssue":"无","safetyIncident":"未发生","patientComplaint":"无","tomorrowPriority":"晚班接诊患者，白天洗牙转诊","resourceNeed":"无"}', 'cmjpie0fz0002s11k1rvruva3', NULL, '2025-12-28', 'head_nurse', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-28 09:10:15', '2025-12-28 09:10:15', 'cmje3ub1e0001qir2vikqhx84'),
('2025-12-28 10:00:58', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjpk77xf0002yruda9hi4e7k', '今日建档:4       月建档:60\n今日业绩:2160       月业绩:58486\n今日电话数量:50    月电话数量:1189\n今日问题:这几天没时间，挂电话\n', '2025-12-28', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-28 10:00:58', '2025-12-28 10:00:58', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-28 13:12:46', 'cmjaewk7s0008p8biksd7sbgm', '{"assistTotal":15,"orthoAssist":6,"restoreAssist":3,"rootCanalAssist":6,"sterilizerCycles":4,"instrumentPacks":3,"sterilizationIssue":"无","materialShortage":"已上报","equipmentIssue":"无","doctorsAssisted":1,"overtimeReason":"无加班"}', 'cmjpr1vyg0002eq8tewqvidka', NULL, '2025-12-28', 'nursing_assistant', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-28 13:12:46', '2025-12-28 13:12:46', 'cmje43piw0003qir2kjvbov0i'),
('2025-12-29 10:02:28', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjqzp03r00029zerw8wihia8', '今日建档:3       月建档:63\n今日业绩:158      月业绩:58644\n今日电话数量:50    月电话数量:1239\n今日问题：要过完年才有时间\n', '2025-12-29', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-29 10:02:28', '2025-12-29 10:02:28', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-30 10:00:29', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjsf2bja0002sjcegalk0ero', '今日建档:3       月建档:66\n今日业绩:2772      月业绩:61416\n今日电话数量:50    月电话数量:1289\n今日问题：没时间\n', '2025-12-30', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-30 10:00:29', '2025-12-30 10:00:29', 'cmjcjkjhx0001we3pkt349kez'),
('2025-12-30 14:39:27', 'cmjaewk7s0008p8biksd7sbgm', '{"assistTotal":10,"orthoAssist":1,"restoreAssist":4,"rootCanalAssist":2,"surgeryAssist":3,"sterilizerCycles":3,"instrumentPacks":2,"sterilizationIssue":"无","materialShortage":"不缺  今天已经领取","equipmentIssue":"无","doctorsAssisted":1}', 'cmjsp12d8000214e14d9e1x1f', NULL, '2025-12-30', 'nursing_assistant', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-30 14:39:27', '2025-12-30 14:39:27', 'cmje43piw0003qir2kjvbov0i'),
('2025-12-31 09:59:10', 'cmjaewk7d0005p8bi32n2xvpd', '{}', 'cmjtuggx40002fsvpa8ghas2j', '今日建档:2      月建档:68\n今日业绩:385     月业绩:61801\n今日电话数量:50    月电话数量:1339\n今日问题：要过完年后，近期没时间\n', '2025-12-31', 'online_lead', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2025-12-31 09:59:10', '2025-12-31 09:59:10', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-01 14:22:32', 'cmjaewk7m0006p8bi2n1aup8s', '{"actualRevenue":30430,"expectedRevenue":31550,"refundAmount":0,"new_patients_count":35,"totalVisitors":71,"firstVisitCount":27,"returnVisitCount":44,"firstVisitAmount":28440,"returnVisitAmount":1990}', 'cmjvjb0pf0002l720ctwibqo3', NULL, '2026-01-01', 'front_desk_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-01 14:22:32', '2026-01-01 14:22:32', 'cmjcjuek50001bxop8qatav0n'),
('2026-01-03 10:03:06', 'cmjaewk7d0005p8bi32n2xvpd', '{"leads_today":3,"leads_month":11,"visits_today":1,"visits_month":13,"deals_today":11,"deals_month":11,"revenue_today":58,"followup_today":50,"intentional_tomorrow":0,"dy_v":1,"dy_d":1,"dy_a":58,"main_tasks":"邀约","main_issues":"顾客没时间，要过完年","primary_task":"直播","core_goal":"邀约"}', 'cmjy4x3680004likd2uigj7h4', NULL, '2026-01-03', 'online_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-03 10:03:06', '2026-01-03 10:03:06', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-04 09:35:33', 'cmjaewk7m0006p8bi2n1aup8s', '{"actualRevenue":11988,"expectedRevenue":11988,"new_patients_count":6,"returnVisitCount":47,"totalVisitors":53,"firstVisitAmount":3018,"returnVisitAmount":8970,"firstVisitCount":6,"refundAmount":0}', 'cmjzjdi8t0002xs2i1r2bcnpd', NULL, '2026-01-04', 'front_desk_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 09:35:33', '2026-01-04 09:35:33', 'cmjcjuek50001bxop8qatav0n'),
('2026-01-04 10:01:48', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_month":13,"visits_today":1,"visits_month":14,"deals_today":1,"deals_month":12,"revenue_today":3418,"field_1767435300230":2800,"field_1767435416638":2,"field_1767435437205":12,"followup_today":50,"field_1767435448053":1,"field_1767435427558":0,"intentional_tomorrow":1,"leads_today":2,"field_1767435368366":0},"work_summary_work_summary":{"main_tasks":"顾客要过一久，目前没时间。有些顾客已经做了。直播有一个意向顾客，只是没有要到联系方式","main_issues":"直播，邀约"}}}', 'cmjzkb9kh000cs9rbkz7nhkg4', NULL, '2026-01-04', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 10:01:48', '2026-01-04 10:01:48', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-04 10:02:53', 'cmjaewk710003p8bi3vp1b6sf', '{"returnAppointment7Days":72,"totalVisits":53,"firstVisits":6,"returnVisits":47,"cashInYuan":11988,"avgTicket":999,"dealCount":12,"todayIssues":"1.绩效评分，确认签名，拿给鑫鑫核算工资。\\n2.德弗开业节目表演编排。\\n3.邀约转介绍进店，消费200元。","tomorrowKeyFocus":""}', 'cmjzkcnzf000fs9rb1mzi0tx7', NULL, '2026-01-04', 'store_manager', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 10:02:53', '2026-01-04 10:02:53', 'cmjclcgcd0007z8guu2d73vpv'),
('2026-01-04 10:12:42', 'cmjaewk7s0008p8biksd7sbgm', '{"version":2,"containers":{"container_1767429352155":{"field_1767429365660":3,"field_1767429400083":0,"field_1767430160195":0,"field_1767430135979":"1、黄明金洗牙，患者比较赶时间，忙着去验兵体检，有四颗龋坏，年前说有时间了过来补，2、李晓琪洗牙咨询师已经看过了3、高龙工作量，已经做了项目"},"container_1767430337539":{"field_1767430343972":"今日刁医生培训了拔牙，学习了拔牙的一些禁忌症和拔牙技巧","field_1767430353723":"休息"}}}', 'cmjzkpaes0002fn9zpgpow240', NULL, '2026-01-04', 'tpl_v2_STAFF_cmjaewk7s0008p8biksd7sbgm_hygienist', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 10:12:42', '2026-01-04 10:12:42', 'cmje3ub1e0001qir2vikqhx84'),
('2026-01-04 10:12:52', 'cmjaewk7s0008p8biksd7sbgm', '{"version":2,"containers":{"container_1767437331389":{"field_1767437332252":[{"rf_1767437342949":"李晓琪","rf_1767437356061":"拔牙"}]},"container_1767437400765":{"field_1767437407861":"1.根管治疗换药\\n2.戴牙\\n3.参加刁医生培训拔牙","field_1767437415788":"休息","field_1767438013932":"暂时没有"}}}', 'cmjzkphwo0005fn9zhv8lbtoa', NULL, '2026-01-04', 'tpl_v2_STAFF_cmjaewk7s0008p8biksd7sbgm_assistant', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 10:12:52', '2026-01-04 10:12:52', 'cmje43piw0003qir2kjvbov0i'),
('2026-01-04 10:13:40', 'cmjaewk6t0001p8biaxwq7y1l', '{"spot_details":[{"spot_name":"","valid_leads_phone":37,"direct_visits":3,"visit_deal":2,"cash_expected":6600,"cash_received":6100,"remark":"今日不能摆展，所以初诊量少"}],"today_plan":"今天卫健委严查摊位全部撤走，市场人员安排到德弗地推","tomorrow_plan":"看明天能不能正常摆展，不可以的话还是安排到德弗地推卖卡收集信息"}', 'cmjzkqiuk0008fn9zaoy0b1rr', NULL, '2026-01-04', 'marketing_staff', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-04 10:13:40', '2026-01-04 10:13:40', 'cmjck7la40003z8gugwhp63e3'),
('2026-01-04 13:24:27', 'cmjaewk6w0002p8bis94wbri5', '{}', 'cmjzrjvgh00031r1fhun25sqx', NULL, '2026-01-04', 'detailed_finance', 'SUBMITTED', 'cmjzrjunc00001r1fj1zejg0o', '2026-01-04 13:24:27', '2026-01-04 13:24:27', 'cmjcaxsr90001kdmfl4515oxx'),
('2026-01-05 09:44:57', 'cmjaewk710003p8bi3vp1b6sf', '{"returnAppointment7Days":24,"totalVisits":49,"firstVisits":9,"returnVisits":40,"dealCount":15,"cashInYuan":19744}', 'cmk0z5g0z000561yjv5388gco', NULL, '2026-01-05', 'store_manager', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-05 09:44:57', '2026-01-05 09:44:57', 'cmjclcgcd0007z8guu2d73vpv'),
('2026-01-05 10:02:56', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":2,"leads_month":15,"visits_today":2,"visits_month":17,"deals_today":15,"deals_month":15,"revenue_today":719,"field_1767435300230":0,"field_1767435368366":700,"field_1767435416638":1,"field_1767435427558":1,"field_1767435437205":17,"field_1767435448053":1,"followup_today":50,"intentional_tomorrow":1},"work_summary_work_summary":{"main_tasks":"没时间，直播被封","main_issues":"邀约"}}}', 'cmk0zskvy0002monyfbeep6gi', NULL, '2026-01-05', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-05 10:02:56', '2026-01-05 10:02:56', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-06 10:00:38', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":6,"leads_month":21,"visits_today":0,"visits_month":17,"deals_today":15,"deals_month":15,"revenue_today":0,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":0,"field_1767435427558":0,"field_1767435437205":12,"field_1767435448053":3,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"顾客嫌弃冷不愿意出门","main_issues":"邀约"}}}', 'cmk2f5h230002krq4e0ss8svi', NULL, '2026-01-06', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-06 10:00:38', '2026-01-06 10:00:38', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-07 09:44:45', 'cmjaewk710003p8bi3vp1b6sf', '{"totalVisits":57,"firstVisits":19,"returnVisits":38,"dealCount":10,"cashInYuan":14578,"returnAppointment7Days":0}', 'cmk3u0wit0002102zwtrcewhe', NULL, '2026-01-07', 'store_manager', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-07 09:44:45', '2026-01-07 09:44:45', 'cmjclcgcd0007z8guu2d73vpv'),
('2026-01-07 10:00:02', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":6,"leads_month":27,"visits_today":3,"visits_month":20,"deals_today":17,"deals_month":17,"revenue_today":3038,"field_1767435300230":3000,"field_1767435368366":0,"field_1767435416638":3,"field_1767435427558":0,"field_1767435437205":15,"field_1767435448053":2,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"直播被封3天","main_issues":"邀约"}}}', 'cmk3ukjnx0002ufovke7sdpth', NULL, '2026-01-07', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-07 10:00:02', '2026-01-07 10:00:02', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-08 09:59:43', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":3,"leads_month":30,"visits_today":3,"visits_month":23,"deals_today":20,"deals_month":20,"revenue_today":96,"field_1767435300230":0,"field_1767435368366":19,"field_1767435416638":2,"field_1767435427558":1,"field_1767435437205":17,"field_1767435448053":3,"followup_today":50,"intentional_tomorrow":1},"work_summary_work_summary":{"main_tasks":"天气冷不愿意出门","main_issues":"邀约"}}}', 'cmk59zztq0002fgt3ieklg2h6', NULL, '2026-01-08', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-08 09:59:43', '2026-01-08 09:59:43', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-09 10:00:38', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"field_1767435437205":18,"field_1767435427558":0,"field_1767435416638":1,"field_1767435448053":0,"followup_today":51,"intentional_tomorrow":0,"leads_today":1,"leads_month":31,"visits_today":1,"visits_month":24,"deals_today":21,"deals_month":21,"revenue_today":19,"field_1767435300230":0,"field_1767435368366":0},"work_summary_work_summary":{"main_tasks":"挂断电话的多","main_issues":"邀约"}}}', 'cmk6ph15z0002co6zx9y5wv32', NULL, '2026-01-09', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-09 10:00:38', '2026-01-09 10:00:38', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-10 09:57:58', 'cmjaewk710003p8bi3vp1b6sf', '{"totalVisits":78,"firstVisits":16,"returnVisits":62,"dealCount":18,"cashInYuan":34869,"returnAppointment7Days":0}', 'cmk84tg1p00026vuowoklrmgh', NULL, '2026-01-10', 'store_manager', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-10 09:57:58', '2026-01-10 09:57:58', 'cmjclcgcd0007z8guu2d73vpv'),
('2026-01-10 09:59:17', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":4,"leads_month":35,"visits_today":7,"visits_month":32,"deals_today":7,"deals_month":28,"revenue_today":1139,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":6,"field_1767435427558":1,"field_1767435437205":27,"field_1767435448053":4,"followup_today":50,"intentional_tomorrow":0},"channel_performance_channel_performance":{"third_party_channels":[],"field_1767435768270":[],"field_1767435543408":[{"rf_1767435604685":"","rf_1767435704893":"","rf_1767435748613":"","rf_1767435755253":""}]},"work_summary_work_summary":{"main_tasks":"顾客不在文山，要过一久","main_issues":"邀约"}}}', 'cmk84v5c100056vuohv6jkk6v', NULL, '2026-01-10', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-10 09:59:17', '2026-01-10 09:59:17', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-11 10:00:18', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":8,"leads_month":43,"visits_today":4,"visits_month":36,"deals_today":32,"deals_month":32,"revenue_today":1187,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":4,"field_1767435427558":0,"field_1767435437205":30,"field_1767435448053":3,"followup_today":51,"intentional_tomorrow":1},"work_summary_work_summary":{"main_tasks":"顾客多家对比，渣精得很","main_issues":"邀约"}}}', 'cmk9kcazi000211s2qhhpijhx', NULL, '2026-01-11', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-11 10:00:18', '2026-01-11 10:00:18', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-12 09:59:49', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":1,"leads_month":44,"visits_today":2,"visits_month":38,"deals_today":34,"deals_month":34,"revenue_today":1425,"field_1767435300230":900,"field_1767435368366":0,"field_1767435416638":2,"field_1767435427558":1,"field_1767435437205":32,"field_1767435448053":3,"followup_today":51,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"没时间，有空自己来，告知位置跟进","main_issues":"邀约"}}}', 'cmkazripq0002lc4hm8jg9z51', NULL, '2026-01-12', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-12 09:59:49', '2026-01-12 09:59:49', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-13 09:20:57', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":6,"leads_month":51,"visits_today":1,"visits_month":39,"deals_today":39,"deals_month":35,"revenue_today":810,"field_1767435300230":0,"field_1767435368366":800,"field_1767435416638":1,"field_1767435427558":1,"field_1767435437205":33,"field_1767435448053":4,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"顾客在意价格，想多家比较","main_issues":"邀约"}}}', 'cmkcdtekn0002nhcut6qyefa7', '', '2026-01-13', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-13 10:01:00', '2026-01-13 10:01:00', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-14 08:46:58', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"field_1767435448053":5,"leads_today":10,"followup_today":52,"intentional_tomorrow":1,"field_1767435437205":60,"field_1767435427558":1,"field_1767435416638":1,"field_1767435368366":10,"field_1767435300230":0,"revenue_today":70,"leads_month":61,"visits_today":2,"visits_month":42,"deals_today":37,"deals_month":37},"work_summary_work_summary":{"main_tasks":"今天没时间，要过一久","main_issues":"邀约"}}}', 'cmkds1jbt0002shzz7e4ld12x', '', '2026-01-14', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-14 10:02:47', '2026-01-14 10:02:47', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-15 09:16:57', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"field_1767435448053":7,"followup_today":50,"leads_today":6,"leads_month":67,"visits_today":4,"visits_month":46,"deals_today":42,"deals_month":42,"revenue_today":3071,"field_1767435300230":2800,"field_1767435368366":0,"field_1767435416638":4,"field_1767435427558":1,"field_1767435437205":0,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"要过一久才得闲","main_issues":"邀约进店"}}}', 'cmkf8jyp300024c99nk3f9h17', '', '2026-01-15', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-15 09:58:13', '2026-01-15 09:58:13', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-16 09:59:15', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":3,"leads_month":70,"visits_today":2,"visits_month":48,"deals_today":44,"deals_month":44,"revenue_today":419,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":2,"field_1767435427558":0,"field_1767435437205":0,"field_1767435448053":5,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"没时间·，有些已经做了","main_issues":"邀约"}}}', 'cmkgpi7om0002tk2ulkt0avl2', NULL, '2026-01-16', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-16 09:59:15', '2026-01-16 09:59:15', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-18 10:00:27', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":5,"leads_month":75,"visits_today":2,"visits_month":52,"deals_today":48,"deals_month":48,"revenue_today":618,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":2,"field_1767435427558":0,"field_1767435437205":45,"field_1767435448053":5,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"要过年以后，才会来看","main_issues":"打电话邀约"}}}', 'cmkjkfgdq0002eyuy8w99ddsb', NULL, '2026-01-18', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-18 10:00:27', '2026-01-18 10:00:27', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-19 09:58:54', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":1,"leads_month":76,"visits_today":2,"visits_month":54,"deals_today":2,"deals_month":50,"revenue_today":7506,"field_1767435300230":7456,"field_1767435368366":0,"field_1767435416638":2,"field_1767435427558":0,"field_1767435437205":0,"field_1767435448053":0,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"打电话邀约","main_issues":"邀约"}}}', 'cmkkztav8000214hz0lrigf7p', NULL, '2026-01-19', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'SUBMITTED', 'cmjaewkql0009p8bi4i938lcd', '2026-01-19 09:58:54', '2026-01-19 09:58:54', 'cmjcjkjhx0001we3pkt349kez'),
('2026-01-21 09:12:20', 'cmjaewk7d0005p8bi32n2xvpd', '{"version":2,"containers":{"core_metrics_core_metrics":{"leads_today":4,"leads_month":89,"visits_today":3,"visits_month":61,"deals_today":57,"deals_month":0,"revenue_today":867,"field_1767435300230":0,"field_1767435368366":0,"field_1767435416638":867,"field_1767435427558":0,"field_1767435437205":0,"field_1767435448053":6,"followup_today":50,"intentional_tomorrow":0},"work_summary_work_summary":{"main_tasks":"顾客不需要的多，有时间联系","main_issues":"打电话邀约"}}}', 'cmknt15270002k4eddpqtmd6f', NULL, '2026-01-21', 'tpl_v2_STAFF_cmjaewk7d0005p8bi32n2xvpd_default', 'DRAFT', 'cmjaewkql0009p8bi4i938lcd', NULL, '2026-01-21 09:12:20', 'cmjcjkjhx0001we3pkt349kez');

INSERT INTO `FrontDeskReport` (`canceledAppointments`, `complaintsCount`, `createdAt`, `dailyReportId`, `initialTriage`, `new_patients_count`, `newAppointments`, `newVisits`, `noShowAppointments`, `paymentsCount`, `refundsCount`, `rescheduledAppointments`, `resolvedCount`, `returningVisits`, `revisitTriage`, `updatedAt`) VALUES
(0, 0, '2025-12-20 02:49:17', 'cmjdp996i0002qnhaa4qsfbxn', 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, '2025-12-20 02:49:17'),
(0, 0, '2026-01-01 14:22:33', 'cmjvjb0pf0002l720ctwibqo3', 27, 35, 0, 27, 0, 0, 0, 0, 0, 44, 44, '2026-01-01 14:22:33'),
(0, 0, '2026-01-04 09:35:33', 'cmjzjdi8t0002xs2i1r2bcnpd', 6, 6, 0, 6, 0, 0, 0, 0, 0, 47, 47, '2026-01-04 09:35:33');

INSERT INTO `NursingReport` (`cbctScans`, `consumableIncidents`, `createdAt`, `dailyReportId`, `doctorsAssisted`, `hygieneVisits`, `instrumentPacks`, `intraoralScansPhotos`, `overtimeMinutes`, `panoramicXrays`, `perioTherapies`, `referralsToDoctor`, `sterilizerCycles`, `updatedAt`, `workType`) VALUES
(0, 0, '2025-12-20 10:03:03', 'cmje4r3680006qir27ble5c24', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-20 10:03:03', 'undefined'),
(0, 0, '2025-12-20 10:09:09', 'cmje4yx6l0002mlmno97bahfd', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-20 10:09:09', 'undefined'),
(0, 0, '2025-12-25 12:27:57', 'cmjlf4p0n00021x4zy85ebjcy', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-25 12:27:57', 'undefined'),
(0, 0, '2025-12-26 10:32:21', 'cmjmqfvh30002ljdocm18drdl', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-26 10:32:21', 'undefined'),
(0, 0, '2025-12-26 13:33:14', 'cmjmwwhg20002yg9gzsbcnxkn', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-26 13:33:14', 'undefined'),
(0, 0, '2025-12-27 09:59:44', 'cmjo4ps5k0002ui8pe4zbcbsj', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-27 09:59:44', 'undefined'),
(0, 0, '2025-12-27 13:55:16', 'cmjod4o6p0002my6htjlcvg1n', 1, 0, 2, 0, 0, 0, 0, 0, 2, '2025-12-27 13:55:16', 'undefined'),
(0, 0, '2025-12-28 09:10:16', 'cmjpie0fz0002s11k1rvruva3', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-12-28 09:10:16', 'undefined'),
(0, 0, '2025-12-28 13:12:46', 'cmjpr1vyg0002eq8tewqvidka', 1, 0, 3, 0, 0, 0, 0, 0, 4, '2025-12-28 13:12:46', 'undefined'),
(0, 0, '2025-12-30 14:39:27', 'cmjsp12d8000214e14d9e1x1f', 1, 0, 2, 0, 0, 0, 0, 0, 3, '2025-12-30 14:39:27', 'undefined'),
(0, 0, '2026-01-04 10:12:43', 'cmjzkpaes0002fn9zpgpow240', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-04 10:12:43', 'undefined'),
(0, 0, '2026-01-04 10:12:52', 'cmjzkphwo0005fn9zhv8lbtoa', 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-04 10:12:52', 'undefined');

INSERT INTO `OfflineMarketingReport` (`appointmentsBooked`, `costInCents`, `createdAt`, `dailyReportId`, `leadsNew`, `leadsValid`, `partnershipsMaintained`, `partnershipsNew`, `touchpoints`, `updatedAt`, `visitsArrived`) VALUES
(0, 0, '2025-12-26 10:04:12', 'cmjmpfoit0005h9wbmdt6rkx5', 0, 0, 0, 0, 0, '2025-12-26 10:04:12', 0),
(0, 0, '2026-01-04 10:13:40', 'cmjzkqiuk0008fn9zaoy0b1rr', 0, 0, 0, 0, 0, '2026-01-04 10:13:40', 0),
(0, 0, '2026-01-05 09:44:40', 'cmk0z52bz000261yj4402ixkg', 0, 0, 0, 0, 0, '2026-01-05 09:44:40', 0);

INSERT INTO `OnlineGrowthReport` (`createdAt`, `dailyReportId`, `deals_month`, `deals_today`, `followup_today`, `intentional_tomorrow`, `leads_month`, `leads_today`, `revenue_today`, `updatedAt`, `visits_month`, `visits_today`) VALUES
('2025-12-19 09:58:49', 'cmjcp5sox0002e47ezs2natoi', 0, 0, 0, 0, 0, 0, 0, '2025-12-19 09:58:49', 0, 0),
('2025-12-26 10:01:40', 'cmjmpcet00002h9wb5onvb7gy', 0, 0, 0, 0, 0, 0, 0, '2025-12-26 10:01:40', 0, 0),
('2025-12-27 10:00:20', 'cmjo4qkd00005ui8pagt5t3h6', 0, 0, 0, 0, 0, 0, 0, '2025-12-27 10:00:20', 0, 0),
('2025-12-28 10:00:58', 'cmjpk77xf0002yruda9hi4e7k', 0, 0, 0, 0, 0, 0, 0, '2025-12-28 10:00:58', 0, 0),
('2025-12-29 10:02:28', 'cmjqzp03r00029zerw8wihia8', 0, 0, 0, 0, 0, 0, 0, '2025-12-29 10:02:28', 0, 0),
('2025-12-30 10:00:30', 'cmjsf2bja0002sjcegalk0ero', 0, 0, 0, 0, 0, 0, 0, '2025-12-30 10:00:30', 0, 0),
('2025-12-31 09:59:10', 'cmjtuggx40002fsvpa8ghas2j', 0, 0, 0, 0, 0, 0, 0, '2025-12-31 09:59:10', 0, 0),
('2026-01-03 10:03:07', 'cmjy4x3680004likd2uigj7h4', 11, 11, 50, 0, 11, 3, 5800, '2026-01-03 10:03:07', 13, 1),
('2026-01-04 10:01:48', 'cmjzkb9kh000cs9rbkz7nhkg4', 0, 0, 0, 0, 0, 0, 0, '2026-01-04 10:01:48', 0, 0),
('2026-01-05 10:02:57', 'cmk0zskvy0002monyfbeep6gi', 0, 0, 0, 0, 0, 0, 0, '2026-01-05 10:02:57', 0, 0),
('2026-01-06 10:00:39', 'cmk2f5h230002krq4e0ss8svi', 0, 0, 0, 0, 0, 0, 0, '2026-01-06 10:00:39', 0, 0),
('2026-01-07 10:00:02', 'cmk3ukjnx0002ufovke7sdpth', 0, 0, 0, 0, 0, 0, 0, '2026-01-07 10:00:02', 0, 0),
('2026-01-08 09:59:43', 'cmk59zztq0002fgt3ieklg2h6', 0, 0, 0, 0, 0, 0, 0, '2026-01-08 09:59:43', 0, 0),
('2026-01-09 10:00:39', 'cmk6ph15z0002co6zx9y5wv32', 0, 0, 0, 0, 0, 0, 0, '2026-01-09 10:00:39', 0, 0),
('2026-01-10 09:59:18', 'cmk84v5c100056vuohv6jkk6v', 0, 0, 0, 0, 0, 0, 0, '2026-01-10 09:59:18', 0, 0),
('2026-01-11 10:00:19', 'cmk9kcazi000211s2qhhpijhx', 0, 0, 0, 0, 0, 0, 0, '2026-01-11 10:00:19', 0, 0),
('2026-01-12 09:59:49', 'cmkazripq0002lc4hm8jg9z51', 0, 0, 0, 0, 0, 0, 0, '2026-01-12 09:59:49', 0, 0),
('2026-01-13 09:20:58', 'cmkcdtekn0002nhcut6qyefa7', 0, 0, 0, 0, 0, 0, 0, '2026-01-13 09:20:58', 0, 0),
('2026-01-14 08:46:58', 'cmkds1jbt0002shzz7e4ld12x', 0, 0, 0, 0, 0, 0, 0, '2026-01-14 08:46:58', 0, 0),
('2026-01-15 09:16:58', 'cmkf8jyp300024c99nk3f9h17', 0, 0, 0, 0, 0, 0, 0, '2026-01-15 09:16:58', 0, 0),
('2026-01-16 09:59:16', 'cmkgpi7om0002tk2ulkt0avl2', 0, 0, 0, 0, 0, 0, 0, '2026-01-16 09:59:16', 0, 0),
('2026-01-18 10:00:27', 'cmkjkfgdq0002eyuy8w99ddsb', 0, 0, 0, 0, 0, 0, 0, '2026-01-18 10:00:27', 0, 0),
('2026-01-19 09:58:54', 'cmkkztav8000214hz0lrigf7p', 0, 0, 0, 0, 0, 0, 0, '2026-01-19 09:58:54', 0, 0),
('2026-01-21 09:12:21', 'cmknt15270002k4eddpqtmd6f', 0, 0, 0, 0, 0, 0, 0, '2026-01-21 09:12:21', 0, 0);

INSERT INTO `FinanceHrAdminReport` (`cardPayInCents`, `cashInCents`, `cashPayInCents`, `createdAt`, `dailyReportId`, `expenseAdminInCents`, `expenseMarketingInCents`, `expenseMaterialInCents`, `expenseProcessingInCents`, `expenseTotalInCents`, `hiresCount`, `onlinePayInCents`, `reconciliationIssues`, `refundsInCents`, `resignationsCount`, `staffAbsent`, `staffPresent`, `staffScheduled`, `traineesCount`, `trainingSessions`, `updatedAt`) VALUES
(0, 0, 0, '2026-01-04 13:24:27', 'cmjzrjvgh00031r1fhun25sqx', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2026-01-04 13:24:27');

INSERT INTO `PatientConsultation` (`chiefComplaint`, `consultantId`, `createdAt`, `dealAmount`, `dealProjects`, `dealStatus`, `depositAmount`, `diagnosis`, `followHistory`, `id`, `intendedProjects`, `intentionLevel`, `nextFollowDate`, `nextFollowNote`, `noDealDetail`, `noDealReason`, `patientAge`, `patientGender`, `patientName`, `patientPhone`, `paymentMethod`, `referrer`, `remark`, `source`, `storeId`, `toothPositions`, `updatedAt`, `visitDate`, `visitType`) VALUES
('123', 'cmjcjpael0003we3p0i6trpw3', '2026-01-03 12:01:26', 0, '[]', 'PENDING', 0, NULL, NULL, 'cmjy959r8000110ycjhrkkilp', '[]', NULL, NULL, NULL, NULL, NULL, 11, 'MALE', '213', '19922255251', NULL, NULL, NULL, '123', 'cmjaewkql0009p8bi4i938lcd', '["12","47"]', '2026-01-03 12:01:26', '2026-01-03', 'INITIAL');
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
