export function calculateNextResetTime(windowMs: number): Date {
    const resetTime = new Date();
    resetTime.setMilliseconds(resetTime.getMilliseconds() + windowMs);
    return resetTime;
}
