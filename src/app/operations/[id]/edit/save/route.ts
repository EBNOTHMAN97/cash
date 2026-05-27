import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { operationTypeEnum, operations } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type OperationType = (typeof operationTypeEnum.enumValues)[number];

function isOperationType(value: string): value is OperationType {
  return operationTypeEnum.enumValues.includes(value as OperationType);
}

function toAmount(value: FormDataEntryValue | null): number {
  const parsed = Number.parseFloat((value ?? "").toString());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const operationId = Number.parseInt(id, 10);

  if (!Number.isInteger(operationId)) {
    redirect("/dashboard?error=operation-edit");
  }

  const formData = await request.formData();

  const walletId = Number.parseInt((formData.get("walletId") ?? "").toString(), 10);
  const typeRaw = (formData.get("type") ?? "").toString();
  const amount = toAmount(formData.get("amount"));
  const operationDate = (formData.get("operationDate") ?? "").toString();
  const notes = (formData.get("notes") ?? "").toString().trim();

  if (!Number.isInteger(walletId) || !isOperationType(typeRaw) || !Number.isFinite(amount)) {
    redirect(`/operations/${operationId}/edit?error=operation-input`);
  }

  if (amount <= 0 || !operationDate) {
    redirect(`/operations/${operationId}/edit?error=operation-input`);
  }

  await db
    .update(operations)
    .set({
      walletId,
      type: typeRaw,
      amount: amount.toFixed(2),
      operationDate,
      notes: notes.length > 0 ? notes : null,
    })
    .where(eq(operations.id, operationId));

  revalidatePath("/dashboard");
  redirect("/dashboard?success=operation-updated");
}
