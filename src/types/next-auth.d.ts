import { Role } from "@prisma/client";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role | "ADMIN" | "ANALYST" | "CLUB" | "ATHLETE";
    athleteId?: string | null;
    teamId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role | "ADMIN" | "ANALYST" | "CLUB" | "ATHLETE";
      athleteId?: string | null;
      teamId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role | "ADMIN" | "ANALYST" | "CLUB" | "ATHLETE";
    athleteId?: string | null;
    teamId?: string | null;
  }
}

declare module "@auth/core/types" {
  interface User {
    id?: string;
    role?: Role | "ADMIN" | "ANALYST" | "CLUB" | "ATHLETE";
    athleteId?: string | null;
    teamId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role | "ADMIN" | "ANALYST" | "CLUB" | "ATHLETE";
      athleteId?: string | null;
      teamId?: string | null;
    } & DefaultSession["user"];
  }
}
