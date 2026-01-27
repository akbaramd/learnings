import localFont from "next/font/local";

export const vazirmatn = localFont({
    src: [
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Thin.woff2', weight: '100', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-ExtraLight.woff2', weight: '200', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Light.woff2', weight: '300', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Regular.woff2', weight: '400', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Medium.woff2', weight: '500', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-SemiBold.woff2', weight: '600', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Bold.woff2', weight: '700', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-ExtraBold.woff2', weight: '800', style: 'normal' },
      { path: '/vazirmatn/fonts/webfonts/Vazirmatn-Black.woff2', weight: '900', style: 'normal' },
    ],
    variable: '--font-vazirmatn',
    display: 'swap',
  });