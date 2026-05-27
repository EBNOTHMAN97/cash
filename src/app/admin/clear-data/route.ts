import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    await db.execute(sql`TRUNCATE TABLE operations, wallets RESTART IDENTITY CASCADE`);
    revalidatePath("/dashboard");
    redirect("/dashboard?success=all-cleared");
  } catch {
    redirect("/dashboard?error=clear-data-failed");
  }
}
