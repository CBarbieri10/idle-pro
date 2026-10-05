"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintTriggerButton() {
  const searchParams = useSearchParams();
  const shouldAutoPrint = searchParams.get("print") === "true";

  useEffect(() => {
    if (shouldAutoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoPrint]);

  return (
    <Button
      size="sm"
      onClick={() => window.print()}
      className="gap-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
    >
      <Printer className="h-4 w-4" />
      Imprimir / Salvar em PDF (A4)
    </Button>
  );
}
