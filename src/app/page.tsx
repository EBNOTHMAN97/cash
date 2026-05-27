import Link from "next/link";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8" dir="rtl">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-medium text-blue-600">أهلاً بك</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">الصفحة الرئيسية للنظام</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          دي صفحة Home بسيطة ومنظمة داخل ملفات المشروع بعد التنزيل. من هنا تقدر تدخل مباشرة على لوحة إدارة
          المحافظ اليومية والشهرية، وتكمل تسجيل الإرسال والإيداع والتعديل ومسح البيانات.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            الدخول إلى لوحة المحافظ
          </Link>
          <Link
            href="/api/health"
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            فحص صحة النظام
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">إضافة محافظ</h2>
          <p className="mt-2 text-sm text-slate-600">أنشئ أي عدد من المحافظ مع ليمت يومي وشهري.</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">تسجيل عمليات</h2>
          <p className="mt-2 text-sm text-slate-600">سجل الإرسال والإيداع مع التاريخ والملاحظات.</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold text-slate-900">متابعة الليمت</h2>
          <p className="mt-2 text-sm text-slate-600">حساب الليمت الشهري على الإرسال فقط مع عرض الإيداعات.</p>
        </article>
      </section>
    </main>
  );
}
