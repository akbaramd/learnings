'use client';

import { useState } from 'react';
import Button from './Button';
import {
  PiShareNetwork,
  PiPaperPlaneTilt,
  PiWhatsappLogo,
  PiTwitterLogo,
  PiCopy,
  PiCheck,
} from 'react-icons/pi';
import { useToast } from '@/src/hooks/useToast';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ShareButton({
  url,
  title,
  description,
  variant = 'ghost',
  size = 'md',
  className,
}: ShareButtonProps) {
  // If Web Share API is available, use native share
  const handleWebShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }
  };

  // If Web Share API is available, use native share
  if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
    return (
      <Button
        variant={variant === 'primary' ? 'solid' : 'outline'}
        color={variant === 'primary' ? 'primary' : 'secondary'}
        size={size}
        onClick={handleWebShare}
        leftIcon={<PiShareNetwork className="h-4 w-4" />}
        className={className}
      >
        اشتراک‌گذاری
      </Button>
    );
  }

  // Fallback: Show Telegram share
  const handleTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative">
      <Button
        variant={variant === 'primary' ? 'solid' : 'outline'}
        color={variant === 'primary' ? 'primary' : 'secondary'}
        size={size}
        onClick={handleTelegram}
        leftIcon={<PiPaperPlaneTilt className="h-4 w-4" />}
        className={className}
      >
        اشتراک در تلگرام
      </Button>
    </div>
  );
}

// Share menu component with all options
export function ShareMenu({
  url,
  title,
  description,
  onClose,
}: {
  url: string;
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  const shareText = description 
    ? `${title}\n\n${description}\n\n${url}`
    : `${title}\n\n${url}`;

  const shareOptions = [
    {
      name: 'تلگرام',
      icon: PiPaperPlaneTilt,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      action: () => {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
        onClose?.();
      },
    },
    {
      name: 'واتساپ',
      icon: PiWhatsappLogo,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      action: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        onClose?.();
      },
    },
    {
      name: 'توییتر',
      icon: PiTwitterLogo,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-900/30',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        onClose?.();
      },
    },
    {
      name: 'کپی لینک',
      icon: copied ? PiCheck : PiCopy,
      color: copied ? 'text-green-500' : 'text-gray-500',
      bgColor: copied ? 'bg-green-50 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-800/50',
      action: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          success('لینک کپی شد');
          setTimeout(() => {
            setCopied(false);
            onClose?.();
          }, 1500);
        } catch (err) {
          console.error('Failed to copy:', err);
          error('خطا در کپی لینک');
        }
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-2">
      {shareOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.name}
            onClick={option.action}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-lg
              transition-all duration-200
              ${option.bgColor}
              ${option.color}
              hover:scale-105 active:scale-95
              border border-transparent hover:border-current/20
            `}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium">{option.name}</span>
          </button>
        );
      })}
    </div>
  );
}

