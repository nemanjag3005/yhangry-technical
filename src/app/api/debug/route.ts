/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { db } from "~/server/db";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await db.setMenu.findMany({
    include: {
      cuisines: {
        include: {
          cuisine: true,
        },
      },
      groups: true,
    },
  });
  return NextResponse.json(data);
}
