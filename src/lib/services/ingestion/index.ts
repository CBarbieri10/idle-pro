export * from "./types";
export * from "./slugify";
export * from "./athlete-agent";
export * from "./match-agent";
export * from "./team-agent";

import { athleteAgent } from "./athlete-agent";
import { matchAgent } from "./match-agent";
import { teamAgent } from "./team-agent";
import type { DetectedFileType, IngestionAgent } from "./types";

/**
 * Strategy Router: Resolve o Agente Especializado correspondente ao tipo de arquivo detectado.
 */
export function getIngestionAgent(type: DetectedFileType): IngestionAgent {
  switch (type) {
    case "MATCH":
      return matchAgent;
    case "TEAM":
      return teamAgent;
    case "ATHLETE":
    default:
      return athleteAgent;
  }
}
