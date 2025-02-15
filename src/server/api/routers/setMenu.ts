/**
 * Security Improvements:
 * 1. Rate Limiting
 *    - Implement rate limiting per IP/user to prevent DoS attacks
 *    - For example use Redis or similar middleware
 *
 * 2. Input Validation
 *    - Add Zod validation for query parameters (already implemented)
 *
 * 3. SQL Injection Prevention
 *    - Using Prisma's parameterized queries (already implemented)
 *
 * 4. Authentication & Authorization
 *    - Implement JWT or session-based auth
 *    - Add role-based access control (RBAC)
 *    - Validate user permissions before data access (e.g. using tRPC - privateProcedure)
 *
 * Latency Optimizations:
 * 1. Caching Strategy
 *    - Implement Redis caching for frequently accessed data
 *    - Use stale-while-revalidate pattern
 *
 * 2. Monitoring
 *    - Implement performance monitoring
 *    - Track slow queries and N+1 problems
 *    - Set up alerts for response time thresholds
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const querySchema = z.object({
  cuisineSlug: z.string().optional(),
  cursor: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

export const setMenuRouter = createTRPCRouter({
  getMenus: publicProcedure.input(querySchema).query(async ({ ctx, input }) => {
    const { cuisineSlug, cursor, limit } = input;

    // Base filter for live menus
    const baseFilter = {
      status: 1,
      ...(cuisineSlug && {
        cuisines: {
          some: {
            cuisine: {
              slug: cuisineSlug,
            },
          },
        },
      }),
    };

    const validCursor = cursor
      ? await ctx.db.setMenu.findUnique({
          where: { id: cursor, ...baseFilter }, // Ensure cursor exists in filtered data
        })
      : null;

    try {
      // Parallel queries for better performance

      const [setMenus, total, cuisines] = await Promise.all([
        // Get paginated set menus
        ctx.db.setMenu.findMany({
          where: baseFilter,
          orderBy: {
            numberOfOrders: "desc",
          },
          ...(validCursor ? { cursor: { id: cursor } } : {}),
          take: limit + 1,

          select: {
            id: true,
            name: true,
            pricePerPerson: true,
            minSpend: true,
            image: true,
            thumbnail: true,
            description: true,
            isVegan: true,
            isVegetarian: true,
            isHalal: true,
            isKosher: true,
            numberOfOrders: true,
            cuisines: {
              select: {
                cuisine: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            groups: {
              select: {
                id: true,
                name: true,
                // Add only essential group fields
              },
            },
          },
        }),

        // Get total count
        ctx.db.setMenu.count({
          where: baseFilter,
        }),

        // Get cuisines with aggregated data
        ctx.db.cuisine.findMany({
          where: {
            setMenus: {
              some: {
                setMenu: {
                  status: 1,
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: {
                setMenus: {
                  where: {
                    setMenu: {
                      status: 1,
                    },
                  },
                },
              },
            },
            // Use aggregation for total orders
            setMenus: {
              where: {
                setMenu: {
                  status: 1,
                },
              },
              select: {
                setMenu: {
                  select: {
                    numberOfOrders: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      let nextCursor: typeof cursor | undefined = undefined;

      if (setMenus.length > limit) {
        const nextItem = setMenus.pop();
        nextCursor = nextItem!.id;
      }

      // Format cuisines with aggregated data
      const formattedCuisines = cuisines.map((cuisine) => ({
        id: cuisine.id,
        name: cuisine.name,
        slug: cuisine.slug,
        liveMenuCount: cuisine._count.setMenus,
        totalOrders: cuisine.setMenus.reduce(
          (sum, { setMenu }) => (sum + setMenu.numberOfOrders) as number,
          0,
        ),
      }));

      // Sort cuisines by total orders
      formattedCuisines.sort((a, b) => b.totalOrders - a.totalOrders);

      return {
        data: setMenus,
        nextCursor,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          perPage: limit,
        },
        cuisines: formattedCuisines,
      };
    } catch (error) {
      console.error("Error fetching menus:", error);
      throw error;
    }
  }),
});
