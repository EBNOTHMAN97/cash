import Link from "next/link";
import { db } from "@/db";
import { operationTypeEnum, operations, wallets } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type OperationType = (typeof operationTypeEnum.enumValues)[number];

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const operationTypeLabels: Record<OperationType, string> = {
  transfer: "إرسال",
  deposit: "إيداع",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function HomePage({ searchParams }: PageProps) {
  const today = new Date().toISOString().slice(0, 10);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const success = pickParam(resolvedSearchParams.success);
  const error = pickParam(resolvedSearchParams.error);

  const [walletRows, usageRows, recentRows] = await Promise.all([
    db.select().from(wallets).orderBy(wallets.name),
    db
      .select({
        walletId: operations.walletId,
        dailyUsage:
          sql<string>`coalesce(sum(case when ${operations.operationDate} = CURRENT_DATE then ${operations.amount} else 0 end), 0)`,
        monthlyTransferUsage:
          sql<string>`coalesce(sum(case when date_trunc('month', ${operations.operationDate}) = date_trunc('month', CURRENT_DATE) and ${operations.type} = 'transfer' then ${operations.amount} else 0 end), 0)`,
        monthlyDepositUsage:
          sql<string>`coalesce(sum(case when date_trunc('month', ${operations.operationDate}) = date_trunc('month', CURRENT_DATE) and ${operations.type} = 'deposit' then ${operations.amount} else 0 end), 0)`,
      })
      .from(operations)
      .groupBy(operations.walletId),
    db
      .select({
        id: operations.id,
        walletName: wallets.name,
        type: operations.type,
        amount: operations.amount,
        operationDate: operations.operationDate,
        notes: operations.notes,
      })
      .from(operations)
      .innerJoin(wallets, eq(operations.walletId, wallets.id))
      .orderBy(desc(operations.operationDate), desc(operations.id))
      .limit(20),
  ]);

  const usageMap = new Map(
    usageRows.map((row) => [
      row.walletId,
      {
        dailyUsage: Number.parseFloat(row.dailyUsage),
        monthlyTransferUsage: Number.parseFloat(row.monthlyTransferUsage),
        monthlyDepositUsage: Number.parseFloat(row.monthlyDepositUsage),
      },
    ]),
  );

  const summaries = walletRows.map((wallet) => {
    const dailyLimit = Number.parseFloat(wallet.dailyLimit);
    const monthlyLimit = Number.parseFloat(wallet.monthlyLimit);
    const usage = usageMap.get(wallet.id) ?? {
      dailyUsage: 0,
      monthlyTransferUsage: 0,
      monthlyDepositUsage: 0,
    };

    const dailyRemaining = dailyLimit - usage.dailyUsage;
    const monthlyRemaining = monthlyLimit - usage.monthlyTransferUsage;

    return {
      ...wallet,
      dailyLimit,
      monthlyLimit,
      dailyUsage: usage.dailyUsage,
      monthlyTransferUsage: usage.monthlyTransferUsage,
      monthlyDepositUsage: usage.monthlyDepositUsage,
      dailyRemaining,
      monthlyRemaining,
    };
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">بديل إكسل عملي للمحافظ</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">حاسبة الليمت اليومي والشهري</h1>
            <p className="mt-3 text-slate-600">الليمت الشهري يتم احتسابه من عمليات الإرسال فقط، مع عرض إجمالي الإيداع بشكل منفصل.</p>
          </div>
          <Link
            href="/reports"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            تقارير جميع المحافظ
          </Link>
        </div>
      </header>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          تم تنفيذ العملية بنجاح.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          حدث خطأ أثناء التنفيذ. راجع المدخلات وحاول مرة أخرى.
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <form action="/wallets/new" method="post" className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">1) إضافة محفظة جديدة</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">اسم المحفظة</span>
              <input
                required
                name="name"
                placeholder="مثال: محفظة القاهرة"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">الليمت اليومي</span>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                name="dailyLimit"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">الليمت الشهري</span>
              <input
                required
                min="0"
                step="0.01"
                type="number"
                name="monthlyLimit"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
          </div>
          <button className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700">حفظ المحفظة</button>
        </form>

        <form action="/operations/new" method="post" className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">2) إدخال عملية (إرسال / إيداع)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">المحفظة</span>
              <select
                required
                name="walletId"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
                defaultValue=""
              >
                <option value="" disabled>
                  اختر المحفظة
                </option>
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
                defaultValue="deposit"
              >
                <option value="deposit">إيداع</option>
                <option value="transfer">إرسال</option>
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">تاريخ العملية</span>
              <input
                required
                type="date"
                name="operationDate"
                defaultValue={today}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">ملاحظات (اختياري)</span>
              <input
                name="notes"
                placeholder="مثال: تسوية نهاية اليوم"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring"
              />
            </label>
          </div>
          <button
            disabled={walletRows.length === 0}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            تسجيل العملية
          </button>
          {walletRows.length === 0 ? <p className="text-sm text-amber-700">أضف محفظة أولاً قبل إدخال العمليات.</p> : null}
        </form>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">3) ملخص الليمت لكل محفظة</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">اليوم: {today}</span>
        </div>

        {summaries.length === 0 ? (
          <p className="text-slate-600">لا توجد محافظ حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-3 py-3 font-semibold">المحفظة</th>
                  <th className="px-3 py-3 font-semibold">ليمت يومي</th>
                  <th className="px-3 py-3 font-semibold">مستخدم اليوم</th>
                  <th className="px-3 py-3 font-semibold">المتبقي اليوم</th>
                  <th className="px-3 py-3 font-semibold">ليمت شهري</th>
                  <th className="px-3 py-3 font-semibold">إرسال الشهر</th>
                  <th className="px-3 py-3 font-semibold">إيداع الشهر</th>
                  <th className="px-3 py-3 font-semibold">المتبقي الشهر</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((wallet) => {
                  const dailyExceeded = wallet.dailyRemaining < 0;
                  const monthlyExceeded = wallet.monthlyRemaining < 0;

                  return (
                    <tr key={wallet.id} className="border-b border-slate-100 last:border-none">
                      <td className="px-3 py-3 font-medium text-slate-900">{wallet.name}</td>
                      <td className="px-3 py-3">{formatMoney(wallet.dailyLimit)}</td>
                      <td className="px-3 py-3">{formatMoney(wallet.dailyUsage)}</td>
                      <td className={`px-3 py-3 font-medium ${dailyExceeded ? "text-red-600" : "text-emerald-700"}`}>
                        {formatMoney(wallet.dailyRemaining)}
                      </td>
                      <td className="px-3 py-3">{formatMoney(wallet.monthlyLimit)}</td>
                      <td className="px-3 py-3">{formatMoney(wallet.monthlyTransferUsage)}</td>
                      <td className="px-3 py-3 text-blue-700">{formatMoney(wallet.monthlyDepositUsage)}</td>
                      <td className={`px-3 py-3 font-medium ${monthlyExceeded ? "text-red-600" : "text-emerald-700"}`}>
                        {formatMoney(wallet.monthlyRemaining)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">4) آخر العمليات</h2>
        </div>

        {recentRows.length === 0 ? (
          <p className="text-slate-600">لا توجد عمليات مسجلة حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="px-3 py-3 font-semibold">التاريخ</th>
                  <th className="px-3 py-3 font-semibold">المحفظة</th>
                  <th className="px-3 py-3 font-semibold">النوع</th>
                  <th className="px-3 py-3 font-semibold">المبلغ</th>
                  <th className="px-3 py-3 font-semibold">ملاحظات</th>
                  <th className="px-3 py-3 font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-none">
                    <td className="px-3 py-3">{row.operationDate}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{row.walletName}</td>
                    <td className="px-3 py-3">{operationTypeLabels[row.type]}</td>
                    <td className="px-3 py-3">{formatMoney(Number.parseFloat(row.amount))}</td>
                    <td className="px-3 py-3 text-slate-600">{row.notes || "-"}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/operations/${row.id}/edit`}
                        className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-200"
                      >
                        تعديل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-900">منطقة إدارة البيانات</h2>
        <p className="mt-2 text-sm text-red-800">
          هذا الزر يمسح كل المحافظ والعمليات نهائيًا. استخدمه فقط عند بدء دورة عمل جديدة.
        </p>
        <form action="/admin/clear-data" method="post" className="mt-4">
          <button className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700">مسح كل البيانات</button>
        </form>
      </section>
    </main>
  );
}
