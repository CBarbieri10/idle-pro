import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AthletePerformanceIndexPage() {
  const athlete = await prisma.athlete.findFirst({
    where: { rawMetrics: { some: {} } },
    select: { id: true },
  });

  if (athlete) {
    redirect(`/performance/athlete/${athlete.id}`);
  }

  const anyAthlete = await prisma.athlete.findFirst({ select: { id: true } });
  if (anyAthlete) {
    redirect(`/performance/athlete/${anyAthlete.id}`);
  }

  redirect("/athletes");
}
