import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const url = "file:" + path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaLibSql({ url });
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

  // Seed units of measure
  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  console.log(`Seeded ${units.length} units of measure`);

  // Seed categories with children
  for (const cat of categories) {
    const parent = await prisma.materialCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        nameAr: cat.nameAr,
        slug: cat.slug,
      },
    });

    for (const child of cat.children) {
      await prisma.materialCategory.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          nameAr: child.nameAr,
          slug: child.slug,
          parentId: parent.id,
        },
      });
    }
  }
  console.log(`Seeded ${categories.length} categories with children`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
