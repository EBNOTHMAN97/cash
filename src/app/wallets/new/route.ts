import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { wallets } from "@/db/schema";

function toAmount(value: FormDataEntryValue | null): number {
  const parsed = Number.parseFloat((value ?? "").toString());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = (formData.get("name") ?? "").toString().trim();
  const dailyLimit = toAmount(formData.get("dailyLimit"));
  const monthlyLimit = toAmount(formData.get("monthlyLimit"));

  if (!name || !Number.isFinite(dailyLimit) || !Number.isFinite(monthlyLimit)) {
    redirect("/dashboard?error=wallet-input");
  }

  if (dailyLimit < 0 || monthlyLimit < 0) {
    redirect("/dashboard?error=wallet-input");
  }

  await db.insert(wallets).values({
    name,
    dailyLimit: dailyLimit.toFixed(2),
    monthlyLimit: monthlyLimit.toFixed(2),
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?success=wallet-created");
}
