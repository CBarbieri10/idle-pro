"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface AthleteRaioXExportButtonProps {
  athleteName?: string;
  className?: string;
}

export function AthleteRaioXExportButton({
  athleteName,
  className,
}: AthleteRaioXExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    setIsExporting(true);

    // Timeout breve (250ms) para dar feedback visual imediato ao analista antes do congelamento nativo do window.print()
    setTimeout(() => {
      try {
        window.print();
      } finally {
        setTimeout(() => {
          setIsExporting(false);
        }, 500);
      }
    }, 250);
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={isExporting}
      className={`gap-2 text-xs font-bold bg-[#00e676]/20 hover:bg-[#00e676]/30 text-[#00e676] border border-[#00e676]/40 shadow-sm print:hidden transition-all cursor-pointer ${
        className ?? ""
      }`}
      title={
        athleteName
          ? `Exportar Dossiê Raio-X em PDF de ${athleteName}`
          : "Exportar Dossiê Raio-X em PDF"
      }
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-[#00e676]" />
          <span>Gerando Raio-X (PDF)...</span>
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 text-[#00e676]" />
          <span>Gerar Relatório Raio-X (PDF)</span>
        </>
      )}
    </Button>
  );
}
