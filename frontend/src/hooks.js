import { useEffect, useState } from 'react'
import gsap from 'gsap'

// Counts up to the target when a result arrives (feedback to the person's action).
// Skipped when the system asks for reduced motion.
export function useCountUp(target, duration = 0.8) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || target === 0) {
      setValue(target)
      return undefined
    }
    const state = { n: 0 }
    const tween = gsap.to(state, {
      n: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setValue(Math.round(state.n)),
      onComplete: () => setValue(target),
    })
    return () => tween.kill()
  }, [target, duration])
  return value
}

// Short staggered reveal of the marked rows inside `ref`, only when `enabled` (a result the person just asked for).
// Skipped entirely for prefers-reduced-motion. Reverted on unmount.
export function useRevealRows(ref, enabled, key) {
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return undefined
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el.querySelectorAll('[data-reveal]'), {
        opacity: 0,
        y: 6,
        duration: 0.22,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'opacity,transform',
      })
    })
    return () => mm.revert()
  }, [ref, enabled, key])
}
