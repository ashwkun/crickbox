
const fs = require('fs');
const https = require('https');
const path = require('path');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

// --- CONFIG ---
const BOT_TOKEN = process.env.AI_TOKEN; // Passed from GitHub Secrets (AI_TOKEN)
const MATCH_SUMMARY_FILE = path.join(__dirname, '../src/data/ai_match_summaries.json');
const AUDIO_DIR = path.join(__dirname, '../src/data/audio');
const WISDEN_CLIENT_ID = 'e656463796'; // From wisdenConfig.ts
const SCORECARD_CLIENT_ID = '430fdd0d';
const MAX_MATCHES_TO_PROCESS = 5; // Safety limit per run

// --- PRIORITY LOGIC (Ported from matchPriority.ts) ---
const TOP_ICC_TEAMS = ['4', '1', '3', '13', '5', '6', '9', '8', '7', '2'];
const TOP_WOMENS_TEAMS = ['India W', 'Australia W', 'England W', 'South Africa W', 'New Zealand W'];

const ICC_WORLD_CUPS = ['T20 WC', 'ODI WC', 'CT', 'W-T20 WC', 'W-ODI WC', 'U19 WC'];
const PREMIUM_LEAGUES = [
    'Indian Premier League', "Women's Premier League", 'Big Bash League',
    "Women's Big Bash League", 'The Hundred', 'SA20', 'ILT20',
    'Pakistan Super League', 'Caribbean Premier League', 'Lanka Premier League'
];

function getMatchPriority(match) {
    const combined = (match.series_name + ' ' + match.parent_series_name + ' ' + match.championship_name).toLowerCase();

    // Demote warmups
    if (combined.includes('warm-up')) return 100;

    // 1. ICC World Cups
    if (ICC_WORLD_CUPS.some(k => combined.includes(k.toLowerCase()))) return 1;

    // 2. Top 10 ICC Teams
    const isTopTeam = (match.participants || []).some(p => TOP_ICC_TEAMS.includes(String(p.id)));
    if (match.league_code === 'icc' && isTopTeam) return 2;

    // 3. Premium Leagues
    if (PREMIUM_LEAGUES.some(k => combined.includes(k.toLowerCase()))) return 10;

    // 4. Top Women's Teams
    const isTopWomen = (match.participants || []).some(p => TOP_WOMENS_TEAMS.includes(p.name));
    if (isTopWomen) return 12;

    // Fallback
    if (match.league_code === 'icc') return 20;
    return 100; // Domestic/Low priority
}

function isHighPriority(match) {
    // Only process if priority <= 15 (Matches your filterJustFinished logic)
    return getMatchPriority(match) <= 15;
}

// --- NETWORK UTILS ---
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Model fallback chain: Try Grok first, then GPT-4o, then Llama
const MODEL_FALLBACK_CHAIN = [
    "grok-3",
    "gpt-4o",
    "meta/Llama-3.3-70B-Instruct"
];

async function postAI(prompt) {
    for (const model of MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`  Trying model: ${model}...`);
            const result = await callModel(prompt, model);
            if (result) {
                console.log(`  ✅ Success with ${model}`);
                return { text: result, model: model };
            }
        } catch (err) {
            console.log(`  ❌ ${model} failed: ${err.message}. Trying next...`);
        }
    }
    return null; // All models failed
}

