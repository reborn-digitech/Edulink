-- AlterTable
ALTER TABLE "SessionPayment" ADD COLUMN     "paidAt" TIMESTAMP(3);
-- A row captured before this column existed: the date the receipt shows is the row's own.
UPDATE "SessionPayment" SET "paidAt" = "createdAt" WHERE "paidAt" IS NULL AND "status" IN ('PAID', 'HELD', 'DUE', 'PAID_OUT', 'REFUNDED');
