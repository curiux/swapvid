import { formatBytes } from "@/lib/utils";

interface Storage {
    percentageUsed: number;
    storageUsed: number;
    storageLimit: number;
}

/**
 * SemiCircle component
 * - Displays a semi-circular progress bar representing storage usage.
 * - Shows used and total storage in human-readable format.
 * - Uses SVG for the visual representation and Tailwind CSS for styling.
 * - Props:
 *   - storage: { percentageUsed, storageUsed, storageLimit }
 */
export default function SemiCircle({ storage }: { storage: Storage }) {
    const dashArray = 282.74;
    const dashOffset = dashArray * (1 - storage.percentageUsed / 100);

    return (
        <div className="w-32 h-16 relative">
            <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Gray part */}
                <path
                    d="M10,100 A90,90 0 0,1 190,100"
                    fill="none"
                    stroke="#e5e7eb" // Tailwind: gray-200
                    strokeWidth="20"
                />

                {/* Used part */}
                <path
                    d="M10,100 A90,90 0 0,1 190,100"
                    fill="none"
                    stroke="#3b82f6" // Tailwind: blue-500
                    strokeWidth="20"
                    strokeDasharray="282.74"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Text */}
            <div className="absolute inset-0 flex items-center justify-center mt-6">
                <div className="text-center">
                    <p className="text-md font-bold">{formatBytes(storage.storageUsed)}</p>
                    <p className="text-xs font-bold">de {formatBytes(storage.storageLimit)}</p>
                    <p className="text-xs text-muted-foreground">usados</p>
                </div>
            </div>
        </div>
    );
}