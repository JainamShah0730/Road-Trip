export interface PlayerState {
    playerId: string;
    displayName: string
    position: [x: number, y: number, z: number]
    rotationY: number;
}

export interface RoomState {
    roomCode: string;
    players: Record<string, PlayerState>
    currentTileId: string
}

