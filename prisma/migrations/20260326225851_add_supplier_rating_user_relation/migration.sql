-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "ratedByUserId" TEXT NOT NULL,
    "orderId" TEXT,
    "trustworthiness" INTEGER NOT NULL,
    "deliveryReliability" INTEGER NOT NULL,
    "timeliness" INTEGER NOT NULL,
    "materialQuality" INTEGER NOT NULL,
    "overallScore" REAL NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierRating_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierRating_ratedByUserId_fkey" FOREIGN KEY ("ratedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SupplierRating" ("comment", "createdAt", "deliveryReliability", "id", "materialQuality", "orderId", "overallScore", "ratedByUserId", "supplierId", "timeliness", "trustworthiness") SELECT "comment", "createdAt", "deliveryReliability", "id", "materialQuality", "orderId", "overallScore", "ratedByUserId", "supplierId", "timeliness", "trustworthiness" FROM "SupplierRating";
DROP TABLE "SupplierRating";
ALTER TABLE "new_SupplierRating" RENAME TO "SupplierRating";
CREATE INDEX "SupplierRating_supplierId_idx" ON "SupplierRating"("supplierId");
CREATE UNIQUE INDEX "SupplierRating_supplierId_ratedByUserId_orderId_key" ON "SupplierRating"("supplierId", "ratedByUserId", "orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
