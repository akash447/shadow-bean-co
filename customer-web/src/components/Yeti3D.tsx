import { Suspense, useRef, useEffect, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { YetiState } from './Yeti';
import Yeti from './Yeti';

interface Yeti3DProps {
    state: YetiState;
    lookAt?: { x: number; y: number };
}

// Error boundary to catch GLB loading failures and fall back to SVG Yeti
class Yeti3DErrorBoundary extends Component<
    { children: ReactNode; fallback: ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: ReactNode; fallback: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

function YetiModel({ state, lookAt = { x: 0, y: 0 } }: Yeti3DProps) {
    const groupRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Object3D | null>(null);

    // Load the GLB model
    const { scene } = useGLTF('/models/yeti-model.glb');

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();

    useEffect(() => {
        // Find the head bone/node in the model hierarchy (adjust name based on actual model)
        if (groupRef.current) {
            groupRef.current.traverse((child) => {
                if (child.name.toLowerCase().includes('head') || child.name.toLowerCase().includes('neck')) {
                    headRef.current = child;
                }
            });
        }
    }, []);

    useFrame((frameState, delta) => {
        if (!groupRef.current) return;

        // Idle breathing animation
        if (state === 'idle') {
            groupRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.05;
            groupRef.current.rotation.z = Math.sin(frameState.clock.elapsedTime * 0.3) * 0.02;
        }

        // Watching state - track cursor with head
        if (state === 'watching' && headRef.current) {
            const targetX = lookAt.x * 0.5;
            const targetY = -lookAt.y * 0.3;

            headRef.current.rotation.y = THREE.MathUtils.lerp(
                headRef.current.rotation.y,
                targetX,
                delta * 3
            );
            headRef.current.rotation.x = THREE.MathUtils.lerp(
                headRef.current.rotation.x,
                targetY,
                delta * 3
            );
        }

        // Shy state - cover eyes (rotate body)
        if (state === 'shy') {
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y,
                Math.sin(frameState.clock.elapsedTime * 2) * 0.1,
                delta * 2
            );
        }

        // Happy state - jump animation
        if (state === 'happy') {
            const jumpHeight = Math.abs(Math.sin(frameState.clock.elapsedTime * 8)) * 0.5;
            groupRef.current.position.y = jumpHeight;
            groupRef.current.rotation.y = frameState.clock.elapsedTime * 2;
        }

        // Sad state - slump down
        if (state === 'sad') {
            groupRef.current.position.y = THREE.MathUtils.lerp(
                groupRef.current.position.y,
                -0.3,
                delta * 2
            );
            groupRef.current.rotation.z = THREE.MathUtils.lerp(
                groupRef.current.rotation.z,
                0.1,
                delta * 2
            );
        }

        // Reset position for non-sad states
        if (state !== 'sad' && state !== 'happy' && state !== 'idle') {
            groupRef.current.position.y = THREE.MathUtils.lerp(
                groupRef.current.position.y,
                0,
                delta * 2
            );
            groupRef.current.rotation.z = THREE.MathUtils.lerp(
                groupRef.current.rotation.z,
                0,
                delta * 2
            );
        }
    });

    return (
        <group ref={groupRef}>
            <primitive object={clonedScene} scale={1.5} />
        </group>
    );
}

function Yeti3DCanvas({ state, lookAt }: Yeti3DProps) {
    return (
        <div className="w-full h-[350px] md:h-[450px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={45} />

                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
                <directionalLight position={[-5, 3, -5]} intensity={0.4} />
                <pointLight position={[0, 2, 0]} intensity={0.5} color="#6BA4CC" />

                {/* 3D Model */}
                <Suspense fallback={null}>
                    <YetiModel state={state} lookAt={lookAt} />
                </Suspense>
            </Canvas>
        </div>
    );
}

export default function Yeti3D({ state, lookAt }: Yeti3DProps) {
    const svgFallback = <Yeti state={state} lookAt={lookAt} size="large" />;

    return (
        <Yeti3DErrorBoundary fallback={svgFallback}>
            <Suspense fallback={svgFallback}>
                <Yeti3DCanvas state={state} lookAt={lookAt} />
            </Suspense>
        </Yeti3DErrorBoundary>
    );
}

// Preload the model
useGLTF.preload('/models/yeti-model.glb');
