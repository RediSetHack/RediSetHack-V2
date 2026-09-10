import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/api-client";

export default async function SignUpCompletePage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-up");
  }

  const token = await getToken();
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const name =
    user?.fullName ??
    (user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  if (token) {
    try {
      await syncUser(apiUrl, token, { email, name });
    } catch (err) {
      console.error("Failed to sync user to database after signup:", err);
    }
  }

  redirect("/");
}
