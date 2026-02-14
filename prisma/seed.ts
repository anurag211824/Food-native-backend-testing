import "dotenv/config";
import { PrismaClient, Role, VegType, OrderStatus, DriverStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";

const normalizeConnectionString = (value: string | undefined) => {
  if (!value) return value;
  try {
    const url = new URL(value);
    const sslmode = url.searchParams.get("sslmode");
    if (sslmode === "prefer" || sslmode === "require" || sslmode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    return value;
  }
};

const connectionString = normalizeConnectionString(process.env.DATABASE_URL);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ---------- CONFIG ----------
const RESTAURANT_COUNT = 10;
const CUSTOMERS_COUNT = 25;
const DRIVERS_COUNT = 8;
const ORDERS_COUNT = 200;

// ---------- HELPERS ----------
const randomEnum = <T,>(obj: Record<string, T>): T => {
  const values = Object.values(obj);
  return values[Math.floor(Math.random() * values.length)] as T;
};

const randomItemsSnapshot = () => {
  return Array.from({ length: faker.number.int({ min: 1, max: 4 }) }).map(() => ({
    name: faker.commerce.productName(),
    price: faker.number.int({ min: 80, max: 500 }),
  }));
};

// ---------- MAIN ----------
async function main() {
  console.log("🌱 Massive production seed starting...");

  // ---------------- ADMIN ----------------
  await prisma.user.create({
    data: {
      phone: "9999999999",
      name: "Super Admin",
      role: Role.ADMIN,
    },
  });

  // ---------------- CUSTOMERS + WALLET ----------------
  const customers = [];

  for (let i = 0; i < CUSTOMERS_COUNT; i++) {
    const user = await prisma.user.create({
      data: {
        phone: faker.phone.number({ style: "national" }).replace(/\D/g, "").slice(-10),
        name: faker.person.fullName(),
        role: Role.CUSTOMER,
        addresses: {
          create: {
            addressLine: faker.location.streetAddress(),
            lat: faker.location.latitude(),
            lng: faker.location.longitude(),
            isDefault: true,
          },
        },
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: faker.number.int({ min: 500, max: 5000 }),
        transactions: {
          createMany: {
            data: Array.from({ length: 10 }).map(() => ({
              amount: faker.number.int({ min: -300, max: 1000 }),
              type: faker.helpers.arrayElement([
                "TOPUP",
                "ORDER_PAYMENT",
                "REFUND",
              ]),
            })),
          },
        },
      },
    });

    customers.push(user);
  }

  // ---------------- DRIVERS ----------------
  const drivers = [];

  for (let i = 0; i < DRIVERS_COUNT; i++) {
    const user = await prisma.user.create({
      data: {
        phone: faker.phone.number({ style: "national" }).replace(/\D/g, "").slice(-10),
        name: faker.person.fullName(),
        role: Role.DELIVERY_PARTNER,
      },
    });

    const driver = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        status: randomEnum(DriverStatus),
        vehicleType: faker.helpers.arrayElement(["Bike", "Cycle"]),
        licenseNumber: faker.string.alphanumeric(10),
        vehiclePlate: faker.vehicle.vrm(),
        currentLat: faker.location.latitude(),
        currentLng: faker.location.longitude(),
        rating: faker.number.float({ min: 3.5, max: 5 }),
        totalDeliveries: faker.number.int({ min: 10, max: 500 }),
      },
    });

    drivers.push(driver);
  }

  // ---------------- RESTAURANTS + MENU ----------------
  const restaurants = [];

  for (let r = 0; r < RESTAURANT_COUNT; r++) {
    const manager = await prisma.user.create({
      data: {
        phone: faker.phone.number({ style: "national" }).replace(/\D/g, "").slice(-10),
        name: faker.person.fullName(),
        role: Role.RESTAURANT_MANAGER,
      },
    });

    const restaurant = await prisma.restaurant.create({
      data: {
        managerId: manager.id,
        name: faker.company.name(),
        costForTwo: faker.number.int({ min: 200, max: 800 }),
        cuisineTypes: faker.helpers.arrayElements(
          ["Indian", "Chinese", "Italian", "Fast Food", "Desserts"],
          2
        ),
        lat: faker.location.latitude(),
        lng: faker.location.longitude(),
        address: faker.location.streetAddress(),
      },
    });

    restaurants.push(restaurant);

    // categories
    const categories = ["Starters", "Main Course", "Desserts", "Beverages"];

    for (const cat of categories) {
      const category = await prisma.menuCategory.create({
        data: {
          name: cat,
          restaurantId: restaurant.id,
        },
      });

      // menu items
      for (let i = 0; i < 3; i++) {
        await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.number.int({ min: 80, max: 600 }),
            type: randomEnum(VegType),
            isAvailable: true,
            isBestseller: faker.datatype.boolean(),
            prepTime: faker.number.int({ min: 5, max: 30 }),
          },
        });
      }
    }
  }

  // ---------------- ORDERS ----------------
  for (let i = 0; i < ORDERS_COUNT; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const restaurant = faker.helpers.arrayElement(restaurants);
    const driver = faker.helpers.arrayElement(drivers);

    const items = randomItemsSnapshot();
    const itemTotal = items.reduce((sum, i) => sum + i.price, 0);
    const tax = itemTotal * 0.05;
    const delivery = faker.number.int({ min: 20, max: 60 });
    const total = itemTotal + tax + delivery;

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        restaurantId: restaurant.id,
        driverId: driver.id,
        status: randomEnum(OrderStatus),
        otp: faker.string.numeric(4),
        itemsSnapshot: items,
        itemTotal,
        tax,
        deliveryCharge: delivery,
        platformFee: 10,
        totalAmount: total,
        paidByWallet: faker.number.int({ min: 0, max: total }),
        paidByGateway: total,
        paymentMode: faker.helpers.arrayElement(["UPI", "COD", "SPLIT"]),
        deliveredAt: faker.date.recent(),
      },
    });

    // review chance
    if (faker.datatype.boolean()) {
      await prisma.review.create({
        data: {
          orderId: order.id,
          userId: customer.id,
          restaurantId: restaurant.id,
          foodRating: faker.number.int({ min: 3, max: 5 }),
          deliveryRating: faker.number.int({ min: 3, max: 5 }),
          comment: faker.lorem.sentence(),
        },
      });
    }

    // refund chance
    if (faker.datatype.boolean({ probability: 0.2 })) {
      await prisma.refund.create({
        data: {
          orderId: order.id,
          amount: faker.number.int({ min: 20, max: 150 }),
          reason: faker.lorem.words(3),
          status: faker.helpers.arrayElement([
            "PENDING",
            "APPROVED",
            "REJECTED",
          ]),
        },
      });
    }
  }

  console.log("✅ Massive seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
