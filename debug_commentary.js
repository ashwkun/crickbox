const fs = require('fs');
const path = require('path');

// Load wallstream data
const wallstreamRaw = fs.readFileSync(path.join(__dirname, 'api_samples/u19/wallstream.json'), 'utf8');
const wallstreamData = JSON.parse(wallstreamRaw);

// Simulate mapping (simplified from wallstreamApi.ts)
const mapBall = (assetRaw) => {
    try {
        const asset = typeof assetRaw === 'string' ? JSON.parse(assetRaw) : assetRaw;
        // console.log("Processing asset:", asset.Over, asset.Bowler_Details?.id);
        return {
            over: asset.Over,
            bowlerName: asset.Bowler_Details?.name || asset.Bowler_Name || '',
            bowlerId: asset.Bowler_Details?.id || asset.Bowler || '',
            batsmanName: asset.Batsman_Details?.name || '',
            batsmanId: asset.Batsman_Details?.id || '',
            isWicket: asset.Iswicket === true || asset.Iswicket === 'true',
            commentary: asset.Commentary || '',
            detail: asset.Detail || '',
            isball: asset.Isball === true || asset.Isball === 'true'
        };
    } catch (e) {
        return null;
    }
};

const balls = (wallstreamData.assets || [])
    .map(item => mapBall(item.custom_metadata.asset))
    .filter(b => b !== null);

console.log(`Total balls simulated: ${balls.length}`);

// Simulate Loop and Logic
balls.forEach((ball, idx) => {
    if (idx >= balls.length - 1) return; // Skip last one as no prev

    const prevBall = balls[idx + 1];

    // Logic from LiveDetail.tsx
    const isBowlerChangeCard = prevBall && ball.bowlerId !== prevBall.bowlerId;

    if (isBowlerChangeCard) {
        console.log(`\n[MATCH] New Bowler Detected at Over ${ball.over} (Index ${idx})`);
        console.log(`  Current Ball: ${ball.over} - Bowler: ${ball.bowlerName} (ID: ${ball.bowlerId})`);
        console.log(`  Prev Ball:    ${prevBall.over} - Bowler: ${prevBall.bowlerName} (ID: ${prevBall.bowlerId})`);
        console.log(`  Difference Detected? ${ball.bowlerId !== prevBall.bowlerId}`);
    } else {
        // Log specifically for the transition we checked visually: 49.1 vs 48.6
        if (ball.over === "49.1" || ball.over === "48.6") {
            // console.log(`[NO MATCH] Over ${ball.over} vs ${prevBall.over}`);
        }
    }
});
