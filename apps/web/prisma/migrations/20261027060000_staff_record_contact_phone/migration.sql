-- owner-batch-item2a (27 October 2026): support staff without a login. The number the office rings a member of
-- staff on, kept on the staff record as E.164 and not on the account (User.phone is unique and a sign-in phone its
-- owner proves). The SUPPORT role itself is a string in Membership.role and needs no column.
-- AlterTable
ALTER TABLE "StaffRecord" ADD COLUMN     "contactPhone" TEXT;
