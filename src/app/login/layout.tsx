import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Overview Scout",
  description: "Acesso ao Portal de Inteligência Esportiva — Overview Scout",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
