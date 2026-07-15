// ── developerData.js ───────────────────────────────────────────────
// P0-7: وحدة المطورين — mock data (مطابقة DeveloperUnitsController + DeveloperAdminController في Flutter)
//
// ملاحظة: Flutter نفسها تستخدم mock data حالياً (loadFromSupabase throws UnimplementedError)
// لذا نطبق نفس المنطق هنا.
//
// يحتوي على:
//   - PaymentCalcResult.calculate (مطابق Flutter بالضبط)
//   - Mock data: DeveloperProject + buildings + units + bookings
//   - State mutations: updateUnitStatus, submitBooking, approveBooking, rejectBooking, lockUnit, unlockUnit

// ════════════════════════════════════════════════════════════════════
// MODELS (مطابقة Flutter)
// ════════════════════════════════════════════════════════════════════

export const UnitStatus = {
  AVAILABLE: "available",
  RESERVED:  "reserved",
  SOLD:      "sold",
  LOCKED:    "locked",
};

export const BookingStatus = {
  PENDING:   "pending",
  CONFIRMED: "confirmed",
  REJECTED:  "rejected",
};

export const InstallmentFrequency = {
  MONTHLY:    { value: "monthly",    paymentsPerYear: 12, label: "Monthly"    },
  QUARTERLY:  { value: "quarterly",  paymentsPerYear: 4,  label: "Quarterly"  },
  YEARLY:     { value: "yearly",     paymentsPerYear: 1,  label: "Yearly"     },
};

export const PaymentMode = {
  CASH:         "cash",
  INSTALLMENTS: "installments",
};

// ════════════════════════════════════════════════════════════════════
// PAYMENT CALCULATOR (مطابق PaymentCalcResult.calculate في Flutter بالضبط)
// ════════════════════════════════════════════════════════════════════

export function calculatePayment(input) {
  const {
    originalPrice,
    paymentMode,
    discountPercent,
    downPaymentPercent,
    installmentYears,
    frequency,
    utilitiesFee,
    utilitiesDiscount,
    maintenanceDepositPercent,
    maintenanceDiscount,
  } = input;

  // 1) Discount
  const discountPct = Math.min(Math.max(discountPercent || 0, 0), 100);
  const discountAmount = originalPrice * (discountPct / 100);
  const priceAfterDiscount = originalPrice - discountAmount;

  // 2) Down payment
  const downPayment = priceAfterDiscount * ((downPaymentPercent || 0) / 100);
  const remaining = priceAfterDiscount - downPayment;

  // 3) Installments
  let installmentCount = 0;
  let installmentAmount = 0;
  if (paymentMode === PaymentMode.INSTALLMENTS) {
    const freq = Object.values(InstallmentFrequency).find(f => f.value === frequency) || InstallmentFrequency.MONTHLY;
    installmentCount = (installmentYears || 0) * freq.paymentsPerYear;
    installmentAmount = installmentCount > 0 ? remaining / installmentCount : 0;
  }
  // cash: count=0, amount=0 (remaining paid on delivery)

  // 4) Utilities (after discount)
  const utilitiesOriginal = utilitiesFee || 0;
  const utilitiesAfter = utilitiesOriginal * (1 - (utilitiesDiscount || 0) / 100);

  // 5) Maintenance deposit
  const maintenanceOriginal = originalPrice * ((maintenanceDepositPercent || 0) / 100);
  const maintenanceAfter = maintenanceOriginal * (1 - (maintenanceDiscount || 0) / 100);

  // 6) Final total (down payment already included in priceAfterDiscount)
  const finalTotal = priceAfterDiscount + utilitiesAfter + maintenanceAfter;

  return {
    originalPrice,
    discountAmount:      Number(discountAmount.toFixed(2)),
    priceAfterDiscount:  Number(priceAfterDiscount.toFixed(2)),
    downPayment:         Number(downPayment.toFixed(2)),
    remaining:           Number(remaining.toFixed(2)),
    installmentCount,
    installmentAmount:   Number(installmentAmount.toFixed(2)),
    utilitiesOriginal:   Number(utilitiesOriginal.toFixed(2)),
    utilitiesAfter:      Number(utilitiesAfter.toFixed(2)),
    maintenanceOriginal: Number(maintenanceOriginal.toFixed(2)),
    maintenanceAfter:    Number(maintenanceAfter.toFixed(2)),
    finalTotal:          Number(finalTotal.toFixed(2)),
  };
}

