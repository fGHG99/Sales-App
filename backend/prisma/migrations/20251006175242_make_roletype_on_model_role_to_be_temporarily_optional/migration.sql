/*
  Warnings:

  - A unique constraint covering the columns `[roleType]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."roles" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roleType" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleType_key" ON "public"."roles"("roleType");
