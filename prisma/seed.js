const { PrismaClient, UserRole } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

const IT_ASSET_TYPES = [
  { name: "Laptop", requiresSerial: true },
  { name: "Desktop", requiresSerial: true },
  { name: "Server", requiresSerial: true },
  { name: "Storage HDD", requiresSerial: true },
  { name: "Switch", requiresSerial: true },
  { name: "Firewall", requiresSerial: true },
  { name: "NVR", requiresSerial: true },
  { name: "DVR", requiresSerial: true },
  { name: "IP Phone", requiresSerial: true },
  { name: "IP Camera", requiresSerial: true },
  { name: "Monitor", requiresSerial: true },
  { name: "Keyboard", requiresSerial: false },
  { name: "Mouse", requiresSerial: false },
  { name: "Headset", requiresSerial: false },
  { name: "Headset Adapter", requiresSerial: false },
  { name: "RAM", requiresSerial: false },
  { name: "Processor", requiresSerial: false },
];

function createPasswordHash(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 128 * 1024 * 1024,
  });
  return `scrypt$32768$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function main() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "ChangeMeNow123!";
  const passwordHash = createPasswordHash(defaultPassword);

  const branch = await prisma.branch.upsert({
    where: { code: "HQ" },
    update: {},
    create: { code: "HQ", name: "Head Office" },
  });

  const existingLocation = await prisma.location.findFirst({
    where: {
      branchId: branch.id,
      name: "IT Floor",
      roomCode: "IT-2",
    },
  });

  const location =
    existingLocation ||
    (await prisma.location.create({
      data: {
        branchId: branch.id,
        name: "IT Floor",
        floor: "2",
        roomCode: "IT-2",
      },
    }));

  await prisma.bay.createMany({
    data: [
      { locationId: location.id, code: "12" },
      { locationId: location.id, code: "13" },
    ],
    skipDuplicates: true,
  });

  for (const type of IT_ASSET_TYPES) {
    await prisma.assetType.upsert({
      where: { name: type.name },
      update: { requiresSerial: type.requiresSerial },
      create: type,
    });
  }

  const seedUsers = [
    {
      name: "IT Admin",
      email: "it.admin@company.local",
      role: UserRole.IT_ADMIN,
    },
    {
      name: "IT Manager",
      email: "it.manager@company.local",
      role: UserRole.IT_MANAGER,
    },
  ];

  for (const seedUser of seedUsers) {
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: seedUser.email, mode: "insensitive" } },
      select: { id: true },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: seedUser.name,
          email: seedUser.email,
          role: seedUser.role,
          passwordHash,
          passwordUpdatedAt: new Date(),
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    });
  }

  console.log("Seed completed. Default password set for seed users.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
