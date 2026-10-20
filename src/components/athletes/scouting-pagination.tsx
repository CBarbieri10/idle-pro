"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScoutingPaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function ScoutingPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
}: ScoutingPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1 && totalCount <= pageSize) {
    return (
      <div className="flex items-center justify-between text-xs text-zinc-400 py-3 px-2 border-t border-white/5">
        <span>
          Mostrando <strong className="text-white">{totalCount}</strong> atleta
          {totalCount === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[11px] text-zinc-500">Página 1 de 1</span>
      </div>
    );
  }

  function goToPage(targetPage: number) {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;

    const params = new URLSearchParams(searchParams.toString());
    if (targetPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Gera array de páginas para exibição inteligente (ex: [1, '...', 4, 5, 6, '...', 27])
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // páginas antes e depois da atual

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-white/10 mt-6">
      {/* Resumo de contagem */}
      <div className="text-xs text-zinc-400">
        Mostrando <strong className="text-white">{startItem}</strong> a{" "}
        <strong className="text-white">{endItem}</strong> de{" "}
        <strong className="text-emerald-400">{totalCount}</strong> atletas encontrados
      </div>

      {/* Controles de Navegação */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Primeira Página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(1)}
          disabled={page <= 1 || isPending}
          className="h-8 w-8 rounded-lg bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Página Anterior */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          className="h-8 w-8 rounded-lg bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Números das Páginas */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs font-mono text-zinc-600 select-none"
                >
                  ...
                </span>
              );
            }

            const pNum = p as number;
            const isCurrent = pNum === page;

            return (
              <Button
                key={`page-${pNum}`}
                variant="ghost"
                size="sm"
                onClick={() => goToPage(pNum)}
                disabled={isPending}
                className={cn(
                  "h-8 min-w-[32px] px-2.5 rounded-lg text-xs font-mono font-bold transition-all",
                  isCurrent
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "bg-black/30 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                )}
              >
                {pNum}
              </Button>
            );
          })}
        </div>

        {/* Próxima Página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          className="h-8 w-8 rounded-lg bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Última Página */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => goToPage(totalPages)}
          disabled={page >= totalPages || isPending}
          className="h-8 w-8 rounded-lg bg-black/40 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
