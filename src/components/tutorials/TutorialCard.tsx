'use client';

import React, { useState } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import FacilityVideoTutorialDrawer from '@/src/components/overlays/FacilityVideoTutorialDrawer';
import VideoTutorialDrawer from '@/src/components/overlays/VideoTutorialDrawer';
import {
  PiVideo,
  PiPlay,
} from 'react-icons/pi';

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
  category: 'facility' | 'tour' | 'survey' | 'general';
  icon?: React.ReactNode;
  accentColor?: 'emerald' | 'blue' | 'amber' | 'purple';
}

interface TutorialCardProps {
  tutorial: Tutorial;
  dir?: 'ltr' | 'rtl' | 'auto';
  className?: string;
}

export function TutorialCard({ tutorial, dir = 'rtl', className }: TutorialCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const accentColors = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  };

  const accentColor = tutorial.accentColor || 'emerald';
  const iconBgClass = accentColors[accentColor];

  const handleOpenVideo = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseVideo = () => {
    setIsDrawerOpen(false);
  };

  const getDrawerComponent = () => {
    if (tutorial.category === 'facility') {
      return (
        <FacilityVideoTutorialDrawer
          open={isDrawerOpen}
          onClose={handleCloseVideo}
          videoSrc={tutorial.videoSrc}
          title={tutorial.title}
          subtitle={tutorial.description}
        />
      );
    }
    return (
      <VideoTutorialDrawer
        open={isDrawerOpen}
        onClose={handleCloseVideo}
        videoSrc={tutorial.videoSrc}
        title={tutorial.title}
        subtitle={tutorial.description}
      />
    );
  };

  return (
    <>
      <Card
        variant="default"
        radius="lg"
        padding="md"
        className={`transition-all duration-200 hover:shadow-md ${className || ''}`}
        dir={dir}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg ${iconBgClass}`}>
            {tutorial.icon || <PiVideo className="h-6 w-6" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {tutorial.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
              {tutorial.description}
            </p>
            <Button
              variant="outline"
              color="primary"
              size="sm"
              block
              onClick={handleOpenVideo}
              leftIcon={<PiPlay className="h-4 w-4" />}
              className="font-medium"
            >
              تماشای ویدیو
            </Button>
          </div>
        </div>
      </Card>

      {/* Video Drawer */}
      {getDrawerComponent()}
    </>
  );
}

export function TutorialCardSkeleton({ dir = 'rtl' }: { dir?: 'ltr' | 'rtl' | 'auto' }) {
  return (
    <Card
      variant="default"
      radius="lg"
      padding="md"
      className="animate-pulse"
      dir={dir}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded mt-3" />
        </div>
      </div>
    </Card>
  );
}

