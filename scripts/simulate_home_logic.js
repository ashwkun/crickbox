const fs = require('fs');

// Mock utilities
const isBilateral = (matches) => {
    const uniqueTeams = new Set();
    matches.forEach(m => {
        m.participants?.forEach(p => uniqueTeams.add(p.short_name));
    });
    return uniqueTeams.size === 2;
};

const getMatchChip = (match) => {
    // simplified for test
    if (match.league_code === 'icc') return 'International';
    if (match.league_code === 'womens_international') return "Women's";
    // ... add more if needed
    return 'Domestic';
};

const filterByChip = (matches, chipId) => {
    if (chipId === 'all') return matches;
    return matches.filter(m => getMatchChip(m) === chipId);
};

// Main Simulation
async function simulateHomeLogic() {
    const fetch = (await import('node-fetch')).default;
    const CLIENT_MATCHES = 'e656463796';
    const WISDEN_MATCHES = `https://www.wisden.com/default.aspx?methodtype=3&client=${CLIENT_MATCHES}&sport=1&league=0&timezone=0530&language=en`;

    // Fetch Results Data
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 30);
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
    const dateRange = `${formatDate(past)}-${formatDate(today)}`;

    console.log(`Fetching data... range=${dateRange}`);
    const res = await fetch(`${WISDEN_MATCHES}&daterange=${dateRange}`);
    const data = await res.json();
    const completedMatches = data.matches || [];
    console.log(`Fetched ${completedMatches.length} matches.`);

    // --- HomePage Logic ---

    // Group By Series
    const completedSeriesGroups = {};
    completedMatches.forEach(m => {
        const sid = m.series_id || 'unknown';
        if (!completedSeriesGroups[sid]) completedSeriesGroups[sid] = [];
        completedSeriesGroups[sid].push(m);
    });

    // processedCompleted Logic (Direct copy-paste of deployed code)
    const result = [];
    const processedSeriesIds = new Set();

    // Pre-sort
    const sortedCompleted = [...completedMatches].sort((a, b) => {
        const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date(a.start_date).getTime();
        const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date(b.start_date).getTime();
        return dateB - dateA;
    });

    sortedCompleted.forEach(match => {
        const sid = match.series_id || 'unknown';
        const seriesMatches = completedSeriesGroups[sid] || [match];
        const isBilateralMatch = isBilateral(seriesMatches);
        const isPartOfSeries = sid && sid !== 'unknown';

        const itemDate = match.end_date ? new Date(match.end_date) : new Date(match.start_date);

        if (isBilateralMatch && isPartOfSeries) {
            if (!processedSeriesIds.has(sid)) {
                // Find latest match
                const latestSeriesMatch = seriesMatches.reduce((prev, current) => {
                    const prevDate = prev.end_date ? new Date(prev.end_date) : new Date(prev.start_date);
                    const currDate = current.end_date ? new Date(current.end_date) : new Date(current.start_date);
                    return (prevDate > currDate) ? prev : current;
                });

                result.push({ type: 'series', match: latestSeriesMatch, seriesId: sid, latestDate: itemDate }); // Note: code uses reduced match date
                processedSeriesIds.add(sid);
            }
        } else if (!isBilateralMatch && seriesMatches.length > 1) {
            result.push({ type: 'tournament', match, seriesId: sid, latestDate: itemDate });
        } else {
            result.push({ type: 'single', match, latestDate: itemDate });
        }
    });

    const processedCompleted = result.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    console.log(`Processed Items: ${processedCompleted.length}`);

    // Check availability of Ashes in Processed List
    const ashesItem = processedCompleted.find(item => item.match.series_name.includes('Ashes'));
    if (ashesItem) {
        console.log(`\n[Processed] FOUND ASHES ITEM:`);
        console.log(`- Type: ${ashesItem.type}`);
        console.log(`- Match: ${ashesItem.match.event_name}`);
        console.log(`- Date: ${ashesItem.latestDate}`);
        console.log(`- Chip: ${getMatchChip(ashesItem.match)}`);
    } else {
        console.log(`\n[Processed] ASHES NOT FOUND!`);
    }


    // Filter Simulation
    console.log(`\n--- Filtering 'All' Time + 'International' Type ---`);
    let filtered = processedCompleted;

    // Time: All (no-op)

    // Type: International
    filtered = filtered.filter(item => {
        const chip = getMatchChip(item.match);
        return chip === 'International';
    });

    console.log(`Filtered Items: ${filtered.length}`);
    const filteredAshes = filtered.find(item => item.match.series_name.includes('Ashes'));
    if (filteredAshes) {
        console.log(`[Filtered] ASHES SURVIVED!`);
        console.log(`Index in List: ${filtered.indexOf(filteredAshes)}`);
    } else {
        console.log(`[Filtered] ASHES DROPPED.`);
    }

}

simulateHomeLogic();
