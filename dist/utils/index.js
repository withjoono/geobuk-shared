import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export const getRiskText = (risk) => {
    switch (risk) {
        case 10:
            return "😆 안전(+5단계)";
        case 9:
            return "😆 안전(+4단계)";
        case 8:
            return "👍 적정(+3단계)";
        case 7:
            return "👍 적정(+2단계)";
        case 6:
            return "👊 소신(+1단계)";
        case 5:
            return "👊 소신(-1단계)";
        case 4:
            return "😓 위험(-2단계)";
        case 3:
            return "😓 위험(-3단계)";
        case 2:
            return "💀 결격(-4단계)";
        case 1:
        default:
            return "💀 결격(-5단계)";
    }
};
