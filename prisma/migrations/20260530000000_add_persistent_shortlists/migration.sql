-- CreateTable
CREATE TABLE "ShortlistSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortlistSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortlistItem" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "college_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortlistItem_session_id_idx" ON "ShortlistItem"("session_id");

-- CreateIndex
CREATE INDEX "ShortlistItem_college_id_idx" ON "ShortlistItem"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "ShortlistItem_session_id_college_id_key" ON "ShortlistItem"("session_id", "college_id");

-- AddForeignKey
ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ShortlistSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
