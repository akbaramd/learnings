"use client"
import Link from 'next/link';
import {useSearchParams} from "next/navigation";



// ───────── Error Dictionary ─────────

type ErrorDetail = {
    title: string;
    description: string;
    actionUrl: string;
    actionText: string;
};

const errorDictionary: Record<string, ErrorDetail> = {
    // --- خطاهای مربوط به پارامترها و کوکی‌ها ---
    "invalid_callback_params": {
        title: "پارامترهای مفقود شده",
        description: "به نظر می‌رسد مرورگر شما یا سرور دژبان تصمیم گرفته‌اند برخی از اطلاعات حیاتی را در مسیر جا بگذارند. برای ادامه، باید از ابتدا شروع کنیم.",
        actionUrl: "/login",
        actionText: "بازگشت به صفحه ورود"
    },
    "session_expired_or_invalid_state": {
        title: "نشست نامعتبر یا منقضی شده",
        description: "حافظه کوتاه‌مدت مرورگر شما یاری نکرده یا زمان زیادی را صرف خیره شدن به صفحه ورود کرده‌اید. نشست امنیتی شما منقضی شده است.",
        actionUrl: "/login",
        actionText: "تلاش مجدد برای ورود"
    },

    // --- خطاهای بازگشتی از دژبان (Provider Errors) ---
    "access_denied": {
        title: "دسترسی مسدود شد",
        description: "شما از فرآیند ورود انصراف دادید یا سرور احراز هویت شما را شایسته ورود به سیستم ندانست. در هر صورت، اینجا پایان مسیر فعلی شماست.",
        actionUrl: "/",
        actionText: "بازگشت به صفحه اصلی"
    },
    "temporarily_unavailable": {
        title: "سرویس موقتاً خارج از دسترس",
        description: "زیرساخت‌های شبکه‌ای ما (یا دژبان) دچار افت فشار شده‌اند و در حال حاضر قادر به پاسخگویی نیستند. این یک مشکل گذراست، نه پایان جهان. لطفاً دقایقی دیگر مجدداً تلاش کنید.",
        actionUrl: "/login",
        actionText: "تلاش مجدد"
    },
    "invalid_request": {
        title: "درخواست نامعتبر",
        description: "درخواستی که به سمت سیستم احراز هویت ارسال شده، فاقد استانداردهای لازم بوده است. احتمالاً دستکاری دستی در آدرس مرورگر صورت گرفته است.",
        actionUrl: "/login",
        actionText: "شروع اصولی فرآیند"
    },

    // --- خطاهای سمت NextAuth و بک‌اند ---
    "CredentialsSignin": {
        title: "اعتبارنامه نامعتبر",
        description: "بک‌اند ما اطلاعات هویتی بازگشتی را نپذیرفت. یا شما واقعاً کسی که ادعا می‌کنید نیستید، یا دژبان اطلاعات اشتباهی به ما تحویل داده است.",
        actionUrl: "/login",
        actionText: "بازگشت به صفحه ورود"
    },
    "OAuthCallbackError": {
        title: "لغزش در ایستگاه پایانی",
        description: "همه چیز خوب پیش می‌رفت تا اینکه کتابخانه احراز هویت ما در لحظه تایید نهایی دچار مشکل شد. این مورد معمولاً ریشه در نوسانات شبکه‌ای دارد. لطفاً دوباره امتحان کنید.",
        actionUrl: "/login",
        actionText: "اجرای مجدد فرآیند"
    },

    // --- خطاهای زیرساختی و مدیریت‌نشده هندلر (Catch-All) ---
    "server_error": {
        title: "بحران درونی سرور",
        description: "سرورهای ما در حال حاضر درگیر یک بحران وجودی هستند و نمی‌توانند درخواست شما را پردازش کنند. لطفاً پس از نوشیدن یک فنجان چای دوباره تلاش کنید.",
        actionUrl: "/login",
        actionText: "تلاش مجدد (شاید این بار خوش‌شانس باشید)"
    },
    "callback_exception": {
        title: "خطای پردازش زیرساختی",
        description: "ارتباط بین سرورهای ما و سیستم احراز هویت در حساس‌ترین لحظه قطع شد. این اتفاقات در دنیای بی‌رحم شبکه‌های کامپیوتری کاملاً طبیعی است؛ لطفاً دوباره تلاش کنید.",
        actionUrl: "/login",
        actionText: "تلاش مجدد برای ورود"
    },
    "CallbackRouteError": {
        title: "خطای پردازش بازگشت",
        description: "سرور در حین پردازش پاسخ دریافتی دچار سردرگمی شد. ظاهراً کوکی‌های امنیتی شما در میانه راه مفقود شده‌اند یا پاسخی نامفهوم از زیرساخت دریافت شده است.",
        actionUrl: "/login",
        actionText: "شروع مجدد فرآیند ورود"
    },

    // --- خطای پیش‌فرض ---
    "default": {
        title: "خطای ناشناخته",
        description: "یک خطای کاملاً ناشناخته رخ داده است؛ از آن دسته خطاهایی که حتی لاگ‌های سرور هم علاقه‌ای به صحبت درباره آن ندارند. جای نگرانی نیست، دوباره امتحان کنید.",
        actionUrl: "/login",
        actionText: "بازگشت به نقطه امن"
    }
};

// ───────── Page Component ─────────



export default function AuthErrorPage() {

    const searchParams = useSearchParams();
    // استخراج ایمن کد خطا؛ در صورت نبودن، خطای پیش‌فرض نمایش داده می‌شود
    const rawError = searchParams?.get("error");
    const errorCode = typeof rawError === 'string' ? rawError : "default";
    console.log(rawError);

    // واکشی اطلاعات خطا از دیکشنری؛ باز هم یک لایه محافظتی برای کدهای تعریف نشده
    const errorDetails = errorDictionary[errorCode] || errorDictionary["default"];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    {/* آیکون خطای بصری */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <svg
                            className="h-8 w-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
                        {errorDetails.title}
                    </h2>

                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                        {errorDetails.description}
                    </p>

                    {/* نمایش کد خطای فنی برای کاربرانی که کنجکاو هستند */}
                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500 font-mono text-left direction-ltr border border-gray-200">
                        Error Code: {errorCode}
                    </div>
                </div>

                <div className="mt-8">
                    <Link
                        href={errorDetails.actionUrl}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        {errorDetails.actionText}
                    </Link>
                </div>

                <div className="mt-4 text-center text-xs text-gray-400">
                    تاریخ سیستم: 1405/02/12
                </div>
            </div>
        </div>
    );
}
