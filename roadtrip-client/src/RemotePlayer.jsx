function RemotePlayer({ player }) {
    return (
        <mesh position={[player.x, player.y, player.z]} rotation={[0, player.rotationY || 0, 0]}>
            <boxGeometry args={[1, 1, 2]} />
            <meshStandardMaterial color='#4A9FD8' />
        </mesh>
    )
}

export default RemotePlayer