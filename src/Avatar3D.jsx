import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges, ContactShadows } from "@react-three/drei";

const AC = "#F0FF00", BODY = "#242424";

const CAP = 20;
const norm = (v) => Math.min(v, CAP) / CAP;

function Box({ args, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.35} />
      <Edges color={AC} threshold={20} />
    </mesh>
  );
}

function Ball({ radius, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <sphereGeometry args={[radius, 28, 28]} />
      <meshStandardMaterial color={BODY} roughness={0.4} metalness={0.3} />
      <Edges color={AC} threshold={30} />
    </mesh>
  );
}

function Limb({ radius, length, position }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <capsuleGeometry args={[radius, length, 8, 24]} />
      <meshStandardMaterial color={BODY} roughness={0.45} metalness={0.35} />
      <Edges color={AC} threshold={30} />
    </mesh>
  );
}

function Figure({ stats }) {
  const chestG = norm(stats.chest), backG = norm(stats.back), shoulderG = norm(stats.shoulders),
        armG = norm(stats.arms), legG = norm(stats.legs), coreG = norm(stats.core);

  const torsoW = 1.1 * (1 + 0.45 * ((chestG + backG) / 2));
  const shoulderR = 0.42 * (1 + 0.5 * shoulderG);
  const armR = 0.22 * (1 + 0.6 * armG);
  const legR = 0.32 * (1 + 0.55 * legG);
  const shoulderX = torsoW / 2 + 0.15;

  return (
    <group position={[0, -1.2, 0]}>
      <Ball radius={0.42} position={[0, 3.4, 0]} />
      <Box args={[0.3, 0.25, 0.3]} position={[0, 2.95, 0]} />
      <Box args={[torsoW, 1.7, 0.65]} position={[0, 2.1, 0]} />

      {coreG > 0.1 && (
        <mesh position={[0, 1.85, 0.34]}>
          <boxGeometry args={[torsoW * 0.7, 0.9, 0.02]} />
          <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.15 + coreG * 0.4} transparent opacity={0.25 + coreG * 0.5} />
        </mesh>
      )}

      <Ball radius={shoulderR} position={[-shoulderX, 2.85, 0]} />
      <Ball radius={shoulderR} position={[shoulderX, 2.85, 0]} />

      <Limb radius={armR} length={1.1} position={[-shoulderX, 1.9, 0]} />
      <Limb radius={armR} length={1.1} position={[shoulderX, 1.9, 0]} />

      <Box args={[torsoW * 0.85, 0.5, 0.6]} position={[0, 1.05, 0]} />

      <Limb radius={legR} length={1.7} position={[-0.28, 0, 0]} />
      <Limb radius={legR} length={1.7} position={[0.28, 0, 0]} />
    </group>
  );
}

export default function Avatar3D({ stats }) {
  return (
    <div style={{ width: "100%", height: 380, background: "#050505", borderRadius: 8, overflow: "hidden", touchAction: "none" }}>
      <Canvas shadows camera={{ position: [0, 0.5, 11.3], fov: 35 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
        <directionalLight position={[-3, 3, -2]} intensity={0.6} />
        <pointLight position={[-4, 2, -3]} intensity={0.8} color={AC} />
        <Figure stats={stats} />
        <ContactShadows position={[0, -2.35, 0]} opacity={0.5} scale={8} blur={2.2} far={2} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} autoRotate autoRotateSpeed={2.4} target={[0, 0.15, 0]} />
      </Canvas>
    </div>
  );
}
