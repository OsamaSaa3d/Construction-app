import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  max: 5,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    name: "Cement & Concrete",
    nameAr: "الأسمنت والخرسانة",
    slug: "cement-concrete",
    children: [
      { name: "Portland Cement", nameAr: "أسمنت بورتلاندي", slug: "portland-cement" },
      { name: "Ready Mix Concrete", nameAr: "خرسانة جاهزة", slug: "ready-mix-concrete" },
      { name: "Concrete Blocks", nameAr: "بلوك خرساني", slug: "concrete-blocks" },
    ],
  },
  {
    name: "Steel & Metals",
    nameAr: "الحديد والمعادن",
    slug: "steel-metals",
    children: [
      { name: "Rebar", nameAr: "حديد تسليح", slug: "rebar" },
      { name: "Steel Sheets", nameAr: "ألواح صلب", slug: "steel-sheets" },
      { name: "Aluminum", nameAr: "ألمنيوم", slug: "aluminum" },
    ],
  },
  {
    name: "Wood & Timber",
    nameAr: "الخشب والأخشاب",
    slug: "wood-timber",
    children: [
      { name: "Plywood", nameAr: "خشب رقائقي", slug: "plywood" },
      { name: "MDF", nameAr: "ألواح MDF", slug: "mdf" },
      { name: "Hardwood", nameAr: "خشب صلب", slug: "hardwood" },
    ],
  },
  {
    name: "Tiles & Ceramics",
    nameAr: "البلاط والسيراميك",
    slug: "tiles-ceramics",
    children: [
      { name: "Floor Tiles", nameAr: "بلاط أرضيات", slug: "floor-tiles" },
      { name: "Wall Tiles", nameAr: "بلاط جدران", slug: "wall-tiles" },
      { name: "Porcelain", nameAr: "بورسلين", slug: "porcelain" },
      { name: "Marble", nameAr: "رخام", slug: "marble" },
    ],
  },
  {
    name: "Paints & Coatings",
    nameAr: "الدهانات والطلاء",
    slug: "paints-coatings",
    children: [
      { name: "Interior Paint", nameAr: "دهان داخلي", slug: "interior-paint" },
      { name: "Exterior Paint", nameAr: "دهان خارجي", slug: "exterior-paint" },
      { name: "Primers", nameAr: "بطانة", slug: "primers" },
    ],
  },
  {
    name: "Plumbing",
    nameAr: "السباكة",
    slug: "plumbing",
    children: [
      { name: "Pipes", nameAr: "أنابيب", slug: "pipes" },
      { name: "Fittings", nameAr: "وصلات", slug: "fittings" },
      { name: "Sanitary Ware", nameAr: "أدوات صحية", slug: "sanitary-ware" },
    ],
  },
  {
    name: "Electrical",
    nameAr: "الكهرباء",
    slug: "electrical",
    children: [
      { name: "Cables & Wires", nameAr: "كابلات وأسلاك", slug: "cables-wires" },
      { name: "Switches & Sockets", nameAr: "مفاتيح ومقابس", slug: "switches-sockets" },
      { name: "Lighting", nameAr: "إضاءة", slug: "lighting" },
    ],
  },
  {
    name: "Insulation",
    nameAr: "العزل",
    slug: "insulation",
    children: [
      { name: "Thermal Insulation", nameAr: "عزل حراري", slug: "thermal-insulation" },
      { name: "Waterproofing", nameAr: "عزل مائي", slug: "waterproofing" },
    ],
  },
  {
    name: "Sand & Aggregates",
    nameAr: "الرمل والركام",
    slug: "sand-aggregates",
    children: [
      { name: "Sand", nameAr: "رمل", slug: "sand" },
      { name: "Gravel", nameAr: "حصى", slug: "gravel" },
      { name: "Crushed Stone", nameAr: "حجر مكسر", slug: "crushed-stone" },
    ],
  },
  {
    name: "Doors & Windows",
    nameAr: "الأبواب والنوافذ",
    slug: "doors-windows",
    children: [
      { name: "Wooden Doors", nameAr: "أبواب خشبية", slug: "wooden-doors" },
      { name: "Aluminum Windows", nameAr: "نوافذ ألمنيوم", slug: "aluminum-windows" },
      { name: "Glass", nameAr: "زجاج", slug: "glass" },
    ],
  },
];

