import { getAgendaEvents } from "@/lib/actions/agenda";
import { AgendaView } from "@/components/agenda/agenda-view";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda Tática | The Net Scouting",
  description: "Planejamento e agendamento de sessões de vídeo, decupagem e relatórios táticos salvos no banco",
};

export default async function AgendaPage() {
  const events = await getAgendaEvents();
  return <AgendaView initialEvents={events} />;
}
