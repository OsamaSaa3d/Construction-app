-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UrgentSupplierMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "distanceKm" REAL NOT NULL,
    "canFulfill" BOOLEAN NOT NULL DEFAULT false,
    "priceQuote" DECIMAL,
    "respondedAt" DATETIME,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UrgentSupplierMatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UrgentRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UrgentSupplierMatch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UrgentSupplierMatch" ("accepted", "canFulfill", "createdAt", "distanceKm", "id", "priceQuote", "requestId", "respondedAt", "supplierId") SELECT "accepted", "canFulfill", "createdAt", "distanceKm", "id", "priceQuote", "requestId", "respondedAt", "supplierId" FROM "UrgentSupplierMatch";
DROP TABLE "UrgentSupplierMatch";
ALTER TABLE "new_UrgentSupplierMatch" RENAME TO "UrgentSupplierMatch";
CREATE INDEX "UrgentSupplierMatch_requestId_idx" ON "UrgentSupplierMatch"("requestId");
CREATE UNIQUE INDEX "UrgentSupplierMatch_requestId_supplierId_key" ON "UrgentSupplierMatch"("requestId", "supplierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
