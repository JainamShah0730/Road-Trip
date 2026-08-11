import { useEffect, useRef } from "react";

export function useKeyboardControls() {
    const keys = useRef({ forward: false, backward: false, left: false, right: false });

    useEffect(() => {
        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': keys.current.forward = true; break;
                case 'ArrowDown': case 's': case 'S': keys.current.backward = true; break;
                case 'ArrowLeft': case 'a': case 'A': keys.current.left = true; break;
                case 'ArrowRight': case 'd': case 'D': keys.current.right = true; break;
            }
        }

        const handleKeyUp = (e) => {
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': keys.current.forward = false; break;
                case 'ArrowDown': case 's': case 'S': keys.current.backward = false; break;
                case 'ArrowLeft': case 'a': case 'A': keys.current.left = false; break;
                case 'ArrowRight': case 'd': case 'D': keys.current.right = false; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, []);
    return keys;
}