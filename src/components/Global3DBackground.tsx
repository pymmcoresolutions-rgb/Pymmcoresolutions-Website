import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera, Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AppNode3D from './AppNode3D';

function DataCore() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <group>
        <mesh>
          <dodecahedronGeometry args={[3, 0]} />
          <MeshDistortMaterial
            color="#06b6d4"
            speed={4}
            distort={0.3}
            radius={1}
            metalness={0.9}
            roughness={0.1}
            emissive="#0891b2"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[5, 0.02, 16, 100]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[5.5, 0.015, 16, 100]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} />
        </mesh>
        <pointLight intensity={2} color="#00ffff" distance={10} />
      </group>
    </Float>
  );
}

function MatrixBackground() {
  const count = 1000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#00ffff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function GridBackground() {
  return (
    <gridHelper args={[100, 50, "#00ffff", "#111111"]} position={[0, -5, 0]} />
  );
}

export default function Global3DBackground({ 
  onSelectApp, 
  selectedAppId 
}: { 
  onSelectApp?: (app: any) => void;
  selectedAppId?: string | null;
}) {
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const nodePositions = useMemo(() => {
    return apps.map((_, i) => {
      const radius = 8 + Math.floor(i / 8) * 4;
      const angle = (i % 8) * (Math.PI * 2 / 8);
      return [
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 8,
        Math.sin(angle) * radius
      ] as [number, number, number];
    });
  }, [apps.length]);

  const isInteractive = !!onSelectApp;

  return (
    <div className={`fixed inset-0 z-[-1] ${isInteractive ? '' : 'pointer-events-none'}`}>
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <color attach="background" args={["#030303"]} />
        <fog attach="fog" args={["#030303", 10, 40]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        
        <MatrixBackground />
        <GridBackground />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          <DataCore />
          <group>
            {apps.map((app, i) => (
              <AppNode3D
                key={app.id}
                app={app}
                position={nodePositions[i]}
                onClick={onSelectApp || (() => {})}
                isFocused={selectedAppId === app.id}
              />
            ))}
          </group>
          <Environment preset="city" />
        </Suspense>

        <OrbitControls 
          enablePan={false} 
          enableZoom={isInteractive} 
          autoRotate={!selectedAppId}
          autoRotateSpeed={0.3}
          makeDefault 
        />
      </Canvas>
    </div>
  );
}