// ════════════════════════════════════════════════════════════════════
// MOCK DATA (مطابقة DeveloperUnitsController._loadMock + DeveloperAdminController._loadMockBookings)
// ════════════════════════════════════════════════════════════════════

// إعدادات المشروع (مطابقة Flutter)
export const PROJECT_SETTINGS = {
  maxDiscountPercent: 7,
  utilitiesFee: 75000,
  maintenanceDepositPercent: 8,
};

function createMockProject() {
  // مطابقة Flutter: ONYX Heights — New Cairo
  // Building A: 5 floors × 4 units = 20 units
  // Building B: 4 floors × 3 units = 12 units
  // First unit of each building = reserved, 2nd = sold, 3rd = locked, rest = available

  const buildings = [
    {
      id: "bldg-a",
      name: "Building A",
      floors: 5,
      units: [],
    },
    {
      id: "bldg-b",
      name: "Building B",
      floors: 4,
      units: [],
    },
  ];

  // Building A: 5 floors × 4 units
  let unitCounter = 0;
  for (let floor = 1; floor <= 5; floor++) {
    for (let u = 1; u <= 4; u++) {
      unitCounter++;
      const code = `A-${floor}${String(u).padStart(2, "0")}`;
      const area = 120 + (u * 15); // 135, 150, 165, 180
      const pricePerMeter = 18000 + (floor * 500); // increases with floor
      let status = UnitStatus.AVAILABLE;
      // First unit of building = reserved
      if (floor === 1 && u === 1) status = UnitStatus.RESERVED;
      // 2nd = sold
      if (floor === 1 && u === 2) status = UnitStatus.SOLD;

      buildings[0].units.push({
        id: `unit-${unitCounter}`,
        code,
        buildingId: "bldg-a",
        floor,
        areaSqm: area,
        pricePerMeter,
        status,
        bedrooms: u <= 2 ? 2 : u <= 3 ? 3 : 4,
        bathrooms: u <= 2 ? 2 : 3,
      });
    }
  }

  // Building B: 4 floors × 3 units
  for (let floor = 1; floor <= 4; floor++) {
    for (let u = 1; u <= 3; u++) {
      unitCounter++;
      const code = `B-${floor}${String(u).padStart(2, "0")}`;
      const area = 150 + (u * 20); // 170, 190, 210
      const pricePerMeter = 19000 + (floor * 700);
      let status = UnitStatus.AVAILABLE;
      if (floor === 1 && u === 1) status = UnitStatus.RESERVED;
      if (floor === 1 && u === 2) status = UnitStatus.SOLD;
      if (floor === 1 && u === 3) status = UnitStatus.LOCKED;

      buildings[1].units.push({
        id: `unit-${unitCounter}`,
        code,
        buildingId: "bldg-b",
        floor,
        areaSqm: area,
        pricePerMeter,
        status,
        bedrooms: u === 1 ? 2 : 3,
        bathrooms: 2,
      });
    }
  }

  return {
    id: "proj-1",
    name: "ONYX Heights",
    location: "New Cairo",
    maxDiscountPercent: PROJECT_SETTINGS.maxDiscountPercent,
    utilitiesFee: PROJECT_SETTINGS.utilitiesFee,
    maintenanceDepositPercent: PROJECT_SETTINGS.maintenanceDepositPercent,
    buildings,
  };
}

