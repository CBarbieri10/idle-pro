"use client";

import { useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addAthleteToPortfolio, removeAthleteFromPortfolio } from "@/lib/actions/portfolio";
import { cn } from "@/lib/utils";

interface PortfolioToggleButtonProps {
  athleteId: string;
  athleteName?: string;
  initialInPortfolio: boolean;
  variant?: "full" | "icon" | "badge";
  className?: string;
}

export function PortfolioToggleButton({
  athleteId,
  athleteName,
  initialInPortfolio,
  variant = "full",
  className,
}: PortfolioToggleButtonProps) {
  const [isInPortfolio, setIsInPortfolio] = useState(initialInPortfolio);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isInPortfolio;
    setIsInPortfolio(nextState);

    startTransition(async () => {
      try {
        if (nextState) {
          await addAthleteToPortfolio(athleteId);
        } else {
          await removeAthleteFromPortfolio(athleteId);
        }
      } catch (err) {
        // Revert on error
        setIsInPortfolio(!nextState);
        console.error("Failed to update portfolio status", err);
      }
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        title={
          isInPortfolio
            ? `Remover ${athleteName ?? "atleta"} do seu portfólio`
            : `Adicionar ${athleteName ?? "atleta"} ao seu portfólio de observação`
        }
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-all cursor-pointer",
          isInPortfolio
            ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
            : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted",
          className
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isInPortfolio ? (
          <BookmarkCheck className="h-4 w-4 fill-amber-400/20 text-amber-400" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </button>
    );
  }

  if (variant === "badge") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
          isInPortfolio
            ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
          className
        )}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isInPortfolio ? (
          <BookmarkCheck className="h-3 w-3 text-amber-400" />
        ) : (
          <Bookmark className="h-3 w-3" />
        )}
        <span>{isInPortfolio ? "No Portfólio" : "Salvar"}</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={isInPortfolio ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "gap-1.5 text-xs font-semibold transition-all",
        isInPortfolio
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
          : "border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isInPortfolio ? (
        <>
          <BookmarkCheck className="h-3.5 w-3.5 fill-amber-400/30 text-amber-400" />
          No Portfólio
        </>
      ) : (
        <>
          <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
          Adicionar ao Portfólio
        </>
      )}
    </Button>
  );
}
