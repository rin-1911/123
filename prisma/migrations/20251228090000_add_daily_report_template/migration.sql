-- CreateTable
CREATE TABLE "DailyReportTemplate" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL DEFAULT '',
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DailyReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReportTemplate_departmentId_idx" ON "DailyReportTemplate"("departmentId");

-- CreateIndex
CREATE INDEX "DailyReportTemplate_role_idx" ON "DailyReportTemplate"("role");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReportTemplate_role_departmentId_schemaId_key" ON "DailyReportTemplate"("role", "departmentId", "schemaId");

-- AddForeignKey
ALTER TABLE "DailyReportTemplate" ADD CONSTRAINT "DailyReportTemplate_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;


