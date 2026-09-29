import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | The Net Scouting",
  description: "Acesso ao Portal de Inteligência Esportiva — The Net Scouting",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