function createMockBookings(units) {
  // 3 pending + 2 confirmed + 1 rejected (مطابقة Flutter)
  const availableUnits = units.filter(u => u.status === UnitStatus.AVAILABLE);
  const reservedUnits = units.filter(u => u.status === UnitStatus.RESERVED);

  const bookings = [];

  // 3 pending
  for (let i = 0; i < 3 && i < availableUnits.length; i++) {
    const unit = availableUnits[i];
    const originalPrice = unit.areaSqm * unit.pricePerMeter;
    const calc = calculatePayment({
      originalPrice,
      paymentMode: PaymentMode.INSTALLMENTS,
      discountPercent: 5,
      downPaymentPercent: 20,
      installmentYears: 5,
      frequency: "quarterly",
      utilitiesFee: PROJECT_SETTINGS.utilitiesFee,
      utilitiesDiscount: 0,
      maintenanceDepositPercent: PROJECT_SETTINGS.maintenanceDepositPercent,
      maintenanceDiscount: 0,
    });

    bookings.push({
      id: `booking-pending-${i + 1}`,
      unitId: unit.id,
      unitCode: unit.code,
      projectId: "proj-1",
      projectName: "ONYX Heights",
      salesId: `sales-${i + 1}`,
      salesName: ["Ahmed", "Sara", "Mohamed"][i],
      buyerName: ["Omar Khalil", "Layla Hassan", "Karim Adel"][i],
      buyerPhone: ["01012345678", "01098765432", "01155667788"][i],
      buyerEmail: ["omar@example.com", "layla@example.com", "karim@example.com"][i],
      buyerNationalId: ["29801011234567", "29902051234567", "29503101234567"][i],
      priceSnapshot: calc,
      status: BookingStatus.PENDING,
      note: ["First-time buyer", "Investor", "End-user"][i],
      createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
      decidedAt: null,
      adminNote: null,
    });
  }

  // 2 confirmed
  for (let i = 0; i < 2 && i < reservedUnits.length; i++) {
    const unit = reservedUnits[i];
    const originalPrice = unit.areaSqm * unit.pricePerMeter;
    const calc = calculatePayment({
      originalPrice,
      paymentMode: PaymentMode.CASH,
      discountPercent: 3,
      downPaymentPercent: 100,
      installmentYears: 0,
      frequency: "monthly",
      utilitiesFee: PROJECT_SETTINGS.utilitiesFee,
      utilitiesDiscount: 10,
      maintenanceDepositPercent: PROJECT_SETTINGS.maintenanceDepositPercent,
      maintenanceDiscount: 0,
    });

    bookings.push({
      id: `booking-confirmed-${i + 1}`,
      unitId: unit.id,
      unitCode: unit.code,
      projectId: "proj-1",
      projectName: "ONYX Heights",
      salesId: `sales-confirmed-${i + 1}`,
      salesName: ["Fatma", "Yasmin"][i],
      buyerName: ["Nour Sami", "Hana Tarek"][i],
      buyerPhone: ["01234567890", "01234567891"][i],
      buyerEmail: ["nour@example.com", "hana@example.com"][i],
      buyerNationalId: ["29801019999991", "29801019999992"][i],
      priceSnapshot: calc,
      status: BookingStatus.CONFIRMED,
      note: "",
      createdAt: new Date(Date.now() - (i + 4) * 24 * 60 * 60 * 1000).toISOString(),
      decidedAt: new Date(Date.now() - (i + 3) * 24 * 60 * 60 * 1000).toISOString(),
      adminNote: "Approved",
    });
  }

  // 1 rejected
  if (availableUnits.length > 3) {
    const unit = availableUnits[3];
    const originalPrice = unit.areaSqm * unit.pricePerMeter;
    const calc = calculatePayment({
      originalPrice,
      paymentMode: PaymentMode.INSTALLMENTS,
      discountPercent: 7,
      downPaymentPercent: 10,
      installmentYears: 7,
      frequency: "monthly",
      utilitiesFee: PROJECT_SETTINGS.utilitiesFee,
      utilitiesDiscount: 0,
      maintenanceDepositPercent: PROJECT_SETTINGS.maintenanceDepositPercent,
      maintenanceDiscount: 0,
    });

    bookings.push({
      id: "booking-rejected-1",
      unitId: unit.id,
      unitCode: unit.code,
      projectId: "proj-1",
      projectName: "ONYX Heights",
      salesId: "sales-rejected-1",
      salesName: "Tarek",
      buyerName: "Rejected Buyer",
      buyerPhone: "01000000000",
      buyerEmail: "rejected@example.com",
      buyerNationalId: "29801010000000",
      priceSnapshot: calc,
      status: BookingStatus.REJECTED,
      note: "Test booking",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      decidedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      adminNote: "Rejected: insufficient down payment",
    });
  }

  return bookings;
}

