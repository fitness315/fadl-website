import { Canvas } from "@react-three/fiber";
import { OrbitControls, RoundedBox, ContactShadows } from "@react-three/drei";

const AC = "#F0FF00", GEAR = "#333333";

const CAP = 20;
const norm = (v) => Math.min(v, CAP) / CAP;

function Skin({ children, position, scale, rotation, color }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      {children}
      <meshPhysicalMaterial color={color} roughness={0.4} metalness={0.08} clearcoat={0.25} clearcoatRoughness={0.35} />
    </mesh>
  );
}

function Ball({ radius, position, scale, color }) {
  return <Skin position={position} scale={scale} color={color}><sphereGeometry args={[radius, 24, 24]} /></Skin>;
}

function Limb({ radius, length, position, color }) {
  return <Skin position={position} color={color}><capsuleGeometry args={[radius, length, 8, 20]} /></Skin>;
}

function SoftBox({ args, position, radius = 0.15, color = GEAR, rotation }) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={5} position={position} rotation={rotation} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.4} metalness={0.15} clearcoat={0.3} clearcoatRoughness={0.3} />
    </RoundedBox>
  );
}

function AccentBand({ radius, tube, position, rotation, color = AC }) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, tube, 10, 28]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
    </mesh>
  );
}

function Wheelchair({ torsoW }) {
  // Seat sits just under the hips (hips are at local y=1.05); wheels span
  // from just under the seat down to the ground (group's local y=-1.15)
  // so nothing floats disconnected from the body.
  const seatY = 0.78;
  const groundY = -1.15;
  const wheelR = (seatY - groundY) / 2 - 0.05;
  const wheelY = (seatY + groundY) / 2;
  const wheelX = torsoW / 2 + wheelR * 0.55;

  return (
    <group>
      <SoftBox args={[0.82, 0.16, 0.8]} position={[0, seatY, 0.05]} radius={0.08} color="#3a3a3a" />
      <SoftBox args={[0.78, 0.9, 0.16]} position={[0, seatY + 0.55, -0.36]} rotation={[-0.18, 0, 0]} radius={0.1} color="#3a3a3a" />
      <SoftBox args={[0.6, 0.05, 0.28]} position={[0, groundY + 0.55, 0.52]} radius={0.03} color="#3a3a3a" />

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * wheelX, wheelY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[wheelR, 0.05, 10, 28]} />
            <meshPhysicalMaterial color="#3a3a3a" roughness={0.4} metalness={0.4} clearcoat={0.3} />
          </mesh>
          <mesh position={[side * wheelX, wheelY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[wheelR * 0.8, 0.03, 8, 24]} />
            <meshStandardMaterial color={AC} emissive={AC} emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[side * wheelX, wheelY, 0]} rotation={[0, Math.PI / 2, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshPhysicalMaterial color="#3a3a3a" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[side * (torsoW / 2 + 0.1), groundY + 0.22, 0.5]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.14, 0.03, 8, 16]} />
            <meshPhysicalMaterial color="#3a3a3a" roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Legs({ legR, skinTone }) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Limb radius={legR} length={0.85} position={[side * 0.27, 0.32, 0]} color={skinTone} />
          <Limb radius={legR * 0.78} length={0.75} position={[side * 0.27, -0.58, 0]} color={skinTone} />
          <SoftBox args={[0.32, 0.14, 0.52]} position={[side * 0.27, -1.06, 0.1]} radius={0.06} />
        </group>
      ))}
    </>
  );
}

function Figure({ stats, skinTone, bodyType }) {
  const chestG = norm(stats.chest), backG = norm(stats.back), shoulderG = norm(stats.shoulders),
        armG = norm(stats.arms), legG = norm(stats.legs), coreG = norm(stats.core);

  const torsoW = 1.05 * (1 + 0.4 * ((chestG + backG) / 2));
  const shoulderR = 0.4 * (1 + 0.5 * shoulderG);
  const armR = 0.2 * (1 + 0.6 * armG);
  const legR = 0.3 * (1 + 0.55 * legG);
  const shoulderX = torsoW / 2 + 0.15;
  const pecR = 0.22 * (1 + 0.7 * chestG);

  const abRows = [1.9, 1.68, 1.46];
  const seated = bodyType === "wheelchair";

  return (
    <group position={[0, -1.15, 0]}>
      {/* head + neck */}
      <Ball radius={0.4} position={[0, 3.4, 0]} color={skinTone} />
      <Skin position={[0, 2.95, 0]} color={skinTone}><cylinderGeometry args={[0.16, 0.19, 0.3, 16]} /></Skin>

      {/* torso */}
      <SoftBox args={[torsoW, 1.55, 0.6]} position={[0, 2.12, 0]} radius={0.2} color={skinTone} />

      {/* pecs */}
      <Ball radius={pecR} position={[-torsoW * 0.24, 2.5, 0.32]} scale={[1, 0.85, 0.6]} color={skinTone} />
      <Ball radius={pecR} position={[torsoW * 0.24, 2.5, 0.32]} scale={[1, 0.85, 0.6]} color={skinTone} />

      {/* abs */}
      {coreG > 0.05 && abRows.map((y, i) => (
        [-1, 1].map((side) => (
          <SoftBox
            key={`${i}-${side}`}
            args={[0.22 * (1 + coreG * 0.25), 0.16, 0.1]}
            position={[side * torsoW * 0.16, y, 0.32]}
            radius={0.045}
            color={skinTone}
          />
        ))
      ))}

      {/* shoulders */}
      <Ball radius={shoulderR} position={[-shoulderX, 2.82, 0]} color={skinTone} />
      <Ball radius={shoulderR} position={[shoulderX, 2.82, 0]} color={skinTone} />

      {/* arms: bicep + forearm, two sides */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Limb radius={armR} length={0.62} position={[side * shoulderX, 2.18, 0]} color={skinTone} />
          <Limb radius={armR * 0.82} length={0.58} position={[side * shoulderX, 1.58, 0]} color={skinTone} />
          <AccentBand radius={armR * 0.86} tube={0.03} position={[side * shoulderX, 1.28, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}

      {/* waist belt */}
      <AccentBand radius={torsoW * 0.46} tube={0.04} position={[0, 1.32, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* hips */}
      <SoftBox args={[torsoW * 0.82, 0.48, 0.56]} position={[0, 1.05, 0]} radius={0.16} />

      {seated ? <Wheelchair torsoW={torsoW} /> : <Legs legR={legR} skinTone={skinTone} />}
    </group>
  );
}

export default function Avatar3D({ stats, skinTone, bodyType }) {
  return (
    <div style={{ width: "100%", height: 380, background: "#050505", borderRadius: 8, overflow: "hidden", touchAction: "none" }}>
      <Canvas shadows camera={{ position: [0, 0.5, 11.3], fov: 35 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
        <directionalLight position={[-3, 3, -2]} intensity={0.6} />
        <pointLight position={[-4, 2, -3]} intensity={0.8} color={AC} />
        <Figure stats={stats} skinTone={skinTone} bodyType={bodyType} />
        <ContactShadows position={[0, -2.3, 0]} opacity={0.5} scale={8} blur={2.2} far={2} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={16} autoRotate autoRotateSpeed={2.4} target={[0, 0.15, 0]} />
      </Canvas>
    </div>
  );
}
