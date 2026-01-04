export const formatDuration = (seconds?: number | string | null): string => {
  if (seconds === null || seconds === undefined) return '0:00';
  const sec = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (Number.isNaN(sec)) return '0:00';
  const minutes = Math.floor(sec / 60);
  const remainingSeconds = Math.max(0, Math.floor(sec % 60));
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatMilliseconds = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  return formatDuration(totalSeconds);
};

export const getImageUrl = (
  images?: Array<{ quality: string; link?: string; url?: string }>,
  quality: '50x50' | '150x150' | '500x500' = '500x500'
): string => {
  if (!images || images.length === 0) return '';
  const image = images.find((img) => img.quality === quality) || images[images.length - 1];
  return image?.link || image?.url || '';
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const formatPlayCount = (count?: string | number | null): string => {
  if (count === null || count === undefined) return '0';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (Number.isNaN(num) || num < 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const sanitizeTitle = (value?: string | null): string => {
  if (!value) return '';

  let title = value.replace(/&quot;/gi, '"');

  // Strip patterns like From "Movie Name"
  title = title.replace(/^From\s+["']([^"']+)["']$/i, '$1');

  // Remove leading From and trailing quotes if any remain
  title = title.replace(/^From\s+/, '').replace(/^"|"$/g, '').replace(/^'|'$/g, '');

  return title.trim();
};
