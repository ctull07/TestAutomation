export async function parseSizeToBytes(sizeText: string): Promise<number> {
    const match = sizeText.trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) {
        throw new Error(`Invalid size format: "${sizeText}"`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    const multipliers: Record<string, number> = {
        B: 1,
        KB: 1024,          // Change to 1000 if your app uses decimal units (SI)
        MB: 1024 ** 2,     // Change to 1000 ** 2 if decimal
        GB: 1024 ** 3,
        TB: 1024 ** 4,
    };

    return value * multipliers[unit];
}

export async function formatBytes(bytes: number): Promise<string> {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
