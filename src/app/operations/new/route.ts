import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { operationTypeEnum, operations } from "@/db/schema";

type OperationType = (typeof operationTypeEnum.enumValues)[number];

function isOperationType(value: string): value is OperationType {
  return operationTypeEnum.enumValues.includes(value as OperationType);
}

function toAmount(value: FormDataEntryValue | null): number {
  const parsed = Number.parseFloat((value ?? "").toString());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const walletId = Number.parseInt((formData.get("walletId") ?? "").toString(), 10);
  const typeRaw = (formData.get("type") ?? "").toString();
  const amount = toAmount(formData.get("amount"));
  const operationDate = (formData.get("operationDate") ?? "").toString();
  const notes = (formData.get("notes") ?? "").toString().trim();

  if (!Number.isInteger(walletId) || !isOperationType(typeRaw) || !Number.isFinite(amount)) {
    redirect("/dashboard?error=operation-input");
  }

  if (amount <= 0 || !operationDate) {
    redirect("/dashboard?error=operation-input");
  }

  await db.insert(operations).values({
    walletId,
    type: typeRaw,
    amount: amount.toFixed(2),
    operationDate,
    notes: notes.length > 0 ? notes : null,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?success=operation-created");
}
