import { usePage } from '@inertiajs/react';

interface Branding {
    theme: string;
    name: string;
    subtitle: string;
    tagline: string;
    logo_initial: string;
    logo_gradient_from: string;
    logo_gradient_to: string;
    logo_icon: string | null;
    logo_wordmark: string | null;
}

export default function AppLogo() {
    const { branding } = usePage<{ branding: Branding }>().props;

    return (
        <>
            {/* Icon: brand SVG or fallback gradient letter */}
            {branding.logo_icon ? (
                <img
                    src={branding.logo_icon}
                    alt={branding.name}
                    className="size-8 rounded-md object-contain"
                />
            ) : (
                <div
                    className="flex aspect-square size-8 items-center justify-center rounded-md text-white shadow-sm"
                    style={{
                        background: `linear-gradient(135deg, ${branding.logo_gradient_from}, ${branding.logo_gradient_to})`,
                    }}
                >
                    <span className="text-base font-black">{branding.logo_initial}</span>
                </div>
            )}

            {/* Wordmark image or fallback text */}
            {branding.logo_wordmark ? (
                <img
                    src={branding.logo_wordmark}
                    alt={branding.name}
                    className="ml-1 h-12 w-auto max-w-[180px] object-contain"
                />
            ) : (
                <div className="ml-1 grid flex-1 text-left">
                    <span className="truncate text-sm font-bold leading-tight tracking-tight">
                        {branding.name}
                        {branding.subtitle && (
                            <span className="ml-1 font-normal opacity-80">{branding.subtitle}</span>
                        )}
                    </span>
                    {branding.tagline && (
                        <span className="truncate text-[9px] uppercase tracking-widest opacity-60">
                            {branding.tagline}
                        </span>
                    )}
                </div>
            )}
        </>
    );
}
