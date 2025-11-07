import { headers } from 'next/headers';

import PublicSurveyDetailPageClient from './PublicSurveyDetailPageClient';
import type { GetSurveyDetailsResponse, SurveyDto } from '@/src/store/surveys';

export const revalidate = 0;

interface PublicSurveyDetailPageProps {
  params: Promise<{ surveyId: string }>;
}


export async function generateMetadata({ params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;
  const survey = await fetchSurveyDetails(surveyId);
  
  const title = survey?.title ?? 'نظرسنجی';
  const description = survey?.description ?? 'نظرسنجی';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
  const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
  const pageUrl = `${baseUrl}/public/surveys/${surveyId}`;
  
  // Generate dynamic OG image URL with survey title and organization name
  // Using dynamic endpoint - ensure it's public and accessible
  const encodedTitle = encodeURIComponent(title);
  const orgName = 'سازمان نظام مهندسی ساختمان آذربایجان غربی';
  const encodedOrg = encodeURIComponent(orgName);
  const imageUrl = `${baseUrl}/api/og-image-canvas?text=${encodedTitle}&width=1200&height=630&org=${encodedOrg}`;
  
  // Ensure image URL is absolute and HTTPS
  const absoluteImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  // Standard OG metadata - only property= (Next.js generates property= automatically)
  return {
    title: `${title} — شرکت کنید`,
    description: description || 'برای تکمیل نظرسنجی رسمی روی این لینک کلیک کنید.',
    keywords: ['نظرسنجی', 'نظرسنجی آنلاین', 'survey', 'poll'],
    authors: [{ name: 'سازمان نظام مهندسی ساختمان آذربایجان غربی' }],
    creator: 'سازمان نظام مهندسی ساختمان آذربایجان غربی',
    publisher: 'سازمان نظام مهندسی ساختمان آذربایجان غربی',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: pageUrl,
      title: `${title} — شرکت کنید`,
      description: description || 'برای تکمیل نظرسنجی رسمی روی این لینک کلیک کنید.',
      siteName: 'سازمان نظام مهندسی ساختمان آذربایجان غربی',
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — شرکت کنید`,
      description: description || 'لطفاً فرم را تکمیل کنید.',
      images: [absoluteImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // No 'other' field - Next.js generates proper property= tags automatically
    // All OG tags will be property=, not name=
  };
}
async function fetchSurveyDetails(surveyId: string): Promise<SurveyDto | null> {
  if (!surveyId) {
    return null;
  }

  try {
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') ?? 'http';
    const host = headersList.get('host');

    if (!host) {
      console.error('[PublicSurveyDetailPage] Missing host header while building internal fetch URL.', {
        surveyId,
      });
      return null;
    }

    const cookie = headersList.get('cookie');
    const userAgent = headersList.get('user-agent') || '';
    const origin = `${protocol}://${host}`;
    
    // Check if it's a bot/crawler (they don't need cookies)
    const isBot = /TelegramBot|facebookexternalhit|TwitterBot|LinkedInBot|WhatsApp|Slackbot|bot|crawler/i.test(userAgent);
    
    const response = await fetch(`${origin}/api/public/surveys/${surveyId}/details`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        // Only send cookies for real users, not bots
        ...(cookie && !isBot ? { cookie } : {}),
        // Add user-agent for debugging
        'User-Agent': userAgent,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      console.error('[PublicSurveyDetailPage] Failed to fetch survey details from BFF.', {
        surveyId,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const payload = (await response.json()) as GetSurveyDetailsResponse;
    return payload?.data ?? null;
  } catch (error) {
    console.error('[PublicSurveyDetailPage] Unexpected error while fetching survey details.', {
      surveyId,
      error,
    });
    return null;
  }
}

export default async function PublicSurveyDetailPage({ params }: PublicSurveyDetailPageProps) {
  const { surveyId } = await params;

  if (!surveyId) {
    return null;
  }

  const survey = await fetchSurveyDetails(surveyId);

  return <PublicSurveyDetailPageClient surveyId={surveyId} survey={survey} />;
}

