import Link from "next/link";
import { db } from "@/db";
import { operations, wallets } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [walletRows, aggregatesRows] = await Promise.all([
    db.select().from(wallets).orderBy(wallets.name),
    db
      .select({
        walletId: operations.walletId,
        operationsCount: sql<string>`count(*)::text`,
        totalTransfer: sql<string>`coalesce(sum(case when ${operations.type} = 'transfer' then ${operations.amount} else 0 end), 0)`,
        totalDeposit: sql<string>`coalesce(sum(case when ${operations.type} = 'deposit' then ${operations.amount} else 0 end), 0)`,
        monthTransfer:
          sql<string>`coalesce(sum(case when date_trunc('month', ${operations.operationDate}) = date_trunc('month', CURRENT_DATE) and ${operations.type} = 'transfer' then ${operations.amount} else 0 end), 0)`,
        monthDeposit:
          sql<string>`coalesce(sum(case when date_trunc('month', ${operations.operationDate}) = date_trunc('month', CURRENT_DATE) and ${operations.type} = 'deposit' then ${operations.amount} else 0 end), 0)`,
        lastOperationDate: sql<string>`max(${operations.operationDate})::text`,
      })
      .from(operations)
      .groupBy(operations.walletId),
  ]);

  const map = new Map(
    aggregatesRows.map((row) => [
      row.walletId,
      {
        operationsCount: Number.parseInt(row.operationsCount, 10),
        totalTransfer: Number.parseFloat(row.totalTransfer),
        totalDeposit: Number.parseFloat(row.totalDeposit),
        monthTransfer: Number.parseFloat(row.monthTransfer),
        monthDeposit: Number.parseFloat(row.monthDeposit),
        lastOperationDate: row.lastOperationDate,
      },
    ]),
  );

  const reportRows = walletRows.map((wallet) => {
    const monthlyLimit = Number.parseFloat(wallet.monthlyLimit);
    const dailyLimit = Number.parseFloat(wallet.dailyLimit);

    const agg = map.get(wallet.id) ?? {
      operationsCount: 0,
      totalTransfer: 0,
      totalDeposit: 0,
      monthTransfer: 0,
      monthDeposit: 0,
      lastOperationDate: "-",
    };

    return {
      id: wallet.id,
      name: wallet.name,
      dailyLimit,
      monthlyLimit,
      operationsCount: agg.operationsCount,
      totalTransfer: agg.totalTransfer,
      totalDeposit: agg.totalDeposit,
      monthTransfer: agg.monthTransfer,
      monthDeposit: agg.monthDeposit,
      monthlyRemaining: monthlyLimit - agg.monthTransfer,
      lastOperationDate: agg.lastOperationDate,
    };
  });

  const totals = reportRows.reduce(
    (acc, row) => ({
      wallets: acc.wallets + 1,
      operations: acc.operations + row.operationsCount,
      totalTransfer: acc.totalTransfer + row.totalTransfer,
      totalDeposit: acc.totalDeposit + row.totalDeposit,
      monthTransfer: acc.monthTransfer + row.monthTransfer,
      monthDeposit: acc.monthDeposit + row.monthDeposit,
    }),
    {
      wallets: 0,
      operations: 0,
      totalTransfer: 0,
      totalDeposit: 0,
      monthTransfer: 0,
      monthDeposit: 0,
    },
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">تقارير</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">تقرير جميع المحافظ</h1>
            <p className="mt-2 text-slate-600">عرض مجمع لكل المحافظ: الإرسال، الإيداع، والليمت الشهري المتبقي.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            رجوع للوحة التشغيل
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">عدد المحافظ</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totals.wallets}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">عدد العمليات</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totals.operations}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">إرسال الشهر (الكل)</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formatMoney(totals.monthTransfer)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">إيداع الشهر (الكل)</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{formatMoney(totals.monthDeposit)}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">تفاصيل كل محفظة</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">تاريخ التقرير: {today}</span>
        </div>

        {reportRows.length === 0 ? (
          <p className="text-slate-600">لا توجد محافظ لعرض التقرير.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-3 py-3 font-semibold">المحفظة</th>
                  <th className="px-3 py-3 font-semibold">عدد العمليات</th>
                  <th className="px-3 py-3 font-semibold">إجمالي الإرسال</th>
                  <th className="px-3 py-3 font-semibold">إجمالي الإيداع</th>
                  <th className="px-3 py-3 font-semibold">ليمت شهري</th>
                  <th className="px-3 py-3 font-semibold">إرسال الشهر</th>
                  <th className="px-3 py-3 font-semibold">إيداع الشهر</th>
                  <th className="px-3 py-3 font-semibold">المتبقي الشهري</th>
                  <th className="px-3 py-3 font-semibold">آخر عملية</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => {
                  const exceeded = row.monthlyRemaining < 0;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-none">
                      <td className="px-3 py-3 font-medium text-slate-900">{row.name}</td>
                      <td className="px-3 py-3">{row.operationsCount}</td>
                      <td className="px-3 py-3">{formatMoney(row.totalTransfer)}</td>
                      <td className="px-3 py-3 text-blue-700">{formatMoney(row.totalDeposit)}</td>
                      <td className="px-3 py-3">{formatMoney(row.monthlyLimit)}</td>
                      <td className="px-3 py-3">{formatMoney(row.monthTransfer)}</td>
                      <td className="px-3 py-3 text-blue-700">{formatMoney(row.monthDeposit)}</td>
                      <td className={`px-3 py-3 font-medium ${exceeded ? "text-red-600" : "text-emerald-700"}`}>
                        {formatMoney(row.monthlyRemaining)}
                      </td>
                      <td className="px-3 py-3">{row.lastOperationDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
