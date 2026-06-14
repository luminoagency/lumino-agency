'use client'

import { useState, useEffect } from 'react'

export interface DeviceCapability {
  canUseThreeJs: boolean
  canUseHeavyAnimations: boolean
  prefersReducedMotion: boolean
  isLoaded: boolean
}

export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    canUseThreeJs: false,
    canUseHeavyAnimations: false,
    prefersReducedMotion: false,
    isLoaded: false,
  })

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isLowEnd = cores <= 4 || memory <= 2

    setCapability({
      canUseThreeJs:         !isLowEnd && !reducedMotion,
      canUseHeavyAnimations: !reducedMotion,
      prefersReducedMotion:  reducedMotion,
      isLoaded:              true,
    })
  }, [])

  return capability
}
