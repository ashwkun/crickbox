/**
 * TimeFilter - Dropdown for filtering matches by time context
 * Used in Upcoming section to filter by Today, Tomorrow, This Week, etc.
 */

import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown, LuCalendarDays } from 'react-icons/lu';

export type TimeFilterValue = 'all' | 'today' | 'tomorrow' | 'week';

interface TimeFilterProps {
    value: TimeFilterValue;
    onChange: (value: TimeFilterValue) => void;
}

const OPTIONS: { value: TimeFilterValue; label: string }[] = [
    { value: 'all', label: 'All Upcoming' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
];

const TimeFilter: React.FC<TimeFilterProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = OPTIONS.find(o => o.value === value)?.label || 'All Upcoming';

    const triggerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        background: 'rgba(20, 20, 20, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        transition: 'all 0.2s ease',
        flexShrink: 0,
    };

    const dropdownStyle: React.CSSProperties = {
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        minWidth: '160px',
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.2s ease',
    };

    const optionStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '10px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: isSelected ? 600 : 500,
        cursor: 'pointer',
        background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
        color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.7)',
        transition: 'all 0.15s ease',
    });

    return (
        <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
            <div
                style={triggerStyle}
                onClick={() => setIsOpen(!isOpen)}
            >
                <LuCalendarDays size={14} style={{ opacity: 0.8 }} />
                <span>{selectedLabel}</span>
                <LuChevronDown
                    size={14}
                    style={{
                        opacity: 0.6,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </div>

            <div style={dropdownStyle}>
                {OPTIONS.map(option => (
                    <div
                        key={option.value}
                        style={optionStyle(option.value === value)}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        onMouseEnter={(e) => {
                            if (option.value !== value) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (option.value !== value) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimeFilter;
