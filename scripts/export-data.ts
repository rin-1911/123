
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const backupDir = path.join(process.cwd(), "database_backup");

async function exportTable(modelName: string) {
  try {
    // @ts-ignore
    const data = await prisma[modelName].findMany();
    const filePath = path.join(backupDir, `${modelName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Exported ${data.length} records from ${modelName}`);
  } catch (error) {
    console.error(`❌ Failed to export ${modelName}:`, error);
  }
}

async function main() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const models = [
    "department",
    "store",
    "user",
    "channelSource",
    "configFlag",
    "dailyReport",
    "consultationReport",
    "consultationViewPermission",
    "hrReport",
    "adminReport",
    "dailyReportTemplate",
    "dictionaryItem",
    "financeHrAdminReport",
    "frontDeskReport",
    "medicalReport",
    "nursingReport",
    "offlineMarketingReport",
    "onlineGrowthReport",
    "patientConsultation",
    "storeDayLock",
    "userStoreAccess"
  ];

  console.log("🚀 Starting database export...");
  
  for (const model of models) {
    await exportTable(model);
  }

  console.log("✨ Export completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
