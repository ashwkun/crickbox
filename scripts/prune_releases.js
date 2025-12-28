// Native fetch used in Node 18+
const { UserRefreshClient } = require('google-auth-library');

const SITE_ID = 'boxboxcric';
const KEEP_count = 2; // Number of recent versions to keep

// Firebase CLI Credentials (Public)
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = ''; // Try empty secret for public client

async function getAccessToken(refreshToken) {
    const client = new UserRefreshClient(
        CLIENT_ID,
        CLIENT_SECRET,
        refreshToken
    );
    const res = await client.getAccessToken();
    return res.token;
}

async function pruneReleases(refreshToken) {
    if (!refreshToken) {
        console.error("Usage: node scripts/prune_releases.js <RefreshToken>");
        process.exit(1);
    }

    console.log("Exchanging refresh token for access token...");
    let accessToken;
    try {
        accessToken = await getAccessToken(refreshToken);
    } catch (e) {
        console.error("Failed to get access token:", e.message);
        return;
    }

    console.log(`Fetching versions for site: ${SITE_ID}...`);

    // 1. List Versions
    const listUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/${SITE_ID}/versions?pageSize=30`;
    const response = await fetch(listUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        console.error(`Failed to list versions: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(text);
        return;
    }

    const data = await response.json();
    const versions = data.versions || [];
    console.log(`Found ${versions.length} versions.`);

    if (versions.length <= KEEP_count) {
        console.log("No cleanup needed.");
        return;
    }

    // Sort desc (newest first)
    versions.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    const toDelete = versions.slice(KEEP_count);
    console.log(`Keeping ${KEEP_count} versions. Deleting ${toDelete.length} old versions...`);

    // 2. Delete Old Versions
    for (const version of toDelete) {
        // version.name matches "projects/boxboxcric/sites/boxboxcric/versions/..."
        const deleteUrl = `https://firebasehosting.googleapis.com/v1beta1/${version.name}`;
        console.log(`Deleting ${version.name} (${version.status})...`);

        const delRes = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (delRes.ok) {
            console.log("  Success.");
        } else {
            console.error(`  Failed: ${delRes.status}`);
        }
    }

    console.log("Cleanup complete.");
}

const token = process.argv[2];
pruneReleases(token);
