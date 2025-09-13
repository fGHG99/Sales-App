// prisma/seed.js
import prisma from "../utils/prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  const categories = [
    { name: "Makanan", description: "Aneka makanan siap saji" },
    { name: "Bahan Masakan", description: "Bahan untuk memasak sehari-hari" },
    { name: "Minuman", description: "Aneka minuman segar dan kemasan" },
    { name: "Ibu dan Anak", description: "Produk kebutuhan ibu dan anak" },
    { name: "Kebutuhan Rumah", description: "Barang kebutuhan rumah tangga" },
  ];

  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
        products: {
          create: Array.from({ length: 5 }).map((_, i) => ({
            name: `${category.name} Product ${i + 1}`,
            barcode: `${category.name.substring(0, 3).toUpperCase()}-${i + 1}`,
            description: `Deskripsi untuk ${category.name} produk ${i + 1}`,
            unit: "pcs",
            sellingPrice: BigInt(1000 * (i + 1)), // harga dummy
            totalQuantity: 100 + i * 10,
            isPerishable: category.name === "Makanan" || category.name === "Bahan Masakan",
          })),
        },
      },
    });

    console.log(`✅ Category created: ${createdCategory.name}`);
  }

  console.log("🌱 Seeding selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
