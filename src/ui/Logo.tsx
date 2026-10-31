import type { CSSProperties } from 'react'
import fgLogo from '@/assets/fg_group.webp'
import { cx } from '@/lib/cx'
import styles from './Logo.module.css'

export interface LogoProps {
  /** `mark` renders only the icon. */
  variant?: 'full' | 'mark'
  height?: number
  className?: string
  title?: string
}

/** The FG Group mark: the corporate diamond logo, plus the wordmark. */
export function Logo({ variant = 'full', height = 28, className, title = 'FG Group' }: LogoProps) {
  return (
    <span
      className={cx(styles.logo, className)}
      style={{ '--logo-h': `${height}px` } as CSSProperties}
      role="img"
      aria-label={title}
    >
      <img className={styles.mark} src={fgLogo} alt="" width={height} height={height} draggable={false} />
      {variant === 'full' ? (
        <span className={styles.word} aria-hidden="true">
          FG Group
        </span>
      ) : null}
    </span>
  )
}
