/**
 * UpcomingListPage - Full calendar view with:
 * Row 1: Time filters (Custom + months + quarters + next year)
 * Row 2: Dynamic type chips from matchPriority utilities
 * Body: Series-centric layout with horizontal UpcomingCard scrolls
 */

import React, { useState, useMemo, useRef } from 'react';
import { Match } from '../../types';
import { LuCalendarDays, LuCalendarPlus, LuChevronRight, LuX } from 'react-icons/lu';
import UpcomingCard from '../UpcomingCard';
import { generateUpcomingChips, filterByChip, getMatchChip } from '../../utils/matchPriority';

interface UpcomingListPageProps {
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    onSeriesClick?: (seriesId: string, matches?: Match[]) => void;
}

// Generate time filter chips based on current date
const generateTimeChips = (): { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const chips: { id: string; label: string; startMonth: number; startYear: number; endMonth: number; endYear: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let month = currentMonth;
    let year = currentYear;

    // Add first 4 individual months
    for (let i = 0; i < 4 && month <= 11; i++) {
        chips.push({
            id: `${year}-${month}`,
            label: monthNames[month],
            startMonth: month,
            startYear: year,
            endMonth: month,
            endYear: year,
        });
        month++;
    }

    // Add quarterly groups until December
    while (month <= 11) {
        const startMonth = month;
        // End at either +2 months or December, whichever is first
        const endMonth = Math.min(month + 2, 11);

        if (startMonth === endMonth) {
            // Single month
            chips.push({
                id: `${year}-${startMonth}`,
                label: monthNames[startMonth],
                startMonth,
                startYear: year,
                endMonth,
                endYear: year,
            });
        } else {
            // Range
            chips.push({
                id: `${year}-${startMonth}-${endMonth}`,
                label: `${monthNames[startMonth]}-${monthNames[endMonth]}`,
                startMonth,
                startYear: year,
                endMonth,
                endYear: year,
            });
        }
        month = endMonth + 1;
    }

    // Add next year
    chips.push({
        id: `${currentYear + 1}`,
        label: `${currentYear + 1}`,
        startMonth: 0,
        startYear: currentYear + 1,
        endMonth: 11,
        endYear: currentYear + 1,
    });

    return chips;
};

const UpcomingListPage: React.FC<UpcomingListPageProps> = ({
    matches,
    onBack,
    onMatchClick,
    onSeriesClick,
}) => {
    const timeChips = useMemo(() => generateTimeChips(), []);
    const [selectedTime, setSelectedTime] = useState(timeChips[0]?.id || '');
    const [selectedTypeChip, setSelectedTypeChip] = useState('all');
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);

    // Filter matches by time
    const timeFilteredMatches = useMemo(() => {
        const chip = timeChips.find(c => c.id === selectedTime);
        if (!chip) return matches;

        return matches.filter(match => {
            const matchDate = new Date(match.start_date);
            const matchMonth = matchDate.getMonth();
            const matchYear = matchDate.getFullYear();

            if (matchYear < chip.startYear || matchYear > chip.endYear) return false;
            if (matchYear === chip.startYear && matchMonth < chip.startMonth) return false;
            if (matchYear === chip.endYear && matchMonth > chip.endMonth) return false;

            return true;
        });
    }, [matches, selectedTime, timeChips]);

    // Generate dynamic type chips based on time-filtered matches
    const typeChips = useMemo(() => {
        return generateUpcomingChips(timeFilteredMatches);
    }, [timeFilteredMatches]);

    // Reset type selection if chip no longer exists
    useMemo(() => {
        if (selectedTypeChip !== 'all' && !typeChips.find(c => c.id === selectedTypeChip)) {
            setSelectedTypeChip('all');
        }
    }, [typeChips, selectedTypeChip]);

    // Filter matches by type chip
    const filteredMatches = useMemo(() => {
        return filterByChip(timeFilteredMatches, selectedTypeChip);
    }, [timeFilteredMatches, selectedTypeChip]);

    // Group matches by series
    const seriesGroups = useMemo(() => {
        const groups = new Map<string, { seriesName: string; seriesId: string; matches: Match[] }>();

        // Sort by date first
        const sorted = [...filteredMatches].sort((a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        sorted.forEach(match => {
            const seriesId = match.series_id;
            if (!groups.has(seriesId)) {
                groups.set(seriesId, {
                    seriesName: match.series_name || 'Unknown Series',
                    seriesId,
                    matches: [],
                });
            }
            groups.get(seriesId)!.matches.push(match);
        });

        // Sort groups by earliest match date
        return Array.from(groups.values()).sort((a, b) =>
            new Date(a.matches[0].start_date).getTime() - new Date(b.matches[0].start_date).getTime()
        );
    }, [filteredMatches]);

    const chipStyle = (isSelected: boolean): React.CSSProperties => ({
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        flexShrink: 0,
        background: isSelected
            ? 'rgba(99, 102, 241, 0.2)'
            : 'rgba(255, 255, 255, 0.05)',
        border: isSelected
            ? '1px solid rgba(99, 102, 241, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        color: isSelected ? '#a5b4fc' : 'rgba(255, 255, 255, 0.6)',
        transition: 'all 0.2s ease',
    });

    const stickyChipStyle: React.CSSProperties = {
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        flexShrink: 0,
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: '#a5b4fc',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Spacer for FloatingHeader */}
            <div style={{ height: 84 }} />

            {/* Row 1: Time Filter */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
            }}>
                {/* Sticky Custom Chip */}
                <div
                    style={stickyChipStyle}
                    onClick={() => setShowCustomPicker(true)}
                >
                    <LuCalendarPlus size={14} />
                    Custom
                </div>

                {/* Scrollable Time Chips */}
                <div style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    flex: 1,
                    paddingRight: 16,
                    marginRight: -16,
                }}>
                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {timeChips.map(chip => (
                        <div
                            key={chip.id}
                            style={chipStyle(selectedTime === chip.id)}
                            onClick={() => setSelectedTime(chip.id)}
                        >
                            {chip.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Row 2: Dynamic Type Filter */}
            <div style={{
                display: 'flex',
                gap: 6,
                padding: '8px 16px 12px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
            }}>
                {typeChips.map(chip => (
                    <div
                        key={chip.id}
                        style={chipStyle(selectedTypeChip === chip.id)}
                        onClick={() => setSelectedTypeChip(chip.id)}
                    >
                        {chip.label}
                        {chip.count > 0 && (
                            <span style={{
                                marginLeft: 4,
                                opacity: 0.5,
                                fontSize: 10,
                            }}>
                                {chip.count}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Body: Series-Centric Content */}
            <div
                ref={contentRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 0 40px',
                }}
            >
                {seriesGroups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: 'var(--text-muted)',
                    }}>
                        <LuCalendarDays size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p style={{ fontSize: 14 }}>No matches in this period</p>
                    </div>
                ) : (
                    seriesGroups.map(group => (
                        <div key={group.seriesId} style={{ marginBottom: 24 }}>
                            {/* Series Header */}
                            <div
                                onClick={() => onSeriesClick?.(group.seriesId, group.matches)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 16px',
                                    cursor: onSeriesClick ? 'pointer' : 'default',
                                }}
                            >
                                <h3 style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    letterSpacing: '0.3px',
                                    textTransform: 'uppercase',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: 1.4,
                                    flex: 1,
                                }}>
                                    {group.seriesName}
                                </h3>
                                {onSeriesClick && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        color: 'var(--text-muted)',
                                        fontSize: 11,
                                        flexShrink: 0,
                                    }}>
                                        {group.matches.length} matches
                                        <LuChevronRight size={14} />
                                    </div>
                                )}
                            </div>

                            {/* Horizontal Scroll of UpcomingCards */}
                            <div style={{
                                display: 'flex',
                                gap: 16,
                                overflowX: 'auto',
                                scrollbarWidth: 'none',
                                padding: '4px 16px 8px',
                            }}>
                                <style>{`.series-cards::-webkit-scrollbar { display: none; }`}</style>
                                {group.matches.map(match => (
                                    <div key={match.game_id} style={{ flexShrink: 0, width: 280 }}>
                                        <UpcomingCard
                                            match={match}
                                            matches={group.matches}
                                            onClick={onMatchClick}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Custom Date Picker Modal (Placeholder) */}
            {showCustomPicker && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                }} onClick={() => setShowCustomPicker(false)}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 320,
                            width: '100%',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Custom Date Range</h3>
                            <LuX
                                size={20}
                                style={{ cursor: 'pointer', opacity: 0.6 }}
                                onClick={() => setShowCustomPicker(false)}
                            />
                        </div>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: 13,
                            textAlign: 'center',
                            padding: '40px 0',
                        }}>
                            Coming soon: Select specific dates, months, or ranges
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpcomingListPage;
