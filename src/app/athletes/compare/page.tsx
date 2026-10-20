import { redirect } from "next/navigation";

export default async function AthletesComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const queryString = params.ids ? `?ids=${encodeURIComponent(params.ids)}` : "";
  redirect(`/market/compare${queryString}`);
}
