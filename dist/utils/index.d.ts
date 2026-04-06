import { ClassValue } from 'clsx';

declare function cn(...inputs: ClassValue[]): string;
declare const getRiskText: (risk: number) => string;

export { cn, getRiskText };
