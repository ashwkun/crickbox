import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
}

export const DislodgedWicketIcon: React.FC<IconProps> = ({ size = 24, color = "currentColor", style, ...props }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={style}
            {...props}
        >
            {/* Three Stumps */}
            <path d="M6 21V9" />
            <path d="M12 21V9" />
            <path d="M18 21V9" />

            {/* Ground Line (Optional, keeping minimal) */}
            {/* <path d="M4 21h16" /> */}

            {/* Flying Bails - The "Dislodged" Action */}
            {/* Left Bail: Flying up and left, rotated */}
            <path d="M5 6l4-2" />

            {/* Right Bail: Flying up and right, rotated more */}
            <path d="M15 5l5 2" />

            {/* Motion Lines (Zzz style but for impact) */}
            <path d="M8 4l-1 -2" strokeOpacity="0.5" strokeWidth="1.5" />
            <path d="M16 3l1 -2" strokeOpacity="0.5" strokeWidth="1.5" />
        </svg>
    );
};