function callModel(prompt, modelId) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            messages: [
                { role: "system", content: "You are a witty, insightful cricket expert. You write for a hardcore cricket audience." },
                { role: "user", content: prompt }
            ],
            model: modelId,
            temperature: 0.7,
            max_tokens: 600
        });

        const req = https.request('https://models.github.ai/inference/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOT_TOKEN}`,
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.error) {
                        reject(new Error(json.error.message || 'API Error'));
                    } else if (json.choices && json.choices[0]) {
                        resolve(json.choices[0].message.content);
                    } else {
                        reject(new Error('Empty response'));
                    }
                } catch (e) {
                    reject(new Error('Parse error: ' + body.substring(0, 50)));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// --- LOGGING HELPER ---
function log(msg) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${msg}`);
}

// --- MAIN LOGIC ---
async function main() {
    log('='.repeat(60));
    log('AI MATCH SUMMARY GENERATOR - Starting');
    log('='.repeat(60));

    if (!BOT_TOKEN) {
        log('❌ ERROR: No AI_TOKEN found. Exiting.');
        return;
    }
    log('✅ AI_TOKEN found');

    // 1. Get Date Range (Yesterday & Today)
    const today = new Date();
    const yes = new Date(today); yes.setDate(yes.getDate() - 1);
    const formatDate = (d) => d.toISOString().split('T')[0].split('-').reverse().join(''); // DDMMYYYY
    const range = `${formatDate(yes)}-${formatDate(today)}`;

    log(`📅 Date range: ${range}`);
    log('📡 Fetching match list from Wisden API...');
    const listUrl = `https://www.wisden.com/default.aspx?methodtype=3&client=${WISDEN_CLIENT_ID}&sport=1&league=0&timezone=0530&language=en&daterange=${range}`;

    let matches = [];
    try {
        const Data = await fetchJson(listUrl);
        matches = Data.matches || [];
        log(`✅ Fetched ${matches.length} total matches`);
    } catch (e) {
        log(`❌ Failed to fetch match list: ${e.message}`);
        return;
    }

    // 2. Filter: Completed & High Priority
    const relevantMatches = matches.filter(m =>
        (m.event_state === 'R' || m.event_state === 'C') && // Completed
        isHighPriority(m)
    );

    log(`🎯 High-priority completed matches: ${relevantMatches.length}`);
    relevantMatches.forEach((m, i) => log(`   ${i + 1}. ${m.short_event_status || m.game_id}`));

    if (relevantMatches.length === 0) {
        log('ℹ️  No relevant matches to process. Exiting.');
        return;
    }

    // 3. Load Existing Summaries
    let summaryDB = {};
    if (fs.existsSync(MATCH_SUMMARY_FILE)) {
        try {
            const content = fs.readFileSync(MATCH_SUMMARY_FILE, 'utf8').trim();
            if (content) {
                summaryDB = JSON.parse(content);
                log(`📂 Loaded ${Object.keys(summaryDB).length} existing summaries`);
            } else {
                log('📂 Existing file is empty. Starting fresh.');
            }
        } catch (e) {
            log(`⚠️ Could not parse existing summaries file: ${e.message}. Starting fresh.`);
        }
    } else {
        log('📂 No existing summary file found. Starting fresh.');
    }

    // 4. Process Matches
    let processedCount = 0;
    for (const match of relevantMatches) {
        if (processedCount >= MAX_MATCHES_TO_PROCESS) break;

        // IDEMPOTENCY CHECK
        if (summaryDB[match.match_id]) {
            log(`⏭️  Skipping ${match.match_id} (Summary already exists)`);
            continue;
        }

        log('-'.repeat(50));
        log(`🏏 Processing: ${match.short_event_status}`);
        log(`   Match ID: ${match.match_id} | Game ID: ${match.game_id}`);

        // Fetch Scorecard
        try {
            const scUrl = `https://www.wisden.com/cricket/v1/game/scorecard?lang=en&feed_format=json&client_id=${SCORECARD_CLIENT_ID}&game_id=${match.game_id}`;
            const scData = await fetchJson(scUrl);
            const scorecard = scData.data;

            // HELPER: Get Player Name
            const getPlayerName = (teamId, playerId) => {
                try {
                    const team = scorecard.Teams[teamId];
                    const player = team.Players[playerId];
                    return player.Name_Full || player.Name_Short || playerId;
                } catch (e) { return playerId; }
            };

            // DATA PREP: Extract Top Performers
            // CHECK: Match might be abandoned (No innings)
            if (!scorecard.Innings || scorecard.Innings.length === 0) {
                console.log(`Skipping ${match.match_id}: No innings data (Abandoned?)`);
                continue;
            }

            // HELPER: Get Team Name
            const getTeamName = (id) => {
                try {
                    return scorecard.Teams[id]?.Name_Full || scorecard.Teams[id]?.Name_Short || id;
                } catch (e) { return id; }
            };

            const homeTeamName = getTeamName(scorecard.Matchdetail.Team_Home);
            const awayTeamName = getTeamName(scorecard.Matchdetail.Team_Away);

            const inningsData = scorecard.Innings.map(inn => {
                const teamName = inn.Battingteam === scorecard.Matchdetail.Team_Home ? homeTeamName : awayTeamName;

                // Top 3 Batsmen by Runs
                const topBats = (inn.Batsmen || [])
                    .sort((a, b) => parseInt(b.Runs || 0) - parseInt(a.Runs || 0))
                    .slice(0, 3)
                    .map(b => `${getPlayerName(inn.Battingteam, b.Batsman)}: ${b.Runs} (${b.Balls})`);

                // Top 3 Bowlers by Wickets
                const topBowls = (inn.Bowlers || [])
                    .sort((a, b) => parseInt(b.Wickets || 0) - parseInt(a.Wickets || 0))
                    .slice(0, 3)
                    .map(b => `${getPlayerName(scorecard.Matchdetail.Team_Home === inn.Battingteam ? scorecard.Matchdetail.Team_Away : scorecard.Matchdetail.Team_Home, b.Bowler)}: ${b.Wickets}/${b.Runs} (${b.Overs}ov)`);

                return {
                    team: teamName,
                    score: `${inn.Total}/${inn.Wickets} (${inn.Overs})`,
                    topBats,
                    topBowls
                };
            });

            // FETCH OBO DATA (For Narrative Flow)
            let oboNarrative = "Not available";
            try {
                // Construct OBO URL based on game_id (remove non-alphanumeric, use last 6 digits?)
                // Actually, wisden game_id usually works directly in the filename structure "gameId_overbyover_2.json"
                // But doc says match_id is last 6. Let's try direct game_id first as filename usually matches.
                // Doc example: minblr01092026267686 -> minblr01092026267686_overbyover_2.json

                const oboUrl = `https://www.wisden.com/cricket/live/json/${match.game_id}_overbyover_2.json`;
                // Use the proxy logic or direct if possible. The script runs in Node so no CORS.
                // But the doc says OBO files are at www.wisden.com/cricket/live/json/... which might be accessible directly.

                const oboDataRaw = await fetchJson(oboUrl).catch(() => null);

                if (oboDataRaw && oboDataRaw.Overbyover) {
                    const overs = oboDataRaw.Overbyover;
                    const totalOvers = overs.length;

                    // 1. Last 5 Overs (The Finish)
                    const deathOvers = overs.slice(-5).map(o => {
                        return `Over ${o.Over}: ${o.Runs} runs, ${o.Wickets} wkts. (Bowler: ${Object.values(o.Bowlers)[0]?.Bowler})`;
                    }).join('\n');

                    // 2. Big Moments (High Scoring or Wickets)
                    const bigMoments = overs.filter(o =>
                        (parseInt(o.Runs) >= 15) || (parseInt(o.Wickets) >= 2)
                    ).map(o => `Over ${o.Over}: ${o.Runs} runs, ${o.Wickets} wkts`);

                    oboNarrative = `
The Finish (Last 5 Overs):
${deathOvers}

Other Big Moments:
${bigMoments.join(', ')}
`;
                }
            } catch (e) { console.log("OBO Fetch failed (non-fatal): " + e.message); }

            // NOTES (Drops, Milestones)
            let matchNotes = "None";
            try {
                const notesObj = scorecard.Matchdetail.Notes || {};
                const allNotes = [];
                Object.values(notesObj).forEach(list => {
                    if (Array.isArray(list)) allNotes.push(...list);
                });
                if (allNotes.length > 0) matchNotes = allNotes.join('\n');
            } catch (e) { }

            // Prepare Rich Prompt
            const prompt = `
You are an expert cricket analyst writing for ESPN Cricinfo or Cricbuzz.
Write a concise but engaging match summary (approx 80-100 words).

**IMPORTANT FORMATTING INSTRUCTION:**
Start your response with a **Single Line Headline** wrapped in asterisks (e.g., **Sharma ton seals win for India**). Do NOT use labels like "Headline:" or "Match Summary:". Just the headline text.

Match: ${homeTeamName} vs ${awayTeamName}
Result: ${scorecard.Matchdetail.Result}
Player of Match: ${scorecard.Matchdetail.Player_Match}

Innings Data:
${inningsData.map((inn, idx) => `
Innings ${idx + 1} (${inn.team}): ${inn.score}
Key Batters: ${inn.topBats.join(', ')}
Key Bowlers: ${inn.topBowls.join(', ')}
`).join('\n')}

Match Flow & Key Moments:
${oboNarrative}

Match Notes (Crucial Drama):
${matchNotes}

Guidelines:
1. **Narrative Arc**: Use the 'Match Flow' to describe the finish. Was it tight? Did a big over change it? Mention the specific runs in the final overs if dramatic.
2. **Drama**: Use 'Match Notes' to mention dropped catches or turning points. Ignore boring admin notes (Time-outs).
3. **Style**: Punchy, journalistic, slightly "edgy" or witty (Grok Style). NO generic "It was a thrilling match" intros.
4. **No Hallucinations**: Only mention players/events listed above.
`;

            // Call AI
            log('   🤖 Calling AI...');
            const startTime = Date.now();
            const aiRes = await postAI(prompt);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            if (aiRes && aiRes.text) {
                // Generate Audio
                let audioFile = null;
                try {
                    audioFile = await generateAudio(aiRes.text, match.match_id);
                } catch (audioErr) {
                    log(`   ⚠️  Audio generation failed: ${audioErr.message}`);
                }

                summaryDB[match.match_id] = {
                    text: aiRes.text,
                    model: aiRes.model,
                    audio: audioFile,
                    generated_at: new Date().toISOString()
                };
                log(`   ✅ Summary generated in ${duration}s (via ${aiRes.model})`);
                if (audioFile) log(`   🔊 Audio saved: ${audioFile}`);
                log(`   📝 "${aiRes.text.substring(0, 60)}..."`);
                processedCount++;
            } else {
                log('   ⚠️  AI returned empty response');
            }


            // Rate limit protection delay
            log('   ⏳ Waiting 5s before next request...');
            await new Promise(r => setTimeout(r, 5000));

        } catch (e) {
            log(`   ❌ Error: ${e.message}`);
        }
    }

    // 5. Save DB
    log('='.repeat(60));
    if (processedCount > 0) {
        // Ensure directory exists
        const dir = path.dirname(MATCH_SUMMARY_FILE);
        if (!fs.existsSync(dir)) {
            log(`📁 Creating directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(MATCH_SUMMARY_FILE, JSON.stringify(summaryDB, null, 2));
        log(`✅ DONE: Saved ${processedCount} new summaries to ${MATCH_SUMMARY_FILE}`);
    } else {
        log('ℹ️  DONE: No new summaries generated.');
    }
    log('='.repeat(60));
}

main().catch(err => {
    log(`FATAL ERROR: ${err.message}`);
    process.exit(1);
});

async function generateAudio(text, matchId) {
    if (!process.env.GOOGLE_TTS_KEY) {
        log('   ⚠️  No Google TTS Key found. Skipping audio.');
        return null;
    }

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Clean text for speech
    const speechText = text
        .replace(/\*\*/g, '')          // Remove markdown bold
        .replace(/(\d+)\/(\d+)/g, '$1 for $2')  // 2/40 -> 2 for 40
        .replace(/(\d+)\*/g, '$1 not out')      // 163* -> 163 not out
        .replace(/SR\s?(\d+)/gi, 'strike rate $1')
        .replace(/RR\s?(\d+)/gi, 'run rate $1');

    const client = new TextToSpeechClient();
    const request = {
        input: { text: speechText },
        // Select the language and SSML voice gender (optional)
        voice: { languageCode: 'en-AU', name: 'en-AU-Neural2-B' },
        // select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioFileName = `${matchId}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);

    fs.writeFileSync(audioPath, response.audioContent, 'binary');
    return audioFileName;
}
