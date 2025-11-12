import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "FACULTY" | "STUDENT";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "FACULTY" | "STUDENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "FACULTY" | "STUDENT";
  }
}
