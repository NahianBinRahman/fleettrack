import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper to convert BDT whole amount to Paisa (1 BDT = 100 Paisa)
const bdt = (amount: number): bigint => BigInt(amount) * BigInt(100);

async function main() {
  console.log("⚓ Starting FleetTrack Database Seeding...");

  // Clean existing data for a fresh seed
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budgetAllocationHistory.deleteMany();
  await prisma.budgetAllocation.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.financialYear.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. Create Financial Years
  const fy2025 = await prisma.financialYear.create({
    data: {
      year: 2025,
      label: "FY 2024-2025",
      totalBudget: bdt(8500000), // ৳8.5M
      status: "CLOSED",
      startDate: new Date("2024-07-01T00:00:00Z"),
      endDate: new Date("2025-06-30T23:59:59Z"),
    },
  });

  const fy2026 = await prisma.financialYear.create({
    data: {
      year: 2026,
      label: "FY 2025-2026",
      totalBudget: bdt(10000000), // ৳10,000,000 (৳10M)
      status: "ACTIVE",
      startDate: new Date("2025-07-01T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
    },
  });

  const fy2027 = await prisma.financialYear.create({
    data: {
      year: 2027,
      label: "FY 2026-2027",
      totalBudget: bdt(12000000), // ৳12M
      status: "DRAFT",
      startDate: new Date("2026-07-01T00:00:00Z"),
      endDate: new Date("2027-06-30T23:59:59Z"),
    },
  });

  console.log("✓ Financial Years created (2025 Closed, 2026 Active, 2027 Draft)");

  // 2. Create Standard Naval Expense Categories
  const categoriesData = [
    { name: "Operational", description: "Naval patrol, surveillance, and tactical operations", icon: "Shield" },
    { name: "Maintenance", description: "Vessel, equipment, and structural maintenance", icon: "Wrench" },
    { name: "Equipment", description: "Navigation gear, electronics, safety appliances", icon: "Radio" },
    { name: "Travel", description: "Official transit, dockyard deployments, transit allowance", icon: "Plane" },
    { name: "Transport", description: "Vehicular fuel, jetty logistics, shore support transit", icon: "Truck" },
    { name: "Communication", description: "Satellite link, naval secure radio, telecom links", icon: "Wifi" },
    { name: "Office Supplies", description: "Stationery, administrative computing, registers", icon: "FileText" },
    { name: "Training", description: "Naval warfare drills, certifications, safety courses", icon: "GraduationCap" },
    { name: "Miscellaneous", description: "Unforeseen administrative and contingency expenses", icon: "Layers" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.expenseCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        isDefault: true,
      },
    });
    categories[cat.name] = created.id;
  }
  console.log(`✓ ${categoriesData.length} Expense Categories created`);

  // 3. Create Administrator
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@fleettrack.mil.bd",
      name: "Commodore K. M. Tariqul Islam, ndc, psc",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      serviceId: "NAV-0101",
      rank: "Commodore",
      unit: "Naval Headquarters Administrative Directorate",
      isActive: true,
    },
  });
  console.log(`✓ Admin user created: ${adminUser.email}`);

  // 4. Create Personnel Members with varied target utilization levels
  const personnelSeedList = [
    {
      name: "Commander Faisal Ahmed, psc, BN",
      email: "faisal.ahmed@fleettrack.mil.bd",
      serviceId: "NAV-2041",
      rank: "Commander",
      unit: "Fast Attack Craft Squadron (FAC-1)",
      budget: 350000,
      targetUtilization: 0.96, // 96% Near Limit
    },
    {
      name: "Lieutenant Commander Sadia Rahman, BN",
      email: "sadia.rahman@fleettrack.mil.bd",
      serviceId: "NAV-2042",
      rank: "Lieutenant Commander",
      unit: "Naval Logistics & Supply Depot",
      budget: 400000,
      targetUtilization: 0.98, // 98% Near Maximum (Strict Ceiling)
    },
    {
      name: "Commander M. A. Karim, BN",
      email: "karim.ma@fleettrack.mil.bd",
      serviceId: "NAV-2043",
      rank: "Commander",
      unit: "Naval Technical Workshop & Dockyard",
      budget: 500000,
      targetUtilization: 0.92, // 92% Approaching Limit
    },
    {
      name: "Lieutenant Commander Hasan Mahmud, BN",
      email: "hasan.mahmud@fleettrack.mil.bd",
      serviceId: "NAV-2044",
      rank: "Lieutenant Commander",
      unit: "Directorate of Naval Signals",
      budget: 300000,
      targetUtilization: 0.88, // 88% Approaching
    },
    {
      name: "Lieutenant Tanvir Hossain, BN",
      email: "tanvir.hossain@fleettrack.mil.bd",
      serviceId: "NAV-2045",
      rank: "Lieutenant",
      unit: "Patrol Craft Squadron Bravo",
      budget: 250000,
      targetUtilization: 0.78, // 78% Moderate-High
    },
    {
      name: "Lieutenant Commander Nafis Chowdhury, BN",
      email: "nafis.chowdhury@fleettrack.mil.bd",
      serviceId: "NAV-2046",
      rank: "Lieutenant Commander",
      unit: "Hydrographic & Oceanographic Centre",
      budget: 280000,
      targetUtilization: 0.65, // 65% Moderate
    },
    {
      name: "Lieutenant Rubayet Kabir, BN",
      email: "rubayet.kabir@fleettrack.mil.bd",
      serviceId: "NAV-2047",
      rank: "Lieutenant",
      unit: "Naval Aviation Wing (Helicopter Flight)",
      budget: 450000,
      targetUtilization: 0.48, // 48% Healthy
    },
    {
      name: "Sub-Lieutenant Asif Al-Mamun, BN",
      email: "asif.mamun@fleettrack.mil.bd",
      serviceId: "NAV-2048",
      rank: "Sub-Lieutenant",
      unit: "Naval Base Shore Administration",
      budget: 200000,
      targetUtilization: 0.25, // 25% Healthy
    },
    {
      name: "Commander Zubair Mustafiz, BN",
      email: "zubair.m@fleettrack.mil.bd",
      serviceId: "NAV-2049",
      rank: "Commander",
      unit: "Naval Diving & Salvage Unit",
      budget: 320000,
      targetUtilization: 0.72,
    },
    {
      name: "Lieutenant Commander Farzana Yeasmin, BN",
      email: "farzana.y@fleettrack.mil.bd",
      serviceId: "NAV-2050",
      rank: "Lieutenant Commander",
      unit: "Naval Medical Facility & Trauma Unit",
      budget: 380000,
      targetUtilization: 0.55,
    },
    {
      name: "Lieutenant Imtiaz Qadir, BN",
      email: "imtiaz.q@fleettrack.mil.bd",
      serviceId: "NAV-2051",
      rank: "Lieutenant",
      unit: "Coastal Radar Station Alpha",
      budget: 220000,
      targetUtilization: 0.35,
    },
    {
      name: "Lieutenant Commander Salman Haque, BN",
      email: "salman.h@fleettrack.mil.bd",
      serviceId: "NAV-2052",
      rank: "Lieutenant Commander",
      unit: "Special Warfare Diving & Recon (SWADS)",
      budget: 420000,
      targetUtilization: 0.84,
    },
    {
      name: "Commander Anisur Rahman, BN",
      email: "anisur.r@fleettrack.mil.bd",
      serviceId: "NAV-2053",
      rank: "Commander",
      unit: "Naval Provost & Intelligence Unit",
      budget: 260000,
      targetUtilization: 0.52,
    },
    {
      name: "Lieutenant Mahir Shahriar, BN",
      email: "mahir.s@fleettrack.mil.bd",
      serviceId: "NAV-2054",
      rank: "Lieutenant",
      unit: "Naval Communications Centre Khulna",
      budget: 240000,
      targetUtilization: 0.62,
    },
    {
      name: "Sub-Lieutenant Tahmid Hasan, BN",
      email: "tahmid.h@fleettrack.mil.bd",
      serviceId: "NAV-2055",
      rank: "Sub-Lieutenant",
      unit: "Naval Academy Maritime Training",
      budget: 180000,
      targetUtilization: 0.15,
    },
    {
      name: "Chief Petty Officer Kamal Hossain, BN",
      email: "kamal.hossain@fleettrack.mil.bd",
      serviceId: "NAV-2056",
      rank: "Chief Petty Officer",
      unit: "Naval Armament Depot",
      budget: 150000,
      targetUtilization: 0.40,
    },
    {
      name: "Lieutenant Commander Rezwana Sharmin, BN",
      email: "rezwana.s@fleettrack.mil.bd",
      serviceId: "NAV-2057",
      rank: "Lieutenant Commander",
      unit: "Naval Headquarters Legal Branch",
      budget: 210000,
      targetUtilization: 0.30,
    },
    {
      name: "Lieutenant Enamul Haque, BN",
      email: "enamul.h@fleettrack.mil.bd",
      serviceId: "NAV-2058",
      rank: "Lieutenant",
      unit: "Mine Countermeasures Unit",
      budget: 310000,
      targetUtilization: 0.76,
    },
    {
      name: "Commander Shamsul Arefin, BN",
      email: "shamsul.a@fleettrack.mil.bd",
      serviceId: "NAV-2059",
      rank: "Commander",
      unit: "Naval Gunnery & Missile School",
      budget: 360000,
      targetUtilization: 0.69,
    },
    {
      name: "Sub-Lieutenant Nabil Farhan, BN",
      email: "nabil.f@fleettrack.mil.bd",
      serviceId: "NAV-2060",
      rank: "Sub-Lieutenant",
      unit: "Naval Transport Fleet Dhaka",
      budget: 160000,
      targetUtilization: 0.50,
    },
  ];

  let expenseCounter = 1;
  const sampleExpenseTemplates = [
    { title: "Sonar Calibration Kit Replacement", cat: "Equipment", costRatio: 0.14 },
    { title: "Monthly High-Speed Diesel Fuel - Patrol Unit", cat: "Transport", costRatio: 0.20 },
    { title: "Marine VHF Transceiver Maintenance", cat: "Maintenance", costRatio: 0.12 },
    { title: "Naval Tactics Officer Refreshment Seminar", cat: "Training", costRatio: 0.10 },
    { title: "Administrative Duty Travel Allowance - Chittagong", cat: "Travel", costRatio: 0.08 },
    { title: "Administrative Logbooks & Toner Cartridges", cat: "Office Supplies", costRatio: 0.05 },
    { title: "Auxiliary Water Pump Overhaul Spares", cat: "Maintenance", costRatio: 0.16 },
    { title: "Satellite Data Terminal Bandwidth Renewal", cat: "Communication", costRatio: 0.11 },
    { title: "Night-Vision Goggles Battery Replacements", cat: "Equipment", costRatio: 0.07 },
    { title: "Shore Facility Electrical Safety Overhaul", cat: "Operational", costRatio: 0.15 },
    { title: "Naval Emergency Medical Supplies Replenishment", cat: "Miscellaneous", costRatio: 0.06 },
    { title: "Harbour Inspection Tugboat Charter Contingency", cat: "Operational", costRatio: 0.18 },
  ];

  for (const personData of personnelSeedList) {
    const user = await prisma.user.create({
      data: {
        email: personData.email,
        name: personData.name,
        passwordHash: defaultPasswordHash,
        role: "PERSONNEL",
        serviceId: personData.serviceId,
        rank: personData.rank,
        unit: personData.unit,
        isActive: true,
      },
    });

    // Create 2026 Allocation
    const allocation = await prisma.budgetAllocation.create({
      data: {
        userId: user.id,
        financialYearId: fy2026.id,
        allocatedAmount: bdt(personData.budget),
        notes: `Annual operational quota allocated for ${personData.unit}`,
      },
    });

    // Also create 2025 Allocation for historical records
    await prisma.budgetAllocation.create({
      data: {
        userId: user.id,
        financialYearId: fy2025.id,
        allocatedAmount: bdt(Math.round(personData.budget * 0.9)),
        notes: `Preserved record for FY 2024-2025`,
      },
    });

    // Allocation history
    await prisma.budgetAllocationHistory.create({
      data: {
        allocationId: allocation.id,
        changedById: adminUser.id,
        previousAmount: BigInt(0),
        newAmount: bdt(personData.budget),
        reason: "Initial baseline allocation approved by Directorate",
      },
    });

    // Generate realistic expenses to hit target utilization
    const targetCommittedBDT = personData.budget * personData.targetUtilization;
    let accumulatedBDT = 0;
    let templateIdx = 0;

    // Pick how much is approved vs pending
    const targetApprovedRatio = personData.targetUtilization > 0.9 ? 0.88 : 0.80;
    const targetApprovedBDT = targetCommittedBDT * targetApprovedRatio;

    while (accumulatedBDT < targetCommittedBDT && accumulatedBDT < personData.budget) {
      const template = sampleExpenseTemplates[templateIdx % sampleExpenseTemplates.length];
      templateIdx++;

      let itemAmount = Math.max(3000, Math.round(personData.budget * template.costRatio));
      if (accumulatedBDT + itemAmount > targetCommittedBDT) {
        itemAmount = Math.max(1000, Math.round(targetCommittedBDT - accumulatedBDT));
      }
      if (accumulatedBDT + itemAmount > personData.budget) {
        itemAmount = Math.max(0, personData.budget - accumulatedBDT);
      }
      if (itemAmount <= 0) break;

      const isApproved = accumulatedBDT + itemAmount <= targetApprovedBDT;
      const status = isApproved
        ? "APPROVED"
        : (accumulatedBDT % 2 === 0 ? "PENDING" : "PROCESSING");

      const daysAgo = Math.floor(Math.random() * 120) + 1;
      const expenseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const expRef = `EXP-2026-${String(expenseCounter).padStart(4, "0")}`;
      expenseCounter++;

      const categoryId = categories[template.cat] || categories["Operational"];

      await prisma.expense.create({
        data: {
          userId: user.id,
          financialYearId: fy2026.id,
          categoryId: categoryId,
          title: template.title,
          description: `Authorized expenditure voucher for ${personData.unit} operational requirements.`,
          amount: bdt(itemAmount),
          referenceNumber: expRef,
          date: expenseDate,
          status: status,
          notes: status === "APPROVED" ? "Approved by Administrative Officer" : "Submitted for verification",
        },
      });

      accumulatedBDT += itemAmount;
    }

    // Add 1 or 2 Rejected or Cancelled records occasionally
    if (personData.targetUtilization > 0.6) {
      const rejRef = `EXP-2026-${String(expenseCounter).padStart(4, "0")}`;
      expenseCounter++;
      await prisma.expense.create({
        data: {
          userId: user.id,
          financialYearId: fy2026.id,
          categoryId: categories["Miscellaneous"],
          title: "Non-standard Wardroom Decorative Furniture",
          description: "Requisitioned without formal departmental sanction.",
          amount: bdt(18000),
          referenceNumber: rejRef,
          date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          status: "REJECTED",
          notes: "Rejected due to lack of prior procurement requisition form.",
        },
      });
    }
  }

  // 5. Seed realistic Audit Logs
  const auditEntries = [
    {
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: "ADMIN",
      action: "YEAR_CREATED",
      entityType: "FinancialYear",
      entityId: fy2026.id,
      newValue: { year: 2026, budget: "৳10,000,000", status: "ACTIVE" },
    },
    {
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: "ADMIN",
      action: "ALLOCATION_CHANGED",
      entityType: "BudgetAllocation",
      entityId: "NAV-2041",
      previousValue: { allocated: "৳300,000" },
      newValue: { allocated: "৳350,000", reason: "Additional patrol craft maintenance provision" },
    },
    {
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: "ADMIN",
      action: "EXPENSE_STATUS_CHANGED",
      entityType: "Expense",
      entityId: "EXP-2026-0004",
      previousValue: { status: "PROCESSING" },
      newValue: { status: "APPROVED", approvedBy: "Commodore Tariqul Islam" },
    },
    {
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: "ADMIN",
      action: "USER_CREATED",
      entityType: "User",
      entityId: "NAV-2060",
      newValue: { name: "Sub-Lieutenant Nabil Farhan, BN", rank: "Sub-Lieutenant" },
    },
  ];

  for (const log of auditEntries) {
    await prisma.auditLog.create({
      data: {
        actorId: log.actorId,
        actorName: log.actorName,
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        previousValue: log.previousValue ? JSON.stringify(log.previousValue) : null,
        newValue: log.newValue ? JSON.stringify(log.newValue) : null,
        ipAddress: "192.168.10.42",
      },
    });
  }

  console.log(`✓ Generated ${expenseCounter - 1} realistic expenses with accurate utilization spectrum!`);
  console.log("✓ Audit logs recorded");
  console.log("⚓ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