// ════════════════════════════════════════════════════════════════════
// DEVELOPER STORE (mock state)
// ════════════════════════════════════════════════════════════════════

let _project = null;
let _bookings = [];

export function getDeveloperProject() {
  if (!_project) {
    _project = createMockProject();
    const allUnits = _project.buildings.flatMap(b => b.units);
    _bookings = createMockBookings(allUnits);
  }
  return _project;
}

export function getDeveloperBookings() {
  if (!_project) getDeveloperProject();
  return _bookings;
}

export function getAllUnits() {
  const project = getDeveloperProject();
  return project.buildings.flatMap(b => b.units);
}

export function findUnit(unitId) {
  return getAllUnits().find(u => u.id === unitId);
}

// ── Mutations ────────────────────────────────────────────────────────

export function updateUnitStatus(unitId, newStatus) {
  const unit = findUnit(unitId);
  if (unit) unit.status = newStatus;
}

export function submitBooking({ unit, priceSnapshot, salesId, salesName, buyerName, buyerPhone, buyerEmail, buyerNationalId, note }) {
  // مطابقة Flutter: returns mock id, لا يغير حالة الوحدة (الأدمن يقرر)
  const id = `mock-${Date.now()}`;
  const booking = {
    id,
    unitId: unit.id,
    unitCode: unit.code,
    projectId: "proj-1",
    projectName: "ONYX Heights",
    salesId,
    salesName,
    buyerName,
    buyerPhone,
    buyerEmail,
    buyerNationalId,
    priceSnapshot,
    status: BookingStatus.PENDING,
    note: note || "",
    createdAt: new Date().toISOString(),
    decidedAt: null,
    adminNote: null,
  };
  _bookings.unshift(booking);
  return booking;
}

export function approveBooking(bookingId, adminNote = "Approved") {
  const booking = _bookings.find(b => b.id === bookingId);
  if (!booking) return false;
  booking.status = BookingStatus.CONFIRMED;
  booking.decidedAt = new Date().toISOString();
  booking.adminNote = adminNote;
  // مطابقة Flutter: confirmed → unit يصبح reserved
  updateUnitStatus(booking.unitId, UnitStatus.RESERVED);
  return true;
}

export function rejectBooking(bookingId, adminNote = "Rejected") {
  const booking = _bookings.find(b => b.id === bookingId);
  if (!booking) return false;
  booking.status = BookingStatus.REJECTED;
  booking.decidedAt = new Date().toISOString();
  booking.adminNote = adminNote;
  // مطابقة Flutter: rejected → unit يعود available
  updateUnitStatus(booking.unitId, UnitStatus.AVAILABLE);
  return true;
}

export function lockUnit(unitId) {
  updateUnitStatus(unitId, UnitStatus.LOCKED);
}

export function unlockUnit(unitId) {
  updateUnitStatus(unitId, UnitStatus.AVAILABLE);
}

// ── Stats ───────────────────────────────────────────────────────────

export function getDeveloperStats() {
  const units = getAllUnits();
  const bookings = getDeveloperBookings();

  const unitCounts = {
    available: units.filter(u => u.status === UnitStatus.AVAILABLE).length,
    reserved:  units.filter(u => u.status === UnitStatus.RESERVED).length,
    sold:      units.filter(u => u.status === UnitStatus.SOLD).length,
    locked:    units.filter(u => u.status === UnitStatus.LOCKED).length,
  };

  const bookingCounts = {
    pending:   bookings.filter(b => b.status === BookingStatus.PENDING).length,
    confirmed: bookings.filter(b => b.status === BookingStatus.CONFIRMED).length,
    rejected:  bookings.filter(b => b.status === BookingStatus.REJECTED).length,
  };

  return { unitCounts, bookingCounts, totalUnits: units.length };
}
