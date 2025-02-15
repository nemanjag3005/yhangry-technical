/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const ApiSetMenuSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  status: z.number(),
  price_per_person: z.number(),
  min_spend: z.number(),
  number_of_orders: z.number(),
  image: z.string(),
  thumbnail: z.string(),
  is_vegan: z.number(),
  is_vegetarian: z.number(),
  is_seated: z.number(),
  is_standing: z.number(),
  is_canape: z.number(),
  is_mixed_dietary: z.number(),
  is_meal_prep: z.number(),
  is_halal: z.number(),
  is_kosher: z.number(),
  display_text: z.number(),
  price_includes: z.string().nullable(),
  highlight: z.string().nullable(),
  available: z.boolean(),
  cuisines: z.array(z.object({ id: z.number(), name: z.string() })),
  groups: z.object({
    dishes_count: z.number(),
    selectable_dishes_count: z.number(),
    groups: z.record(z.string(), z.number()),
  }),
});

const ApiResponseSchema = z.object({
  data: z.array(ApiSetMenuSchema),
});

async function harvestData() {
  try {
    console.log("Starting data harvest...");

    const response = await fetch(
      "https://staging.yhangry.com/booking/test/set-menus",
    );

    const responseData: unknown = await response.json();
    const parsedResponse = ApiResponseSchema.safeParse(responseData);

    if (!parsedResponse.success) {
      console.error("Invalid API response:", parsedResponse.error);
      return;
    }

    const { data } = parsedResponse.data;

    for (const menuData of data) {
      // Upsert cuisines
      const cuisinePromises = menuData.cuisines.map((cuisine) =>
        prisma.cuisine.upsert({
          where: { id: cuisine.id },
          create: {
            id: cuisine.id,
            name: cuisine.name,
            slug: cuisine.name.toLowerCase().replace(/\s/g, "-"),
          },
          update: {
            name: cuisine.name,
            slug: cuisine.name.toLowerCase().replace(/\s/g, "-"),
          },
        }),
      );

      await Promise.all(cuisinePromises);

      // Create set menu with correct timestamps and relationships
      await prisma.setMenu.create({
        data: {
          name: menuData.name,
          description: menuData.description,
          status: menuData.status,
          pricePerPerson: menuData.price_per_person,
          minSpend: menuData.min_spend,
          numberOfOrders: menuData.number_of_orders,
          image: menuData.image,
          thumbnail: menuData.thumbnail,
          isVegan: Boolean(menuData.is_vegan),
          isVegetarian: Boolean(menuData.is_vegetarian),
          isSeated: Boolean(menuData.is_seated),
          isStanding: Boolean(menuData.is_standing),
          isCanape: Boolean(menuData.is_canape),
          isMixedDietary: Boolean(menuData.is_mixed_dietary),
          isMealPrep: Boolean(menuData.is_meal_prep),
          isHalal: Boolean(menuData.is_halal),
          isKosher: Boolean(menuData.is_kosher),
          displayText: Boolean(menuData.display_text),
          priceIncludes: menuData.price_includes,
          highlight: menuData.highlight,
          available: menuData.available,
          createdAt: new Date(menuData.created_at),
          // Connect cuisines
          cuisines: {
            create: menuData.cuisines.map((cuisine) => ({
              cuisineId: cuisine.id,
            })),
          },
          // Create groups correctly
          groups: {
            create: Object.entries(menuData.groups.groups)
              .filter(([_, enabled]) => enabled === 1)
              .map(([name]) => ({
                name,
                dishesCount: menuData.groups.dishes_count,
                selectableDishesCount: menuData.groups.selectable_dishes_count,
              })),
          },
        },
      });

      console.log(`Processed menu: ${menuData.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limit - 1 request per second
    }

    console.log("Data harvest completed successfully");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error harvesting data:", error.message);
    } else {
      console.error("Unknown error occurred:", error);
    }
    throw error;
  }
}

harvestData()
  .catch(console.error)
  .finally(() => {
    void prisma.$disconnect();
  });
