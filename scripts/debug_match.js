// Wisden API Params for Past Matches (Method 3)
// Client = 2 (BoxCric)
// DateRange = 04012026-10012026 (cover specific range)
const URL = "https://www.wisden.com/default.aspx?methodtype=3&client=2&sport=1&league=0&timezone=0530&language=en&daterange=04012026-10012026";
const PROXY = "https://cors-proxy.kings_mountain.workers.dev/?url=";

async function checkMatch() {
    const fetch = (await import('node-fetch')).default;
    console.log("Fetching from:", URL);
    try {
        const res = await fetch(PROXY + encodeURIComponent(URL));
        const data = await res.json();

        const matches = data.matches || [];
        console.log(`Found ${matches.length} matches in range.`);

        const engAus = matches.find(m =>
            (m.participants[0].name.includes('England') || m.participants[0].name.includes('Australia')) &&
            (m.participants[1].name.includes('England') || m.participants[1].name.includes('Australia'))
        );

        if (engAus) {
            console.log("\nFound Match:");
            console.log("ID:", engAus.match_id || engAus.game_id);
            console.log("Date:", engAus.start_date);
            console.log("End Date:", engAus.end_date);
            console.log("Status:", engAus.event_status);
            console.log("Stage:", engAus.event_stage);
            console.log("State:", engAus.event_state);
        } else {
            console.log("Match not found in Wisden Filter.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

checkMatch();
