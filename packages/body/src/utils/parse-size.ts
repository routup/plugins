const SIZE_UNITS: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
};

export function parseSize(input: number | string): number {
    if (typeof input === 'number') {
        return input;
    }

    const match = input.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);
    if (!match) {
        return Number.parseInt(input, 10);
    }

    const num = Number.parseFloat(match[1]!);
    const unit = match[2]!.toLowerCase();

    return Math.floor(num * (SIZE_UNITS[unit] ?? 1));
}
