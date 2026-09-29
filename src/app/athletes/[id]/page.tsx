import { getAthleteById } from "@/lib/actions/athletes";
import { getTeams } from "@/lib/actions/teams";
import { EditAthleteButton, DeleteAthleteButton } from "@/components/athletes/athlete-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
  formatAge,
  formatDate,
} from "@/lib/domain";
import { ArrowLeft, Shield, Globe } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteById(id);
  if (!athlete) return { title: "Atleta não encontrado" };
  return {
    title: `${athlete.name} | The Net Scouting`,
    description: `Perfil de ${athlete.name} — ${POSITION_LABELS[athlete.position]}`,
  };
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athlete, teams] = await Promise.all([
    getAthleteById(id),
    getTeams(),
  ]);

  if (!athlete) notFound();

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));

  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para atletas
      </Link>

      {/* Profile header */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{athlete.name}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge
                    className={`text-xs font-medium border-0 ${POSITION_COLORS[athlete.position]}`}
                  >
                    {POSITION_LABELS[athlete.position]}
                  </Badge>
                  {athlete.nationality && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {athlete.nationality}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <EditAthleteButton athlete={athlete} teams={teamList} />
                <DeleteAthleteButton id={athlete.id} name={athlete.name} />
              </div>
            </div>

            {/* Club & National Team */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clube</p>
                  <p className="text-sm font-medium">{athlete.team.name}</p>
                </div>
              </div>
              {athlete.nationalTeam && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Globe className="h-4 w-4 text-chart-2" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seleção</p>
                    <p className="text-sm font-medium">{athlete.nationalTeam.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Biographical data */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Dados Biográficos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <StatItem
            label="Data de Nascimento"
            value={formatDate(athlete.birthDate)}
          />
          <StatItem label="Idade" value={formatAge(athlete.birthDate)} />
          <StatItem label="Pé Dominante" value={FOOT_LABELS[athlete.footPreference]} />
          <StatItem label="Altura" value={formatHeight(athlete.height)} />
          <StatItem label="Peso" value={formatWeight(athlete.weight)} />
          <StatItem label="Nacionalidade" value={athlete.nationality ?? "—"} />
        </div>

        {athlete.notes && (
          <>
            <Separator className="my-5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Anotações
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {athlete.notes}
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Metrics placeholder (for T04) */}
      <Card className="p-6 border-dashed border-border/60">
        <h2 className="text-sm font-semibold text-foreground mb-2">Métricas por Jogo</h2>
        <p className="text-xs text-muted-foreground">
          As métricas por jogo serão exibidas aqui após a implementação do T04 (Entrada Manual de Métricas).
        </p>
      </Card>
    </div>
  );
}
