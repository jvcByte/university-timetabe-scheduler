import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect based on role
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "FACULTY":
      redirect("/faculty");
    case "STUDENT":
      redirect("/student");
    default:
      redirect("/");
  }
}
