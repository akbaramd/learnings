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
  const encodedTitle = encodeURIComponent(title);
  const orgName = 'سازمان نظام مهندسی ساختمان آذربایجان غربی'; // نام سازمان
  const encodedOrg = encodeURIComponent(orgName);
  const imageUrl = `${baseUrl}/api/og-image-canvas?text=${encodedTitle}&width=1200&height=630&org=${encodedOrg}`;
  
  return {
    title,
    description,
    keywords: ['نظرسنجی', 'نظرسنجی آنلاین', 'survey', 'poll'],
    authors: [{ name: 'نظام' }],
    creator: 'نظام',
    publisher: 'نظام',
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
      title,
      description,
      siteName: 'نظام',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@nezam', // Update with your Twitter handle if available
      site: '@nezam', // Update with your Twitter handle if available
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
    // Telegram-specific meta tags
    other: {
      'telegram:channel': '@nezam', // Update with your Telegram channel if available
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:type': 'image/png',
      'og:locale:alternate': 'en_US',
      'article:author': 'نظام',
      'theme-color': '#ffffff',
    },
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
    const origin = `${protocol}://${host}`;
    const response = await fetch(`${origin}/api/public/surveys/${surveyId}/details`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(cookie ? { cookie } : {}),
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