const units = [
  { name: "square meter", nameAr: "متر مربع", symbol: "m²" },
  { name: "cubic meter", nameAr: "متر مكعب", symbol: "m³" },
  { name: "linear meter", nameAr: "متر طولي", symbol: "m" },
  { name: "kilogram", nameAr: "كيلوغرام", symbol: "kg" },
  { name: "ton", nameAr: "طن", symbol: "t" },
  { name: "piece", nameAr: "قطعة", symbol: "pc" },
  { name: "bag", nameAr: "كيس", symbol: "bag" },
  { name: "roll", nameAr: "لفة", symbol: "roll" },
  { name: "liter", nameAr: "لتر", symbol: "L" },
  { name: "gallon", nameAr: "غالون", symbol: "gal" },
  { name: "sheet", nameAr: "لوح", symbol: "sht" },
  { name: "box", nameAr: "صندوق", symbol: "box" },
  { name: "bundle", nameAr: "حزمة", symbol: "bdl" },
  { name: "set", nameAr: "طقم", symbol: "set" },
];

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // ─── Units ────────────────────────────────────────────────────────────────────
  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  const allUnits = await prisma.unitOfMeasure.findMany();
  const u = (symbol: string) => {
    const asciiSymbol = symbol.replace("²", "2").replace("³", "3");
    const unit = allUnits.find((item) => item.symbol === symbol || item.symbol === asciiSymbol);
    if (!unit) {
      throw new Error(`Unit with symbol ${symbol} not found`);
    }
    return unit;
  };
  console.log(`Seeded ${units.length} units`);

  // ─── Categories ───────────────────────────────────────────────────────────────
  for (const cat of categories) {
    const parent = await prisma.materialCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, nameAr: cat.nameAr, slug: cat.slug },
    });
    for (const child of cat.children) {
      await prisma.materialCategory.upsert({
        where: { slug: child.slug },
        update: {},
        create: { name: child.name, nameAr: child.nameAr, slug: child.slug, parentId: parent.id },
      });
    }
  }
  const allCats = await prisma.materialCategory.findMany();
  const catBySlug = (slug: string) => allCats.find((c) => c.slug === slug)!;
  console.log(`Seeded categories`);

  // ─── Users ────────────────────────────────────────────────────────────────────

  // Suppliers
  const sup1User = await prisma.user.upsert({
    where: { email: "supplier1@monzer.ae" },
    update: {},
    create: {
      email: "supplier1@monzer.ae",
      name: "Ahmed Al Mansouri",
      nameAr: "أحمد المنصوري",
      passwordHash: password,
      role: "SUPPLIER",
      status: "ACTIVE",
    },
  });
  const sup2User = await prisma.user.upsert({
    where: { email: "supplier2@monzer.ae" },
    update: {},
    create: {
      email: "supplier2@monzer.ae",
      name: "Sara Al Zaabi",
      nameAr: "سارة الزعابي",
      passwordHash: password,
      role: "SUPPLIER",
      status: "ACTIVE",
    },
  });
  const sup3User = await prisma.user.upsert({
    where: { email: "supplier3@monzer.ae" },
    update: {},
    create: {
      email: "supplier3@monzer.ae",
      name: "Gulf Steel Trading",
      nameAr: "خليج ستيل تريدينج",
      passwordHash: password,
      role: "SUPPLIER",
      status: "ACTIVE",
    },
  });

  // Contractors
  const con1User = await prisma.user.upsert({
    where: { email: "contractor1@monzer.ae" },
    update: {},
    create: {
      email: "contractor1@monzer.ae",
      name: "Mohammed Al Rashidi",
      nameAr: "محمد الراشدي",
      passwordHash: password,
      role: "CONTRACTOR",
      status: "ACTIVE",
    },
  });
  const con2User = await prisma.user.upsert({
    where: { email: "contractor2@monzer.ae" },
    update: {},
    create: {
      email: "contractor2@monzer.ae",
      name: "Layla Hassan",
      nameAr: "ليلى حسن",
      passwordHash: password,
      role: "CONTRACTOR",
      status: "ACTIVE",
    },
  });

  // Consultant
  const consultant1User = await prisma.user.upsert({
    where: { email: "consultant1@monzer.ae" },
    update: {},
    create: {
      email: "consultant1@monzer.ae",
      name: "Omar Al Farsi",
      nameAr: "عمر الفارسي",
      passwordHash: password,
      role: "CONSULTANT",
      status: "ACTIVE",
    },
  });

  // Customer
  const cust1User = await prisma.user.upsert({
    where: { email: "customer1@monzer.ae" },
    update: {},
    create: {
      email: "customer1@monzer.ae",
      name: "Fatima Al Dhaheri",
      nameAr: "فاطمة الظاهري",
      passwordHash: password,
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });

  console.log("Seeded 7 users (password: password123)");

  // ─── Profiles ─────────────────────────────────────────────────────────────────

  const sup1Profile = await prisma.supplierProfile.upsert({
    where: { userId: sup1User.id },
    update: {},
    create: {
      userId: sup1User.id,
      companyName: "Al Mansouri Building Materials",
      companyNameAr: "المنصوري لمواد البناء",
      tradeLicense: "TL-DXB-12345",
      city: "DUBAI",
      latitude: 25.2048,
      longitude: 55.2708,
      address: "Al Quoz Industrial Area 4, Dubai",
      description: "Leading supplier of cement, concrete, and aggregates in Dubai.",
      isVerified: true,
    },
  });

  const sup2Profile = await prisma.supplierProfile.upsert({
    where: { userId: sup2User.id },
    update: {},
    create: {
      userId: sup2User.id,
      companyName: "Zaabi Tiles & Ceramics",
      companyNameAr: "الزعابي للبلاط والسيراميك",
      tradeLicense: "TL-SHJ-22222",
      city: "SHARJAH",
      latitude: 25.3463,
      longitude: 55.4209,
      address: "Industrial Area 15, Sharjah",
      description: "Premium tiles, ceramics, and interior finishes.",
      isVerified: true,
    },
  });

  const sup3Profile = await prisma.supplierProfile.upsert({
    where: { userId: sup3User.id },
    update: {},
    create: {
      userId: sup3User.id,
      companyName: "Gulf Steel Trading LLC",
      companyNameAr: "خليج ستيل تريدينج ذ.م.م",
      tradeLicense: "TL-AUH-33333",
      city: "ABU_DHABI",
      latitude: 24.4539,
      longitude: 54.3773,
      address: "Mussafah Industrial Area, Abu Dhabi",
      description: "Steel rebar, sheets, and structural steel.",
      isVerified: false,
    },
  });

  const con1Profile = await prisma.contractorProfile.upsert({
    where: { userId: con1User.id },
    update: {},
    create: {
      userId: con1User.id,
      companyName: "Rashidi Construction Co.",
      companyNameAr: "الراشدي للمقاولات",
      tradeLicense: "TL-DXB-44444",
      city: "DUBAI",
      address: "Business Bay, Dubai",
    },
  });

  const con2Profile = await prisma.contractorProfile.upsert({
    where: { userId: con2User.id },
    update: {},
    create: {
      userId: con2User.id,
      companyName: "Hassan Build Group",
      companyNameAr: "حسن للإنشاءات",
      tradeLicense: "TL-SHJ-55555",
      city: "SHARJAH",
      address: "Al Majaz, Sharjah",
    },
  });

  await prisma.consultantProfile.upsert({
    where: { userId: consultant1User.id },
    update: {},
    create: {
      userId: consultant1User.id,
      companyName: "Al Farsi Consultants",
      companyNameAr: "الفارسي للاستشارات",
      specialization: "Structural Engineering",
      city: "ABU_DHABI",
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: cust1User.id },
    update: {},
    create: {
      userId: cust1User.id,
      city: "DUBAI",
    },
  });

  console.log("Seeded profiles");

  // ─── Inventory ────────────────────────────────────────────────────────────────

  const [portlandCat, rebarCat, floorTilesCat, interiorPaintCat, pipesCat, sandCat] = [
    catBySlug("portland-cement"),
    catBySlug("rebar"),
    catBySlug("floor-tiles"),
    catBySlug("interior-paint"),
    catBySlug("pipes"),
    catBySlug("sand"),
  ];

  const inv1 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-1" },
    update: {},
    create: {
      id: "seed-inv-1",
      supplierId: sup1Profile.id,
      name: "Portland Cement 50kg",
      nameAr: "أسمنت بورتلاندي 50 كجم",
      categoryId: portlandCat.id,
      unitId: u("bag").id,
      pricePerUnit: 28.5,
      minOrderQty: 50,
      quantityInStock: 5000,
      sku: "CEM-PORT-50",
      brand: "Emirates Cement",
      description: "High-quality Grade 42.5 Portland Cement, suitable for all construction.",
      isActive: true,
      canUrgentDeliver: true,
    },
  });

  const inv2 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-2" },
    update: {},
    create: {
      id: "seed-inv-2",
      supplierId: sup1Profile.id,
      name: "Sharp Sand",
      nameAr: "رمل حاد",
      categoryId: sandCat.id,
      unitId: u("t").id,
      pricePerUnit: 85,
      minOrderQty: 5,
      quantityInStock: 2000,
      sku: "SAND-SHP-T",
      description: "Washed sharp sand for concrete mixing.",
      isActive: true,
      canUrgentDeliver: true,
    },
  });

  const inv3 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-3" },
    update: {},
    create: {
      id: "seed-inv-3",
      supplierId: sup2Profile.id,
      name: "60×60 Porcelain Floor Tile",
      nameAr: "بلاطة أرضية بورسلين 60×60",
      categoryId: floorTilesCat.id,
      unitId: u("m²").id,
      pricePerUnit: 65,
      minOrderQty: 20,
      quantityInStock: 800,
      sku: "TILE-POR-6060",
      brand: "Rak Ceramics",
      description: "Premium 60×60 cm polished porcelain tiles.",
      isActive: true,
    },
  });

  const inv4 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-4" },
    update: {},
    create: {
      id: "seed-inv-4",
      supplierId: sup2Profile.id,
      name: "Interior Emulsion Paint 20L",
      nameAr: "دهان داخلي 20 لتر",
      categoryId: interiorPaintCat.id,
      unitId: u("gal").id,
      pricePerUnit: 120,
      minOrderQty: 5,
      quantityInStock: 400,
      sku: "PAINT-INT-20L",
      brand: "Jotun",
      description: "Washable interior emulsion paint, 20L tin.",
      isActive: true,
    },
  });

  const inv5 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-5" },
    update: {},
    create: {
      id: "seed-inv-5",
      supplierId: sup3Profile.id,
      name: "12mm Steel Rebar T12",
      nameAr: "حديد تسليح 12 مم T12",
      categoryId: rebarCat.id,
      unitId: u("t").id,
      pricePerUnit: 3200,
      minOrderQty: 1,
      quantityInStock: 500,
      sku: "STL-RBR-T12",
      brand: "Emirates Steel",
      description: "Grade 60 deformed steel bar T12, 12-meter lengths.",
      isActive: true,
      canUrgentDeliver: false,
    },
  });

  const inv6 = await prisma.inventoryItem.upsert({
    where: { id: "seed-inv-6" },
    update: {},
    create: {
      id: "seed-inv-6",
      supplierId: sup1Profile.id,
      name: "uPVC Pipes DN110",
      nameAr: "أنابيب PVC قطر 110",
      categoryId: pipesCat.id,
      unitId: u("m").id,
      pricePerUnit: 18.5,
      minOrderQty: 100,
      quantityInStock: 3000,
      sku: "PIPE-PVC-110",
      description: "uPVC drainage pipes, DN110, 6-meter lengths.",
      isActive: true,
    },
  });

  console.log("Seeded 6 inventory items");

  // ─── Marketplace Listings ─────────────────────────────────────────────────────

  for (const inv of [inv1, inv3, inv5]) {
    await prisma.marketplaceListing.upsert({
      where: { inventoryItemId: inv.id },
      update: {},
      create: {
        supplierId: inv.id === inv1.id ? sup1Profile.id : inv.id === inv3.id ? sup2Profile.id : sup3Profile.id,
        inventoryItemId: inv.id,
        categoryId: inv.categoryId,
        title: inv.name,
        titleAr: inv.nameAr,
        description: inv.description,
        price: inv.pricePerUnit,
        isActive: true,
      },
    });
  }
  console.log("Seeded 3 marketplace listings");

  // ─── BOQs ─────────────────────────────────────────────────────────────────────

  const boq1 = await prisma.bOQ.upsert({
    where: { id: "seed-boq-1" },
    update: {},
    create: {
      id: "seed-boq-1",
      createdByUserId: con1User.id,
      contractorId: con1Profile.id,
      title: "Phase 1 – Structural Materials",
      titleAr: "المرحلة 1 – المواد الإنشائية",
      description: "Cement, rebar, and sand for the foundation and ground floor slab.",
      type: "PURCHASE",
      purchaseMode: "ALL_AT_ONCE",
      status: "PUBLISHED",
      deliveryCity: "DUBAI",
      startingPrice: 180000,
      biddingDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.bOQItem.upsert({
    where: { id: "seed-boq1-item1" },
    update: {},
    create: {
      id: "seed-boq1-item1",
      boqId: boq1.id,
      itemNumber: 1,
      description: "Portland Cement Grade 42.5",
      categoryId: portlandCat.id,
      unitId: u("bag").id,
      quantity: 2000,
      estimatedPrice: 58000,
    },
  });

  await prisma.bOQItem.upsert({
    where: { id: "seed-boq1-item2" },
    update: {},
    create: {
      id: "seed-boq1-item2",
      boqId: boq1.id,
      itemNumber: 2,
      description: "Steel Rebar T12 – 12m bars",
      categoryId: rebarCat.id,
      unitId: u("t").id,
      quantity: 30,
      estimatedPrice: 99000,
    },
  });

  await prisma.bOQItem.upsert({
    where: { id: "seed-boq1-item3" },
    update: {},
    create: {
      id: "seed-boq1-item3",
      boqId: boq1.id,
      itemNumber: 3,
      description: "Sharp Sand (washed)",
      categoryId: sandCat.id,
      unitId: u("t").id,
      quantity: 150,
      estimatedPrice: 13200,
    },
  });

  const boq2 = await prisma.bOQ.upsert({
    where: { id: "seed-boq-2" },
    update: {},
    create: {
      id: "seed-boq-2",
      createdByUserId: con2User.id,
      contractorId: con2Profile.id,
      title: "Villa Fit-Out – Tiles & Paint",
      titleAr: "تشطيب فيلا – بلاط ودهان",
      description: "Tiles for floors and bathrooms plus interior paint.",
      type: "PURCHASE",
      purchaseMode: "BIT_BY_BIT",
      status: "BIDDING_CLOSED",
      deliveryCity: "SHARJAH",
      startingPrice: 75000,
    },
  });

  await prisma.bOQItem.upsert({
    where: { id: "seed-boq2-item1" },
    update: {},
    create: {
      id: "seed-boq2-item1",
      boqId: boq2.id,
      itemNumber: 1,
      description: "60×60 Porcelain Floor Tile",
      categoryId: floorTilesCat.id,
      unitId: u("m²").id,
      quantity: 500,
      estimatedPrice: 34000,
    },
  });

  await prisma.bOQItem.upsert({
    where: { id: "seed-boq2-item2" },
    update: {},
    create: {
      id: "seed-boq2-item2",
      boqId: boq2.id,
      itemNumber: 2,
      description: "Jotun Interior Emulsion Paint 20L",
      categoryId: interiorPaintCat.id,
      unitId: u("gal").id,
      quantity: 120,
      estimatedPrice: 15000,
    },
  });

  // ─── Bid on boq2 ──────────────────────────────────────────────────────────────

  const bid1 = await prisma.materialBid.upsert({
    where: { id: "seed-bid-1" },
    update: {},
    create: {
      id: "seed-bid-1",
      boqId: boq2.id,
      supplierId: sup2Profile.id,
      status: "ACCEPTED",
      isAnonymous: false,
      totalPrice: 47500,
      deliveryDays: 7,
      deliveryCost: 800,
      notes: "Includes free delivery to site.",
    },
  });

  await prisma.bidLineItem.upsert({
    where: { id: "seed-bli-1" },
    update: {},
    create: {
      id: "seed-bli-1",
      bidId: bid1.id,
      boqItemId: "seed-boq2-item1",
      unitPrice: 65,
      totalPrice: 32500,
    },
  });

  await prisma.bidLineItem.upsert({
    where: { id: "seed-bli-2" },
    update: {},
    create: {
      id: "seed-bli-2",
      bidId: bid1.id,
      boqItemId: "seed-boq2-item2",
      unitPrice: 125,
      totalPrice: 15000,
    },
  });

  // ─── Order + Escrow ────────────────────────────────────────────────────────────

  const order1 = await prisma.order.upsert({
    where: { id: "seed-order-1" },
    update: {},
    create: {
      id: "seed-order-1",
      boqId: boq2.id,
      bidId: bid1.id,
      contractorId: con2Profile.id,
      status: "CONFIRMED",
      totalAmount: 47500,
    },
  });

  await prisma.escrowTransaction.upsert({
    where: { id: "seed-escrow-1" },
    update: {},
    create: {
      id: "seed-escrow-1",
      orderId: order1.id,
      amount: 47500,
      status: "RELEASED",
      paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      releasedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.delivery.upsert({
    where: { id: "seed-delivery-1" },
    update: {},
    create: {
      id: "seed-delivery-1",
      orderId: order1.id,
      supplierId: sup2Profile.id,
      proofImages: JSON.stringify(["https://placehold.co/800x600?text=Delivery+Proof"]),
      notes: "All materials delivered and stacked on site.",
    },
  });

  console.log("Seeded 2 BOQs, 1 bid, 1 order, 1 escrow, 1 delivery");

  // ─── Rating ───────────────────────────────────────────────────────────────────

  await prisma.supplierRating.upsert({
    where: { id: "seed-rating-1" },
    update: {},
    create: {
      id: "seed-rating-1",
      supplierId: sup2Profile.id,
      ratedByUserId: con2User.id,
      orderId: order1.id,
      trustworthiness: 5,
      deliveryReliability: 4,
      timeliness: 5,
      materialQuality: 4,
      overallScore: 4.5,
      comment: "Great experience, materials were exactly as described and delivered on time.",
    },
  });

  console.log("Seeded 1 supplier rating");

  // ─── Service Hub Posts ────────────────────────────────────────────────────────

  const post1 = await prisma.serviceHubPost.upsert({
    where: { id: "seed-post-1" },
    update: {},
    create: {
      id: "seed-post-1",
      authorId: con1User.id,
      title: "Best practices for curing concrete in UAE heat",
      content:
        "Working in Dubai summer means you need to be extra careful with concrete curing. Here are 5 tips that have worked great for our projects: 1. Start curing immediately after finishing. 2. Use curing compounds or wet burlap. 3. Avoid pouring in direct midday sun. 4. Keep formwork in place longer. 5. Water cure for at least 7 days.",
      category: "CONTRACTOR",
      tags: JSON.stringify(["concrete", "curing", "dubai", "summer"]),
      likeCount: 12,
      commentCount: 3,
    },
  });

  await prisma.serviceHubPost.upsert({
    where: { id: "seed-post-2" },
    update: {},
    create: {
      id: "seed-post-2",
      authorId: consultant1User.id,
      title: "How to evaluate subcontractor bids effectively",
      content:
        "After 15 years in construction consulting, these are the red flags I look for in subcontractor bids: Unrealistically low prices, vague scope of work, no reference projects, and missing insurance documentation. A structured bid evaluation matrix helps ensure objective comparison.",
      category: "COMPANY",
      tags: JSON.stringify(["bidding", "subcontractors", "consulting"]),
      likeCount: 8,
      commentCount: 1,
    },
  });

  await prisma.serviceHubComment.upsert({
    where: { id: "seed-comment-1" },
    update: {},
    create: {
      id: "seed-comment-1",
      postId: post1.id,
      authorId: consultant1User.id,
      content: "Great tips! We also use shade netting over fresh pours during summer months.",
    },
  });

  console.log("Seeded 2 service hub posts, 1 comment");

  // ─── Service Requests ─────────────────────────────────────────────────────────

  const request1 = await prisma.serviceRequest.upsert({
    where: { id: "seed-req-1" },
    update: {},
    create: {
      id: "seed-req-1",
      requesterId: con1User.id,
      title: "Interior fit-out contractor needed for office in Business Bay",
      description:
        "Looking for an experienced interior fit-out contractor for a 1,200 sqm Grade A office space in Business Bay, Dubai. Scope includes raised flooring, suspended ceilings, MEP coordination, and joinery. Budget is flexible for the right team.",
      category: "INTERIOR_DESIGN",
      city: "DUBAI",
      budget: 450000,
      status: "OPEN",
    },
  });

  await prisma.serviceRequest.upsert({
    where: { id: "seed-req-2" },
    update: {},
    create: {
      id: "seed-req-2",
      requesterId: cust1User.id,
      title: "Electrician for villa rewiring in Sharjah",
      description:
        "Need a licensed electrician for complete villa rewiring, new DB installation, and external lighting for a 4-bedroom villa in Al Majaz, Sharjah.",
      category: "ELECTRICAL",
      city: "SHARJAH",
      budget: 18000,
      status: "OPEN",
    },
  });

  console.log("Seeded 2 service requests");

  // ─── Notifications ────────────────────────────────────────────────────────────

  await prisma.notification.create({
    data: {
      userId: con1User.id,
      type: "BID_RECEIVED",
      title: "New bid on your BOQ",
      titleAr: "عرض جديد على طلبك",
      body: "A supplier submitted a bid on 'Phase 1 – Structural Materials'.",
      bodyAr: "قدّم مورد عرض سعر على 'المرحلة 1 – المواد الإنشائية'.",
      link: `/contractor/boq/seed-boq-1`,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: sup2User.id,
      type: "ORDER_CREATED",
      title: "New order created",
      titleAr: "تم إنشاء طلب جديد",
      body: "An order was created for your accepted bid on 'Villa Fit-Out – Tiles & Paint'.",
      bodyAr: "تم إنشاء طلب بناءً على عرضك المقبول.",
      link: `/supplier/orders/seed-order-1`,
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: sup2User.id,
      type: "RATING_RECEIVED",
      title: "New Rating Received",
      titleAr: "تقييم جديد",
      body: "You received a 4.5/5 overall rating.",
      bodyAr: "لقد حصلت على تقييم 4.5/5",
      link: "/supplier/ratings",
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: con2User.id,
      type: "PAYMENT_RELEASED",
      title: "Escrow funds released",
      titleAr: "تم الإفراج عن الدفعة",
      body: "Payment of AED 47,500 has been released to the supplier.",
      bodyAr: "تم الإفراج عن مبلغ 47,500 درهم للمورد.",
      link: `/contractor/orders/seed-order-1`,
      isRead: false,
    },
  });

  console.log("Seeded 4 notifications");

  // ─── Messages ─────────────────────────────────────────────────────────────────

  await prisma.message.create({
    data: {
      senderId: con1User.id,
      receiverId: sup1User.id,
      content: "Hi! Do you deliver to Dubai Marina? What's the lead time for 2000 bags of cement?",
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      senderId: sup1User.id,
      receiverId: con1User.id,
      content: "Yes, we deliver to Dubai Marina. Lead time is 2-3 business days for 2000 bags.",
      isRead: true,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      senderId: con1User.id,
      receiverId: sup1User.id,
      content: "Perfect, I'll submit a bid through the BOQ system. Thanks!",
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  console.log("Seeded 3 messages");
  console.log("\n✅ Seeding complete!");
  console.log("─────────────────────────────────────────");
  console.log("  Supplier 1:    supplier1@monzer.ae  (Dubai – cement/sand/pipes)");
  console.log("  Supplier 2:    supplier2@monzer.ae  (Sharjah – tiles/paint)  ★ rated 4.5");
  console.log("  Supplier 3:    supplier3@monzer.ae  (Abu Dhabi – steel)");
  console.log("  Contractor 1:  contractor1@monzer.ae");
  console.log("  Contractor 2:  contractor2@monzer.ae");
  console.log("  Consultant 1:  consultant1@monzer.ae");
  console.log("  Customer 1:    customer1@monzer.ae");
  console.log("  Password:      password123 (all accounts)");
  console.log("─────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
