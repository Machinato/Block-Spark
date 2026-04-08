"use client"

import React from 'react'
import * as THREE from 'three'
import { useLoader, useFrame } from '@react-three/fiber'
import { GLTFLoader } from 'three-stdlib'

export const Prism = React.forwardRef(({ onRayOver, onRayOut, onRayMove, ...props }, ref) => {
  const { nodes } = useLoader(GLTFLoader, '/gltf/cube.glb')
  const localRef = React.useRef(null)

  // Комбінуємо зовнішній ref і внутрішній (якщо передали)
  const groupRef = ref || localRef

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2
      groupRef.current.rotation.x += delta * 0.1
    }
  })

  return (
    <group ref={groupRef} position={[0, 1, 0.6]} {...props}>
      <mesh
        visible={false}
        scale={1.5}
        rotation={[0.6, Math.PI / 4, 0]}
        geometry={nodes.Cube.geometry}
        onRayOver={onRayOver}
        onRayOut={onRayOut}
        onRayMove={onRayMove}
      />
      <mesh
        renderOrder={1}
        scale={1.5}
        rotation={[0.6, Math.PI / 4, 0]}
        dispose={null}
        geometry={nodes.Cube.geometry}
      >
        <meshPhysicalMaterial
          // color="#000000"
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.03}
          depthWrite={false}
          clearcoat={1}
          clearcoatRoughness={0}
          roughness={0}
          metalness={0.1}
          toneMapped={false}
          envMapIntensity={1}
          transmission={1}
          thickness={8}
          ior={1.5}
        />
      </mesh>
    </group>
  )
})
