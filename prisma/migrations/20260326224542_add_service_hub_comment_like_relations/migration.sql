-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceHubComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceHubComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ServiceHubPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceHubComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceHubComment" ("authorId", "content", "createdAt", "id", "postId") SELECT "authorId", "content", "createdAt", "id", "postId" FROM "ServiceHubComment";
DROP TABLE "ServiceHubComment";
ALTER TABLE "new_ServiceHubComment" RENAME TO "ServiceHubComment";
CREATE INDEX "ServiceHubComment_postId_idx" ON "ServiceHubComment"("postId");
CREATE TABLE "new_ServiceHubLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceHubLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ServiceHubPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServiceHubLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceHubLike" ("createdAt", "id", "postId", "userId") SELECT "createdAt", "id", "postId", "userId" FROM "ServiceHubLike";
DROP TABLE "ServiceHubLike";
ALTER TABLE "new_ServiceHubLike" RENAME TO "ServiceHubLike";
CREATE UNIQUE INDEX "ServiceHubLike_postId_userId_key" ON "ServiceHubLike"("postId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
