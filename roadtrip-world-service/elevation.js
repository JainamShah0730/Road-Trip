const ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
const CHUNK_SIZE = 200;
const DELAY_BETWEEN_CHUNKS_MS = 1000;
const MAX_RETRIES = 4;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchElevations(points) {
    const elevations = [];
    const totalChunks = Math.ceil(points.length / CHUNK_SIZE);
    console.log(`Fetching elevations for ${points.length} points in ${totalChunks} chunks`);

    for (let i = 0; i < points.length; i += CHUNK_SIZE) {
        const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        const chunk = points.slice(i, i + CHUNK_SIZE);
        const locations = chunk.map(p => ({ latitude: p[0], longitude: p[1] }));

        let success = false;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(ELEVATION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locations })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Elevation request failed: ${response.status} – ${errorBody}`);
                }

                const data = await response.json();
                elevations.push(...data.results.map(r => r.elevation));
                success = true;
                console.log(`Elevation chunk ${chunkIndex}/${totalChunks} done (${elevations.length} points so far)`);
                break;
            } catch (err) {
                if (attempt === MAX_RETRIES) throw err;
                console.warn(`Elevation chunk ${chunkIndex} attempt ${attempt} failed: ${err.message}`);
                await delay(attempt * 2000);
            }
        }

        if (!success) throw new Error(`Failed to fetch elevation for chunk ${chunkIndex}`);
        if (i + CHUNK_SIZE < points.length) await delay(DELAY_BETWEEN_CHUNKS_MS);
    }

    return elevations;
}
