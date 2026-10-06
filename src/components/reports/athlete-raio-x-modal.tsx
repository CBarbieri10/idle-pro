"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  ExternalLink,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AthleteRaioXSheet, type RaioXAthleteSheetData } from "@/components/reports/athlete-raio-x-sheet";
import { AthleteDossier } from "@/components/reports/dossier-builder";
import { cn } from "@/lib/utils";

export type RaioXAthleteData = RaioXAthleteSheetData;

interface AthleteRaioXModalProps {
  athlete: RaioXAthleteData;
  triggerButton?: React.ReactNode;
}

export function AthleteRaioXModal({ athlete, triggerButton }: AthleteRaioXModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-raio-x-open");
    } else {
      document.body.classList.remove("modal-raio-x-open");
    }
    return () => {
      document.body.classList.remove("modal-raio-x-open");
    };
  }, [isOpen]);

  const handlePrint = () => {
    // 1. Clean Iframe Print: isolates the document from modal dialog transforms & scroll clipping
    const reportEl = document.getElementById("executive-dossier-container") || document.getElementById("raio-x-report-sheet");
    if (reportEl) {
      try {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
            .map((el) => el.outerHTML)
            .join("\n");

          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
              <head>
                <meta charset="utf-8" />
                <title>The Net Scouting - Dossiê Executivo - ${athlete.name}</title>
                ${styles}
                <style>
                  @page {
                    size: A4 portrait;
                    margin: 8mm 10mm 8mm 10mm;
                  }
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  html, body {
                    background: #fdfcf8 !important;
                    color: #09090b !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                  }
                  #executive-dossier-container,
                  #raio-x-report-sheet {
                    width: 100% !important;
                    max-width: 190mm !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                    display: block !important;
                    background: #fdfcf8 !important;
                  }
                  .print-page-break {
                    break-after: page !important;
                    page-break-after: always !important;
                    display: block !important;
                    clear: both !important;
                    height: auto !important;
                  }
                  .print-avoid-break {
                    break-inside: avoid !important;
                    page-break-inside: avoid !important;
                  }
                </style>
              </head>
              <body>
                ${reportEl.outerHTML}
              </body>
            </html>
          `);
          doc.close();

          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 2000);
          }, 300);
          return;
        }
      } catch (err) {
        console.warn("Iframe print fallback triggered:", err);
      }
    }

    // 2. Direct standalone page fallback if iframe printing fails
    window.open(`/athletes/${athlete.id}/raio-x?print=true`, "_blank");
  };

  const docRef = `TNS-RX-${athlete.id.slice(0, 6).toUpperCase()}`;

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)}>{triggerButton}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-foreground"
        >
          <FileText className="h-3.5 w-3.5 text-indigo-400" />
          Gerar Relatório Raio-X (PDF)
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-zinc-700 bg-zinc-950 text-foreground print:hidden">
          {/* Top modal action bar (hidden during print) */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900 print:hidden">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                TNS
              </div>
              <DialogTitle className="text-sm font-bold tracking-tight">
                Dossiê Executivo &bull; Raio-X do Atleta ({docRef})
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/athletes/${athlete.id}/raio-x`}
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 gap-1.5 text-xs font-semibold text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                )}
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                Abrir Dossiê
              </Link>
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir / Salvar em PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printable Dossier (Off-White Editorial A4 Canvas) */}
          <div className="p-6 bg-zinc-900/60 overflow-x-auto flex justify-center">
            <div className="w-full max-w-[210mm] bg-[#fdfcf8] text-zinc-950 shadow-2xl rounded-xl p-6 sm:p-8">
              <AthleteDossier athlete={athlete} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
