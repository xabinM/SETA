import {Link} from 'react-router-dom'
import logoSrc from '@/assets/seta.png'

type Size = 'xs' | 'sm' | 'md' | 'lg'
type Variant = 'mark' | 'lockup'

type Props = {
    to?: string
    variant?: Variant
    size?: Size
    srLabel?: string
    brandText?: string
    className?: string
}

const S: Record<Size, { wrapper: string; img: string; text: string; gap: string }> = {
    xs: {wrapper: 'w-[100px] h-[100px]', img: 'w-[80px] h-[87px]', text: 'text-base', gap: 'gap-2'},
    sm: {wrapper: 'w-[200px] h-[200px]', img: 'w-[160px] h-[174px]', text: 'text-lg', gap: 'gap-2.5'},
    md: {wrapper: 'w-[300px] h-[300px]', img: 'w-[240px] h-[261px]', text: 'text-xl', gap: 'gap-3'},
    lg: {wrapper: 'w-[500px] h-[500px]', img: 'w-[400px] h-[435px]', text: 'text-2xl', gap: 'gap-4'},
}

export default function Logo({
                                 to = '/',
                                 variant = 'mark',
                                 size = 'sm',
                                 srLabel = 'AICE',
                                 brandText = 'AICE',
                                 className = '',
                             }: Props) {
    const s = S[size]

    const content = (
        <span
            className={`flex justify-center items-center ${s.wrapper} rounded-full`}
            style={{
                background: 'linear-gradient(45deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
                boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1)',
            }}
        >
      <img
          src={logoSrc}
          alt=""
          className={`${s.img} object-contain select-none`}
          draggable={false}
      />
            {variant === 'lockup' && (
                <span
                    className={`${s.text} font-semibold tracking-tight text-gray-900 dark:text-white`}
                    aria-hidden="true"
                >
          {brandText}
        </span>
            )}
            <span className="sr-only">{srLabel}</span>
    </span>
    )

    return (
        <Link to={to} className={`inline-flex items-center ${className}`} aria-label={srLabel}>
            {content}
        </Link>
    )
}
