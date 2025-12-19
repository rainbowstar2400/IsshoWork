import { auth } from "@/auth";
import { UnauthorizedError } from "./errors";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new UnauthorizedError("Login required");
  return userId;
}
