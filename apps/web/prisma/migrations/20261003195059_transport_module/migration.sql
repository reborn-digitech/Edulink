-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'BOTH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportStop" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "morningMinute" INTEGER,
    "eveningMinute" INTEGER,
    "radiusM" INTEGER NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusAssignment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverMembershipId" TEXT NOT NULL,
    "attendantMembershipId" TEXT,
    "fromDateKey" TEXT NOT NULL,
    "toDateKey" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportAllotment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "boards" BOOLEAN NOT NULL DEFAULT true,
    "alights" BOOLEAN NOT NULL DEFAULT true,
    "fromDateKey" TEXT NOT NULL,
    "toDateKey" TEXT,
    "feeHeadId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "startedByMembershipId" TEXT,
    "startReason" TEXT,
    "endedAt" TIMESTAMP(3),
    "endedByMembershipId" TEXT,
    "lowBatteryAt" TIMESTAMP(3),
    "missedNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPosition" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripBoarding" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "boardedAt" TIMESTAMP(3),
    "alightedAt" TIMESTAMP(3),
    "markedByMembershipId" TEXT,
    "nearNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripBoarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportAlertPref" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nearAlerts" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportAlertPref_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportConsent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "textKey" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportRoute_schoolId_active_idx" ON "TransportRoute"("schoolId", "active");

-- CreateIndex
CREATE INDEX "TransportStop_schoolId_idx" ON "TransportStop"("schoolId");

-- CreateIndex
CREATE INDEX "TransportStop_routeId_order_idx" ON "TransportStop"("routeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_schoolId_registration_key" ON "Bus"("schoolId", "registration");

-- CreateIndex
CREATE INDEX "BusAssignment_schoolId_fromDateKey_idx" ON "BusAssignment"("schoolId", "fromDateKey");

-- CreateIndex
CREATE INDEX "BusAssignment_driverMembershipId_idx" ON "BusAssignment"("driverMembershipId");

-- CreateIndex
CREATE INDEX "BusAssignment_attendantMembershipId_idx" ON "BusAssignment"("attendantMembershipId");

-- CreateIndex
CREATE INDEX "BusAssignment_routeId_idx" ON "BusAssignment"("routeId");

-- CreateIndex
CREATE INDEX "BusAssignment_busId_idx" ON "BusAssignment"("busId");

-- CreateIndex
CREATE INDEX "TransportAllotment_schoolId_routeId_idx" ON "TransportAllotment"("schoolId", "routeId");

-- CreateIndex
CREATE INDEX "TransportAllotment_studentMembershipId_idx" ON "TransportAllotment"("studentMembershipId");

-- CreateIndex
CREATE INDEX "TransportAllotment_stopId_idx" ON "TransportAllotment"("stopId");

-- CreateIndex
CREATE INDEX "Trip_schoolId_dateKey_idx" ON "Trip"("schoolId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_assignmentId_dateKey_direction_key" ON "Trip"("assignmentId", "dateKey", "direction");

-- CreateIndex
CREATE INDEX "TripPosition_at_idx" ON "TripPosition"("at");

-- CreateIndex
CREATE INDEX "TripPosition_schoolId_at_idx" ON "TripPosition"("schoolId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "TripPosition_tripId_at_key" ON "TripPosition"("tripId", "at");

-- CreateIndex
CREATE INDEX "TripBoarding_schoolId_idx" ON "TripBoarding"("schoolId");

-- CreateIndex
CREATE INDEX "TripBoarding_allotmentId_idx" ON "TripBoarding"("allotmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TripBoarding_tripId_allotmentId_key" ON "TripBoarding"("tripId", "allotmentId");

-- CreateIndex
CREATE INDEX "TransportAlertPref_schoolId_idx" ON "TransportAlertPref"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportAlertPref_studentMembershipId_userId_key" ON "TransportAlertPref"("studentMembershipId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportConsent_membershipId_key" ON "TransportConsent"("membershipId");

-- CreateIndex
CREATE INDEX "TransportConsent_schoolId_idx" ON "TransportConsent"("schoolId");

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportStop" ADD CONSTRAINT "TransportStop_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportStop" ADD CONSTRAINT "TransportStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAssignment" ADD CONSTRAINT "BusAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAssignment" ADD CONSTRAINT "BusAssignment_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAssignment" ADD CONSTRAINT "BusAssignment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAssignment" ADD CONSTRAINT "BusAssignment_driverMembershipId_fkey" FOREIGN KEY ("driverMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAssignment" ADD CONSTRAINT "BusAssignment_attendantMembershipId_fkey" FOREIGN KEY ("attendantMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAllotment" ADD CONSTRAINT "TransportAllotment_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TransportStop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "BusAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPosition" ADD CONSTRAINT "TripPosition_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPosition" ADD CONSTRAINT "TripPosition_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripBoarding" ADD CONSTRAINT "TripBoarding_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripBoarding" ADD CONSTRAINT "TripBoarding_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripBoarding" ADD CONSTRAINT "TripBoarding_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "TransportAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportAlertPref" ADD CONSTRAINT "TransportAlertPref_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportConsent" ADD CONSTRAINT "TransportConsent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
