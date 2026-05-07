import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface AppNode3DProps {
  app: any;
  position: [number, number, number];
  onClick: (app: any) => void;
  isFocused: boolean;
}

export default function AppNode3D({ app, position, onClick, isFocused }: AppNode3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth transitions using useFrame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Target values
    const targetScale = hovered ? 1.1 : 1.0;
    const targetZ = isFocused ? position[2] + 5 : position[2];
    
    // Lerp scale
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    // Lerp position Z
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);

    // Floating/Idle animation (only if not focused)
    if (!isFocused) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
      groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.08;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.4;
    } else {
      // Look towards camera slightly more when focused
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], 0.1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(app);
      }}
    >
      {/* Glass Panel */}
      <mesh>
        <planeGeometry args={[2.5, 3.5]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
          transmission={0.5}
          thickness={1}
          color={hovered ? "#00ffff" : "#ffffff"}
          envMapIntensity={2}
        />
      </mesh>

      {/* Border */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1.7, 1.72, 4]} />
        <meshBasicMaterial color={hovered ? "#00ffff" : "#333333"} />
      </mesh>

      {/* App Content */}
      <group position={[0, 0, 0.1]}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh position={[0, 0.8, 0]}>
            <octahedronGeometry args={[0.4]} />
            <meshStandardMaterial 
              color={hovered ? "#00ffff" : "#0088ff"} 
              emissive={hovered ? "#00ffff" : "#0088ff"}
              emissiveIntensity={hovered ? 2 : 1}
              wireframe
            />
          </mesh>
        </Float>

        <Text
          position={[0, -0.2, 0]}
          fontSize={0.18}
          font="https://fonts.gstatic.com/s/spacegrotesk/v13/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-g.woff"
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          textAlign="center"
        >
          {app.name}
        </Text>

        <Text
          position={[0, -0.8, 0]}
          fontSize={0.08}
          color="#00ffff"
          fillOpacity={0.5}
          anchorX="center"
          anchorY="middle"
        >
          {app.developer}
        </Text>

        <Text
          position={[0, -1.2, 0]}
          fontSize={0.07}
          color="white"
          fillOpacity={0.3}
          maxWidth={2}
          textAlign="center"
        >
          {app.price}
        </Text>
      </group>

      {/* Background glow when hovered */}
      {hovered && (
        <pointLight position={[0, 0, 0.5]} intensity={1} color="#00ffff" distance={5} />
      )}
    </group>
  );
}
