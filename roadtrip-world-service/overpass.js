const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export async function fetchRoads(bbox) {
    const query = `[out:json][timeout:25];(way["highway"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}););out body;>;out skel qt;`

    const body = new URLSearchParams({ data: query })

    const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
            'User-Agent': 'roadtrip-world-service/0.1 (dev)'
        },
        body: body.toString()
    })


    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Overpass request failed: ${response.status} – ${text.slice(0, 200)}`)
    }

    const data = await response.json()
    return parseOverpassResponse(data)
}

function parseOverpassResponse(data) {
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