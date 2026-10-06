import { NextResponse } from "next/server";
import { askScoutingCopilot } from "@/lib/ai-scout";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt =
      body.prompt ||
      (Array.isArray(body.messages)
        ? body.messages[body.messages.length - 1]?.content
        : "");

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Mensagem ou prompt inválido." },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.messages)
      ? body.messages
          .slice(0, -1)
          .map((m: { role?: string; content?: string }) => ({
            role: (m.role === "assistant" ? "assistant" : "user") as
              | "user"
              | "assistant",
            content: m.content || "",
          }))
      : [];

    const result = await askScoutingCopilot(prompt, history);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Erro na rota /api/chat:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no servidor.";
    return NextResponse.json(
      {
        error: "Falha ao processar solicitação no Scouting Copilot.",
        details: message,
      },
      { status: 500 }
    );
  }
}
