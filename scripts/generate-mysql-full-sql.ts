import { execSync } from "child_process";
import fs from "fs";
import path from "path";

type JsonRecord = Record<string, unknown>;

const projectRoot = process.cwd();
const backupDir = path.join(projectRoot, "database_backup");
const schemaPrismaPath = path.join(backupDir, "schema.mysql.prisma");
const outSqlPath = path.join(backupDir, "mysql_full.sql");

const tableOrder: Array<{ table: string; jsonFile: string }> = [
  { table: "Department", jsonFile: "department.json" },
  { table: "Store", jsonFile: "store.json" },
  { table: "DictionaryItem", jsonFile: "dictionaryItem.json" },
  { table: "ConfigFlag", jsonFile: "configFlag.json" },
  { table: "ChannelSource", jsonFile: "channelSource.json" },
  { table: "User", jsonFile: "user.json" },
  { table: "DailyReportTemplate", jsonFile: "dailyReportTemplate.json" },
  { table: "DailyReport", jsonFile: "dailyReport.json" },
  { table: "ConsultationReport", jsonFile: "consultationReport.json" },
  { table: "FrontDeskReport", jsonFile: "frontDeskReport.json" },
  { table: "NursingReport", jsonFile: "nursingReport.json" },
  { table: "MedicalReport", jsonFile: "medicalReport.json" },
  { table: "OfflineMarketingReport", jsonFile: "offlineMarketingReport.json" },
  { table: "OnlineGrowthReport", jsonFile: "onlineGrowthReport.json" },
  { table: "FinanceHrAdminReport", jsonFile: "financeHrAdminReport.json" },
  { table: "HrReport", jsonFile: "hrReport.json" },
  { table: "AdminReport", jsonFile: "adminReport.json" },
  { table: "PatientConsultation", jsonFile: "patientConsultation.json" },
  { table: "StoreDayLock", jsonFile: "storeDayLock.json" },
  { table: "UserStoreAccess", jsonFile: "userStoreAccess.json" },
  { table: "ConsultationViewPermission", jsonFile: "consultationViewPermission.json" },
];

function runPrismaMigrateDiff(): string {
  const schemaArg = `"${schemaPrismaPath}"`;
  const cmd = `npx prisma migrate diff --from-empty --to-schema-datamodel ${schemaArg} --script`;
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)
  );
}

function formatMySqlDateTimeFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function escapeMySqlString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\u0000/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\u001a/g, "\\Z")
    .replace(/'/g, "\\'");
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "string") {
    const v = isIsoDateString(value) ? formatMySqlDateTimeFromIso(value) : value;
    return `'${escapeMySqlString(v)}'`;
  }
  if (value instanceof Date) {
    const v = formatMySqlDateTimeFromIso(value.toISOString());
    return `'${escapeMySqlString(v)}'`;
  }
  return `'${escapeMySqlString(JSON.stringify(value))}'`;
}

function readJsonArray(filePath: string): JsonRecord[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`JSON is not an array: ${filePath}`);
  }
  return parsed as JsonRecord[];
}

function columnsUnion(records: JsonRecord[]): string[] {
  const set = new Set<string>();
  for (const r of records) {
    for (const k of Object.keys(r)) set.add(k);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function buildInsertStatements(table: string, records: JsonRecord[], batchSize = 200): string {
  if (records.length === 0) return "";
  const cols = columnsUnion(records);
  const colSql = cols.map((c) => `\`${c}\``).join(", ");
  const chunks: string[] = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const valuesSql = batch
      .map((row) => `(${cols.map((c) => sqlValue(row[c])).join(", ")})`)
      .join(",\n");
    chunks.push(`INSERT INTO \`${table}\` (${colSql}) VALUES\n${valuesSql};\n`);
  }

  return chunks.join("\n");
}

async function main() {
  if (!fs.existsSync(backupDir)) {
    throw new Error(`backup dir not found: ${backupDir}`);
  }
  if (!fs.existsSync(schemaPrismaPath)) {
    throw new Error(`mysql schema prisma not found: ${schemaPrismaPath}`);
  }

  const schemaSql = runPrismaMigrateDiff();

  let dataSql = "";
  for (const { table, jsonFile } of tableOrder) {
    const fp = path.join(backupDir, jsonFile);
    if (!fs.existsSync(fp)) continue;
    const records = readJsonArray(fp);
    if (records.length === 0) continue;
    dataSql += `\n${buildInsertStatements(table, records)}`;
  }

  const fullSql =
    `SET NAMES utf8mb4;\n` +
    `SET time_zone = '+00:00';\n\n` +
    `${schemaSql.trim()}\n\n` +
    `SET FOREIGN_KEY_CHECKS = 0;\n` +
    `START TRANSACTION;\n` +
    `${dataSql.trim()}\n` +
    `COMMIT;\n` +
    `SET FOREIGN_KEY_CHECKS = 1;\n`;

  fs.writeFileSync(outSqlPath, fullSql, "utf8");
  process.stdout.write(`OK: ${outSqlPath}\n`);
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n");
  process.exit(1);
});
