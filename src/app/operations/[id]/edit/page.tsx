import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { operationTypeEnum, operations, wallets } from "@/db/schema";
import { eq } from "drizzle-orm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditOperationPage({ params }: PageProps) {
  const { id } = await params;
  const operationId = Number.parseInt(id, 10);

  if (!Number.isInteger(operationId)) {
    notFound();
  }

  const [walletRows, operationRows] = await Promise.all([
    db.select().from(wallets).orderBy(wallets.name),
    db.select().from(operations).where(eq(operations.id, operationId)).limit(1),
  ]);

  const operation = operationRows[0];

  if (!operation) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">تعديل العملية #{operation.id}</h1>
        <p className="mt-2 text-sm text-slate-600">يمكنك تعديل نوع العملية أو المبلغ أو المحفظة أو التاريخ.</p>

        <form action={`/operations/${operation.id}/edit/save`} method="post" className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">المحفظة</span>
            <select
              required
              name="walletId"
              defaultValue={String(operation.walletId)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
            >
              {walletRows.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">نوع العملية</span>
            <select
              required
              name="type"
              defaultValue={operation.type}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
            >
              {operationTypeEnum.enumValues.map((type) => (
                <option key={type} value={type}>
                  {type === "transfer" ? "إرسال" : "إيداع"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">المبلغ</span>
            <input
              required
              min="0.01"
              step="0.01"
              type="number"
              name="amount"
              defaultValue={String(operation.amount)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">تاريخ العملية</span>
            <input
              required
              type="date"
              name="operationDate"
              defaultValue={operation.operationDate}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">ملاحظات</span>
            <input
              name="notes"
              defaultValue={operation.notes ?? ""}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
            />
          </label>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button className="rounded-xl bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-700">حفظ التعديل</button>
            <Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              رجوع
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
