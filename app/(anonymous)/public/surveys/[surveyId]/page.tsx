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
  return {
    title: survey?.title ?? 'نظرسنجی',
    description: survey?.description ?? 'نظرسنجی',
    keywords:  ['نظرسنجی'],
    openGraph: {
      title: survey?.title ?? 'نظرسنجی',
      description: survey?.description ?? 'نظرسنجی',
      url: `https://${process.env.NEXT_PUBLIC_APP_URL}/public/surveys/${surveyId}`,
    },
  }
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

