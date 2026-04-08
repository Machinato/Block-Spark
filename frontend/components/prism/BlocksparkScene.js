"use client"

import * as THREE from 'three'
import { Suspense, useRef, useCallback, useEffect, useState } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, LUT } from '@react-three/postprocessing'
import { LUTCubeLoader } from 'postprocessing'
import { Beam } from './Beam'
import { Rainbow } from './Rainbow'
import { Prism } from './Prism'
import { Flare } from './Flare'
import { Box } from './Box'
import { lerp, lerpV3 } from '@/lib/prismUtil'
import { Center, Text3D, Html } from '@react-three/drei'

// LUT завантажується всередині Canvas через Suspense
function Effects({ lutPath }) {
    const texture = useLoader(LUTCubeLoader, lutPath)
    return (
        <EffectComposer disableNormalPass>
            <Bloom mipmapBlur levels={9} intensity={1.5} luminanceThreshold={1} luminanceSmoothing={1} />
            <LUT lut={texture} />
        </EffectComposer>
    )
}

function SceneCore({ lighting }) {
    const flare = useRef(null)
    const ambient = useRef(null)
    const spot = useRef(null)
    const boxreflect = useRef(null)
    const rainbow = useRef(null)
    const blocker = useRef(null)
    const isPrismHitRef = useRef(false)
    const [isPrismHit, setIsPrismHit] = useState(false)
    const targetAngle = useRef(0)
    const flash = useRef(0)
    const prismRef = useRef(null)

    const rayStartRef = useRef(new THREE.Vector3())
    const rayEndRef = useRef(new THREE.Vector3(0, -0.5, 0))
    const scrollY = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            scrollY.current = window.scrollY
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const rayOut = useCallback(() => {
        if (isPrismHitRef.current) {
            isPrismHitRef.current = false
            setIsPrismHit(false)
        }
    }, [])

    const rayOver = useCallback((e) => {
        e.stopPropagation()
        if (!isPrismHitRef.current) {
            flash.current = 1
        }
        isPrismHitRef.current = true
        setIsPrismHit(true)
        rainbow.current.material.speed = 1
        rainbow.current.material.emissiveIntensity = 20
    }, [])

    const rayMove = useCallback(({ position, direction, normal }) => {
        if (!normal) return
        flare.current.position.set(position.x, position.y, -0.5)
        flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y))
        const incomingAngle = Math.atan2(direction.y, direction.x)
        targetAngle.current = incomingAngle + 0.2
        lerpV3(spot.current.target.position, [Math.cos(targetAngle.current), Math.sin(targetAngle.current), 0], 0.05)
        spot.current.target.updateMatrixWorld()
    }, [])

    const dirLight = useRef(null)

    useFrame((state) => {
        const vpW = state.viewport.width
        const vpH = state.viewport.height
        const startX = -vpW / 2 - 1
        const startY = vpH * 0.15
        const endX = 0
        const endY = -0.5

        rayStartRef.current.set(startX, startY, 0)
        rayEndRef.current.set(endX, endY, 0)
        boxreflect.current.setRay([startX, startY, 0], [endX, endY, 0])

        const dir = new THREE.Vector3().subVectors(rayEndRef.current, rayStartRef.current).normalize()
        const angle = Math.atan2(dir.y, dir.x)

        if (blocker.current) {
            const dist = 1.0 + scrollY.current * 0.015
            blocker.current.position.set(startX + dir.x * dist, startY + dir.y * dist, 0)
            blocker.current.rotation.set(0, 0, angle + Math.PI / 2)
        }

        if (dirLight.current) {
            lerp(dirLight.current, 'intensity', isPrismHitRef.current ? 10.0 : 1, 0.05)
        }

        flash.current = THREE.MathUtils.lerp(flash.current, 0, 0.1)
        const baseIntensity = isPrismHitRef.current ? 2.5 : 0
        lerp(rainbow.current.material, 'emissiveIntensity', baseIntensity + flash.current * 15, 0.1)
        spot.current.intensity = rainbow.current.material.emissiveIntensity

        const currentFlareScale = isPrismHitRef.current ? 1.25 + flash.current * 2 : 0
        lerpV3(flare.current.scale, [currentFlareScale, currentFlareScale, currentFlareScale], 0.1)

        rainbow.current.rotation.z = THREE.MathUtils.lerp(rainbow.current.rotation.z, targetAngle.current, 0.1)
        rainbow.current.position.set(0, -0.5, 0)
        lerp(ambient.current, 'intensity', 0, 0.025)
    })

    const renderLighting = () => {
        if (lighting === 'neon') {
            return (
                <Environment resolution={256}>
                    <Lightformer form="ring" intensity={5} position={[0, 0, 10]} scale={[5, 1, 1]} />
                    <Lightformer form="circle" intensity={3} position={[-10, 5, -5]} rotation-y={Math.PI / 2} scale={[5, 5, 1]} />
                </Environment>
            )
        }
        if (lighting === 'studio') {
            return (
                <Environment resolution={256}>
                    <Lightformer form="rect" intensity={2} position={[0, 10, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
                    <Lightformer form="rect" intensity={3} position={[-10, 0, 5]} rotation-y={-Math.PI / 4} scale={[20, 2, 1]} />
                    <Lightformer form="rect" intensity={3} position={[10, 0, 5]} rotation-y={Math.PI / 4} scale={[20, 2, 1]} />
                </Environment>
            )
        }
        return (
            <Environment resolution={256}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                    <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                    <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, -5, -9]} scale={[10, 10, 1]} />
                    <Lightformer intensity={1} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 10, 1]} />
                    <Lightformer form="rect" intensity={1} position={[0, 10, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
                    <Lightformer form="rect" intensity={1} position={[-10, 0, 5]} rotation-y={-Math.PI / 4} scale={[20, 2, 1]} />
                    <Lightformer form="rect" intensity={1} position={[10, 0, 5]} rotation-y={Math.PI / 4} scale={[20, 2, 1]} />
                </group>
            </Environment>
        )
    }

    return (
        <>
            {renderLighting()}
            <ambientLight ref={ambient} intensity={0.1} />
            <directionalLight ref={dirLight} position={[0, 10, 5]} intensity={1} color="#ffffffff" />
            <pointLight position={[10, -10, 0]} intensity={0.5} />
            <pointLight position={[0, 10, 0]} intensity={0.5} />
            <pointLight position={[-10, 0, 0]} intensity={0.5} />
            <spotLight ref={spot} intensity={10} distance={7} angle={1} penumbra={1} position={[0, 0, 1]} />

            {/* <Center position={[0, 4, 0]}>
                <Text3D size={1} letterSpacing={-0.05} height={0.05} font="/fonts/Inter_Bold_3.json" renderOrder={2}>
                    BlockSpark
                    <meshStandardMaterial
                        color="white"
                        emissive="white"
                        emissiveIntensity={0}
                        toneMapped={false}
                    />
                </Text3D>
            </Center> */}

            <Html
                center
                position={[0, 4, 0]}
                style={{
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.05em',
                    whiteSpace: 'nowrap',
                    textShadow: isPrismHit ? '0 0 30px white' : 'none',
                    transition: 'text-shadow 0.3s ease'
                }}
            >
                BlockSpark
            </Html>

            <Beam ref={boxreflect} bounce={10} far={20}>
                <Prism ref={prismRef} position={[0, -0.5, 0]} onRayOver={rayOver} onRayOut={rayOut} onRayMove={rayMove} />
                <Box ref={blocker} />
            </Beam>
            <Rainbow ref={rainbow} startRadius={0} endRadius={0.5} fade={0} />
            <Flare ref={flare} visible={isPrismHit} renderOrder={10} scale={1.25} streak={[12.5, 20, 1]} />
        </>
    )
}

export default function BlocksparkScene({ style, className = '', lutPath = '/lut/F-6800-STD.cube', lighting = 'default' }) {
    return (
        <div style={{ width: '100%', height: '100%', ...style }} className={className}>
            <Canvas orthographic gl={{ antialias: false }} camera={{ position: [0, 0, 100], zoom: 45 }}>
                <color attach="background" args={['black']} />
                {/* Suspense — чекає поки завантажаться всі ресурси */}
                <Suspense fallback={null}>
                    <SceneCore lighting={lighting} />
                    <Effects lutPath={lutPath} />
                </Suspense>
            </Canvas>
        </div>
    )
}