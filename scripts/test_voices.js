const fs = require('fs');
const path = require('path');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

const AUDIO_DIR = path.join(__dirname, '../src/data/audio');

if (!process.env.GOOGLE_TTS_KEY) {
    console.error('No GOOGLE_TTS_KEY');
    process.exit(1);
}

const client = new TextToSpeechClient();

const SAMPLE_TEXT = "Australia have beaten England by 5 wickets. Travis Head scored a brilliant century, blasting 163 runs off just 120 balls.";

const VOICES = [
    { name: 'en-US-Studio-M', label: 'Studio-US-Male' }, // Premium
    { name: 'en-GB-Neural2-D', label: 'Neural2-UK-Male' }, // Standard Premium
    { name: 'en-IN-Neural2-B', label: 'Neural2-IN-Male' }, // Standard Premium
    { name: 'en-AU-Neural2-C', label: 'Neural2-AU-Female' } // Alt AU
];

async function generate() {
    if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

    for (const v of VOICES) {
        console.log(`Generating ${v.label} (${v.name})...`);
        const request = {
            input: { text: SAMPLE_TEXT },
            voice: { languageCode: v.name.substring(0, 5), name: v.name },
            audioConfig: { audioEncoding: 'MP3' },
        };

        try {
            const [response] = await client.synthesizeSpeech(request);
            const fileName = `sample_${v.label}.mp3`;
            fs.writeFileSync(path.join(AUDIO_DIR, fileName), response.audioContent, 'binary');
            console.log(`✅ Saved ${fileName}`);
        } catch (e) {
            console.error(`❌ Failed ${v.label}:`, e.message);
        }
    }
}

generate();
