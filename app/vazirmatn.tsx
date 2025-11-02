import {Vazirmatn} from "next/font/google";

export const vazirmatn = Vazirmatn({
    // Pick only what you need to minimize CSS size
    subsets: ['arabic', 'latin'],
    // Choose the exact weights you actually use
    weight: ['300', '400', '500', '600', '700'],
    // Expose a CSS variable for Tailwind 4 integration
    variable: '--font-vazirmatn',
    // Good default to avoid FOIT
    display: 'swap',
    // Optional: limit to normal style if you don’t use italics
    style: ['normal'],
});