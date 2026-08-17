const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchRoads(bbox) {
    const query = `
[out:json][timeout:25];
(
  way["highway"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
);
out body;
>;
out skel qt;
`

    let lastError = null

    for (const url of OVERPASS_ENDPOINTS) {
        try {
            console.log(`Trying Overpass endpoint: ${url}`)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'roadtrip-world-service/0.1 (dev)'
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: AbortSignal.timeout(30000)
            })

            if (!response.ok) {
                const text = await response.text()
                console.warn(`Endpoint ${url} failed: ${response.status}`)
                lastError = new Error(`Overpass ${response.status} from ${url}: ${text.slice(0, 200)}`)
                await delay(1000)
                continue
            }

            const data = await response.json()
            console.log(`Success from ${url}`)
            return parseOverpassResponse(data)
        } catch (err) {
            console.warn(`Endpoint ${url} error: ${err.message}`)
            lastError = err
            await delay(1000)
        }
    }

    throw lastError || new Error('All Overpass endpoints failed')
}

function parseOverpassResponse(data) {
    if (data.remark) {
        console.warn('⚠️ Overpass remark (possible partial/truncated result):', data.remark);
    }

    const nodeMap = new Map()
    const ways = []

    for (const el of data.elements) {
        if (el.type === 'node') {
            nodeMap.set(el.id, el)
        } else if (el.type === 'way') {
            ways.push(el)
        }
    }

    const roadSegments = ways.map(way => ({
        id: `way-${way.id}`,
        points: way.nodes
            .map(nodeId => nodeMap.get(nodeId))
            .filter(Boolean)
            .map(n => [n.lat, n.lon, 0]),
        roadType: way.tags?.highway || 'unknown'
    }))

    return roadSegments
}

export async function fetchWaterFeatures(bbox) {
    const query = `
[out:json][timeout:60];
(
  way["natural"="coastline"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
  way["natural"="beach"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
  way["natural"="water"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});
);
out body;
>;
out skel qt;
`

    let lastError = null

    for (const url of OVERPASS_ENDPOINTS) {
        try {
            console.log(`Trying Overpass (water) endpoint: ${url}`)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'roadtrip-world-service/0.1 (dev)'
                },
                body: `data=${encodeURIComponent(query)}`,
                signal: AbortSignal.timeout(30000)
            })

            if (!response.ok) {
                const text = await response.text()
                lastError = new Error(`Overpass ${response.status} from ${url}: ${text.slice(0, 200)}`)
                await delay(1000)
                continue
            }

            const data = await response.json()
            console.log(`Success (water) from ${url}`)
            return parseWaterResponse(data)
        } catch (err) {
            lastError = err
            await delay(1000)
        }
    }

    throw lastError || new Error('All Overpass endpoints failed (water)')
}

function parseWaterResponse(data) {
    const nodeMap = new Map()
    const ways = []

    for (const el of data.elements) {
        if (el.type === 'node') {
            nodeMap.set(el.id, el)
        } else if (el.type === 'way') {
            ways.push(el)
        }
    }

    return ways.map(way => ({
        id: `water-${way.id}`,
        points: way.nodes
            .map(nodeId => nodeMap.get(nodeId))
            .filter(Boolean)
            .map(n => [n.lat, n.lon]),
        waterType: way.tags?.natural || 'unknown'
    }))
}