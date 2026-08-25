import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  return `${hours} hrs`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

export function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
