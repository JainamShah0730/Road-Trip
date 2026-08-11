const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation'
const CHUNK_SIZE = 100;

export async function fetchElevations(points) {
    const elevations = []

    for (let i = 0; i < points.length; i += CHUNK_SIZE) {
        const chunk = points.slice(i, i + CHUNK_SIZE)
        const lats = chunk.map(p => p[0]).join(',')
        const lngs = chunk.map(p => p[1]).join(',')

        const url = `${ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Elevation request failed: ${response.status}`)
        }

        const data = await response.json()
        elevations.push(...data.elevation)


    }

    return elevations
}