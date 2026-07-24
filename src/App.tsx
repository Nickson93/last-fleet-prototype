import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg0: '#0b0f18',
  bg1: '#111827',
  bg2: '#182030',
  bg3: '#1f2a3d',
  border0: '#1e2838',
  border1: '#2d3d52',
  border2: '#4a5f78',
  muted: '#3a4f68',
  dim: '#5a7090',
  mid: '#8aa0be',
  bright: '#c8d8ec',
  hi: '#e8edf6',
  white: '#f2f6ff',
  accent: '#c8d8ec',
  // Semantic
  hpFill: '#7a9ab8',
  energyFill: '#a0b890',
  warnFill: '#9a7050',
  salvage: '#8aa0be',
  cache: '#90b098',
}

const FONT_HEAD = '"Barlow Condensed", "Arial Narrow", sans-serif'
const FONT_MONO = '"DM Mono", "Courier New", monospace'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | 'boot' | 'menu' | 'settlement' | 'construct' | 'boat-info'
  | 'captains' | 'captain-detail' | 'squad-prep' | 'world-map'
  | 'encounter' | 'combat' | 'victory' | 'defeat' | 'quests' | 'settings'

// ─── Safe-area helpers ────────────────────────────────────────────────────────
const safeTop: React.CSSProperties = { paddingTop: 'env(safe-area-inset-top, 0px)' }
const safeBottom: React.CSSProperties = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' }
const safeSides: React.CSSProperties = {
  paddingLeft: 'env(safe-area-inset-left, 0px)',
  paddingRight: 'env(safe-area-inset-right, 0px)',
}

// ─── Panel ─────────────────────────────────────────────────────────────────────
function Panel({
  children, className = '', style, accent = false, title, onClick,
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  accent?: boolean
  title?: string
  onClick?: () => void
}) {
  const cCol = accent ? C.border2 : C.border1
  const sz = 10
  const Corner = ({ r, b }: { r?: boolean; b?: boolean }) => (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} className="absolute"
      style={{ top: b ? 'auto' : 0, bottom: b ? 0 : 'auto', left: r ? 'auto' : 0, right: r ? 0 : 'auto', transform: `scale(${r ? -1 : 1}, ${b ? -1 : 1})` }}>
      <polyline points={`0,${sz} 0,0 ${sz},0`} fill="none" stroke={cCol} strokeWidth="1.5" />
    </svg>
  )
  return (
    <div className={`relative ${className}`}
      style={{ border: `1px solid ${C.border1}`, background: C.bg1, ...style }}
      onClick={onClick}>
      <Corner /><Corner r /><Corner b /><Corner r b />
      {title && (
        <div className="px-3 py-1.5 border-b flex items-center gap-2" style={{ borderColor: C.border0 }}>
          <div className="w-1 h-3" style={{ background: C.border2 }} />
          <span style={{ fontFamily: FONT_HEAD, fontSize: 12, letterSpacing: '0.15em', color: C.dim, textTransform: 'uppercase' }}>{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Button — #1 min 44px touch targets ──────────────────────────────────────
function Btn({
  children, onClick, className = '', disabled = false, variant = 'default', size = 'md', style,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'default' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  style?: React.CSSProperties
}) {
  const pad = size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-5 py-3' : 'px-3 py-2.5'
  const base: React.CSSProperties = {
    fontFamily: FONT_HEAD,
    fontSize: size === 'sm' ? 11 : size === 'lg' ? 14 : 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.35 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: 'opacity 0.1s, background 0.1s',
    userSelect: 'none', border: '1px solid',
    minHeight: size === 'lg' ? 48 : size === 'md' ? 44 : 36,
    ...style,
  }
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: C.bright, borderColor: C.bright, color: C.bg0 },
    default: { ...base, background: C.bg3, borderColor: C.border2, color: C.bright },
    ghost:   { ...base, background: 'transparent', borderColor: C.border1, color: C.dim },
    danger:  { ...base, background: C.bg3, borderColor: '#7a4a3a', color: '#c8a090' },
  }
  return (
    <div className={`${pad} ${className} select-none`} style={styles[variant]}
      onClick={disabled ? undefined : onClick}>{children}</div>
  )
}

// ─── Label — #2 min font size 11px ───────────────────────────────────────────
function Lbl({ children, className = '', style, size = 11 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; size?: number
}) {
  return (
    <span className={className}
      style={{ fontFamily: FONT_MONO, fontSize: Math.max(11, size), color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', ...style }}>
      {children}
    </span>
  )
}

function Head({ children, size = 14, style }: { children: React.ReactNode; size?: number; style?: React.CSSProperties }) {
  return (
    <span style={{ fontFamily: FONT_HEAD, fontSize: size, fontWeight: 600, letterSpacing: '0.1em', color: C.hi, textTransform: 'uppercase', ...style }}>
      {children}
    </span>
  )
}

// ─── Bar — #19 HP vs energy use distinct colours ──────────────────────────────
function Bar({ value, max = 100, className = '', color = C.hpFill, style }: {
  value: number; max?: number; className?: string; color?: string; style?: React.CSSProperties
}) {
  return (
    <div className={`overflow-hidden ${className}`}
      style={{ height: 5, background: C.bg3, border: `1px solid ${C.border1}`, ...style }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color }} />
    </div>
  )
}

function Img({ label = '', className = '', style }: { label?: string; className?: string; style?: React.CSSProperties }) {
  const id = label.replace(/\s+/g, '-')
  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: C.bg3, border: `1px solid ${C.border1}`, ...style }}>
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id={`h-${id}`} patternUnits="userSpaceOnUse" width="10" height="10">
            <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke={C.mid} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#h-${id})`} />
      </svg>
      {label && (
        <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', position: 'relative', zIndex: 1, background: C.bg3, padding: '1px 3px' }}>{label}</span>
      )}
    </div>
  )
}

// ─── Touch slider — #28 ───────────────────────────────────────────────────────
function TouchSlider({ value, min = 0, max = 100, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pct = ((value - min) / (max - min)) * 100

  const calc = (e: React.PointerEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onChange(Math.round(min + x * (max - min)))
  }

  return (
    <div ref={trackRef}
      style={{ height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none', userSelect: 'none', position: 'relative' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); calc(e) }}
      onPointerMove={(e) => { if (e.buttons > 0) calc(e) }}>
      <div style={{ width: '100%', height: 4, background: C.bg3, border: `1px solid ${C.border1}`, position: 'relative' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: C.mid }} />
      </div>
      <div style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', width: 18, height: 18, background: C.bright, border: `2px solid ${C.border2}`, pointerEvents: 'none' }} />
    </div>
  )
}

// ─── Confirm dialog — #8 ─────────────────────────────────────────────────────
function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, dangerous = false }: {
  title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; dangerous?: boolean
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(6,13,22,0.88)' }}>
      <Panel accent className="p-5 flex flex-col gap-3" style={{ maxWidth: 320, width: '90%' }}>
        <Head size={15}>{title}</Head>
        <Lbl style={{ color: C.mid, lineHeight: 1.7, textTransform: 'none', letterSpacing: '0.04em' }}>{body}</Lbl>
        <div className="flex gap-2 mt-1">
          <Btn variant="ghost" size="md" className="flex-1" onClick={onCancel}>CANCEL</Btn>
          <Btn variant={dangerous ? 'danger' : 'primary'} size="md" className="flex-1" onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </Panel>
    </div>
  )
}

// ─── Resource bar — #10 safe-area, #20 capacity, #30 next unlock ─────────────
function ResourceBar({ onProfile }: { onProfile: () => void }) {
  const resources = [
    { icon: '◈', label: 'FOOD',    val: 74,  max: 100, warn: 20 },
    { icon: '◇', label: 'WATER',   val: 51,  max: 100, warn: 20 },
    { icon: '◆', label: 'FUEL',    val: 38,  max: 100, warn: 25 },
    { icon: '✦', label: 'SALVAGE', val: 247, max: 500, warn: 50 },
  ]
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5"
      style={{ background: C.bg0, borderBottom: `1px solid ${C.border0}`, ...safeTop, ...safeSides }}>
      {resources.map((r) => {
        const low = r.val / r.max < r.warn / r.max
        return (
          <div key={r.label} className="flex items-center gap-1.5 flex-1">
            <div className="flex flex-col items-center justify-center shrink-0"
              style={{ width: 30, height: 30, border: `1px solid ${low ? C.warnFill : C.border1}`, background: C.bg2 }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: low ? C.warnFill : C.mid, lineHeight: 1 }}>{r.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <Lbl style={{ color: C.muted, fontSize: 9 }}>{r.label}</Lbl>
              {/* #20 capacity context */}
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: low ? C.warnFill : C.bright, lineHeight: 1.2 }}>
                {r.val}<span style={{ fontSize: 9, color: C.muted }}>/{r.max}</span>
              </div>
            </div>
            <div className="w-px h-5 shrink-0" style={{ background: C.border0 }} />
          </div>
        )
      })}
      <div className="flex items-center gap-2 ml-1 cursor-pointer" onClick={onProfile}>
        <Img label="AVT" style={{ width: 30, height: 30, borderRadius: 2 }} />
        <div>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.bright, letterSpacing: '0.1em' }}>CMDR VOSS</div>
          <Lbl style={{ color: C.muted, fontSize: 9 }}>LV.12</Lbl>
          {/* #30 next unlock hint */}
          <Lbl style={{ color: C.border2, fontSize: 9, display: 'block' }}>LV.13: IRON FRIGATE</Lbl>
        </div>
      </div>
    </div>
  )
}

function ScreenHeader({ title, onBack, backLabel = 'BACK', right }: {
  title: string; onBack?: () => void; backLabel?: string; right?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 shrink-0"
      style={{ background: C.bg0, borderBottom: `1px solid ${C.border0}`, ...safeTop, ...safeSides, minHeight: 48 }}>
      {onBack && <Btn size="sm" onClick={onBack}>← {backLabel}</Btn>}
      <div className="w-px h-4" style={{ background: C.border1 }} />
      <Head size={14}>{title}</Head>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}

// ─── Bottom nav — #9 active state, #11 badges, #1 touch targets ──────────────
function BottomNav({ activeScreen, onConstruct, onCaptains, onMap, onQuests, badges = {} }: {
  activeScreen: Screen
  onConstruct: () => void; onCaptains: () => void; onMap: () => void; onQuests: () => void
  badges?: Partial<Record<string, number>>
}) {
  const items = [
    { icon: '⬡', label: 'BUILD',  action: onConstruct, screens: ['construct', 'boat-info'] as Screen[], key: 'BUILD' },
    { icon: '◉', label: 'CREW',   action: onCaptains,  screens: ['captains', 'captain-detail', 'squad-prep'] as Screen[], key: 'CREW' },
    { icon: '⊕', label: 'MAP',    action: onMap,       screens: ['world-map', 'encounter', 'combat', 'victory', 'defeat'] as Screen[], key: 'MAP' },
    { icon: '▦', label: 'QUESTS', action: onQuests,    screens: ['quests'] as Screen[], key: 'QUESTS' },
  ]
  return (
    <div className="flex shrink-0"
      style={{ borderTop: `1px solid ${C.border0}`, background: C.bg0, ...safeBottom, ...safeSides }}>
      {items.map((item, i) => {
        const isActive = item.screens.includes(activeScreen)
        const badge = badges[item.key] ?? 0
        return (
          <button key={item.label}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer relative"
            style={{
              background: isActive ? C.bg2 : 'transparent',
              border: 'none',
              borderRight: i < items.length - 1 ? `1px solid ${C.border0}` : 'none',
              borderTop: isActive ? `2px solid ${C.border2}` : '2px solid transparent',
              minHeight: 52,
              paddingTop: 6, paddingBottom: 6,
            }}
            onClick={item.action}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 15, color: isActive ? C.bright : C.dim }}>{item.icon}</span>
            <Lbl style={{ fontSize: 9, color: isActive ? C.mid : C.muted }}>{item.label}</Lbl>
            {badge > 0 && (
              <div style={{
                position: 'absolute', top: 6, right: '50%', transform: 'translateX(8px)',
                width: 14, height: 14, borderRadius: '50%',
                background: C.bright, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: C.bg0, fontWeight: 700 }}>{badge}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: C.muted, RARE: C.dim, EPIC: C.mid, LEGENDARY: C.bright,
}

// ─── 1. Boot — #22 tap-to-skip ───────────────────────────────────────────────
function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('INITIALIZING ENGINE')
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setTimeout(onDone, 500); return 100 }
        if (p >= 50 && !canSkip) setCanSkip(true)
        if (p === 30) setPhase('LOADING FLEET DATA')
        if (p === 60) setPhase('BUILDING OCEAN CHARTS')
        if (p === 85) setPhase('PREPARING CREW')
        return p + 1.5
      })
    }, 40)
    return () => clearInterval(t)
  }, [onDone])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8"
      style={{ background: C.bg0, cursor: canSkip ? 'pointer' : 'default', position: 'relative' }}
      onClick={() => { if (canSkip) onDone() }}>
      <Img label="STUDIO LOGO" style={{ width: 120, height: 48 }} />
      <div className="flex flex-col items-center gap-3 w-64">
        <Img label="LAST FLEET — LOGO" style={{ width: 220, height: 56 }} />
        <div className="w-full mt-2">
          <div className="flex justify-between mb-1">
            <Lbl style={{ color: C.muted }}>{phase}</Lbl>
            <Lbl style={{ color: C.muted }}>{Math.floor(progress)}%</Lbl>
          </div>
          <div style={{ height: 6, background: C.bg2, border: `1px solid ${C.border1}`, width: '100%' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: C.mid, transition: 'width 0.1s' }} />
          </div>
        </div>
      </div>
      {canSkip && (
        <Lbl style={{ position: 'absolute', bottom: 20, color: C.muted, letterSpacing: '0.15em' }}>TAP TO SKIP</Lbl>
      )}
      <Lbl style={{ position: 'absolute', bottom: 6, color: C.border2 }}>v0.1.0-ALPHA</Lbl>
    </div>
  )
}

// ─── 2. Main Menu ─────────────────────────────────────────────────────────────
function MenuScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [confirmNew, setConfirmNew] = useState(false)
  return (
    <div className="w-full h-full flex" style={{ background: C.bg0, position: 'relative' }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6" style={{ borderRight: `1px solid ${C.border0}` }}>
        <Img label="KEY ART — FLEET SILHOUETTE" style={{ width: '100%', height: 100 }} />
        <Img label="LAST FLEET LOGOTYPE" style={{ width: 200, height: 52 }} />
        <Lbl style={{ color: C.muted, letterSpacing: '0.25em' }}>OCEAN SURVIVAL STRATEGY</Lbl>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px" style={{ background: C.border0 }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.border2 }}>✦</span>
          <div className="flex-1 h-px" style={{ background: C.border0 }} />
        </div>
        <Lbl style={{ color: C.border2 }}>DAY 14 OF THE DROWNING AGE</Lbl>
      </div>
      <div className="w-52 flex flex-col items-stretch justify-center gap-2 p-5">
        <Btn variant="primary" size="lg" className="mb-1" onClick={() => onNav('settlement')}>▶ CONTINUE</Btn>
        <Btn size="md" onClick={() => setConfirmNew(true)}>NEW FLEET</Btn>
        <Btn size="md" disabled>LOAD SAVE</Btn>
        <Btn size="md" onClick={() => onNav('settings')}>SETTINGS</Btn>
        <Btn size="md" variant="ghost" disabled>CREDITS</Btn>
        <Panel className="mt-3 p-2">
          <Lbl style={{ display: 'block', color: C.muted, marginBottom: 4 }}>LAST SAVE</Lbl>
          <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.mid, letterSpacing: '0.1em' }}>DAY 14 · FLEET LV.12</div>
          <Lbl style={{ color: C.muted }}>IRONVEIL · 3 BOATS</Lbl>
        </Panel>
      </div>
      {confirmNew && (
        <ConfirmDialog title="START NEW FLEET?" body="Your current save will be overwritten. Day 14, Fleet Level 12 will be lost." confirmLabel="NEW FLEET" dangerous onConfirm={() => onNav('settlement')} onCancel={() => setConfirmNew(false)} />
      )}
    </div>
  )
}

// ─── 3. Settlement ────────────────────────────────────────────────────────────
function SettlementScreen({ onNav, activeScreen }: { onNav: (s: Screen) => void; activeScreen: Screen }) {
  const slots = [
    { id: 0, angleDeg: 0,   filled: true,  label: 'SCOUT',   status: 'READY' },
    { id: 1, angleDeg: 60,  filled: true,  label: 'TRAWLER', status: 'DAMAGED' },
    { id: 2, angleDeg: 120, filled: false, label: 'OPEN',    status: '' },
    { id: 3, angleDeg: 180, filled: true,  label: 'RAFT',    status: 'READY' },
    { id: 4, angleDeg: 240, filled: false, label: 'OPEN',    status: '' },
    { id: 5, angleDeg: 300, filled: false, label: 'OPEN',    status: '' },
  ]
  const cx = 100, cy = 60, ringR = 46
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ResourceBar onProfile={() => onNav('settings')} />
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(${C.mid} 1px, transparent 1px), linear-gradient(90deg, ${C.mid} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100">
          {[18, 32, 46, 60].map((r) => (
            <circle key={r} cx={50} cy={50} r={r} fill="none" stroke={C.mid} strokeWidth="0.3" strokeDasharray="2 4" />
          ))}
        </svg>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
          {slots.map((slot) => {
            const rad = (slot.angleDeg * Math.PI) / 180
            const sx = cx + ringR * Math.cos(rad)
            const sy = cy + ringR * Math.sin(rad)
            return (
              <line key={slot.id} x1={cx} y1={cy} x2={sx} y2={sy}
                stroke={slot.filled ? C.border2 : C.border0} strokeWidth="0.5"
                strokeDasharray={slot.filled ? '' : '2 3'} />
            )
          })}
          <rect x={cx - 14} y={cy - 10} width={28} height={20} fill={C.bg2} stroke={C.border2} strokeWidth="1.2" rx="1" />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 4, fill: C.mid }}>FLAGSHIP</text>
          <text x={cx} y={cy + 6} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 3, fill: C.muted }}>IRONVEIL</text>
          {slots.map((slot) => {
            const rad = (slot.angleDeg * Math.PI) / 180
            const sx = cx + ringR * Math.cos(rad)
            const sy = cy + ringR * Math.sin(rad)
            return (
              <g key={slot.id} style={{ cursor: 'pointer' }} onClick={() => onNav(slot.filled ? 'boat-info' : 'construct')}>
                {/* #1 expanded hit area */}
                <rect x={sx - 11} y={sy - 11} width={22} height={22} fill="transparent" />
                {slot.filled ? (
                  <>
                    <rect x={sx - 10} y={sy - 7} width={20} height={14} fill={C.bg2} stroke={C.border2} strokeWidth="0.8" rx="0.5" />
                    <text x={sx} y={sy - 1} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 3, fill: C.mid }}>{slot.label}</text>
                    <text x={sx} y={sy + 4} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 2.5, fill: slot.status === 'DAMAGED' ? C.warnFill : C.dim }}>{slot.status}</text>
                  </>
                ) : (
                  <>
                    <rect x={sx - 9} y={sy - 6} width={18} height={12} fill={C.bg1} stroke={C.border0} strokeWidth="0.6" strokeDasharray="2 2" />
                    <text x={sx} y={sy + 0.5} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 5, fill: C.border1 }}>+</text>
                  </>
                )}
                <rect x={sx + 8} y={sy - 9} width={6} height={5} fill={C.bg0} stroke={C.border0} strokeWidth="0.4" />
                <text x={sx + 11} y={sy - 6.5} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: FONT_MONO, fontSize: 2.8, fill: C.muted }}>S{slot.id + 1}</text>
              </g>
            )
          })}
        </svg>
        <Panel className="absolute top-2 right-2 px-2 py-1 flex items-center gap-2">
          <div className="w-1 h-4" style={{ background: C.muted }} />
          <div>
            <Lbl style={{ display: 'block', color: C.muted }}>BUILDING</Lbl>
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>04:32</div>
          </div>
        </Panel>
      </div>
      <BottomNav activeScreen={activeScreen}
        onConstruct={() => onNav('construct')} onCaptains={() => onNav('captains')}
        onMap={() => onNav('world-map')} onQuests={() => onNav('quests')}
        badges={{ BUILD: 1, CREW: 2, QUESTS: 1 }} />
    </div>
  )
}

// ─── 4. Construct — #4 sel by id, #5 BUILD→settlement, #29 lock conditions ──
function ConstructScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const boats = [
    { id: 0, name: 'SENTRY SKIFF',  type: 'COMBAT',  cost: 80,  time: '8m',  power: 220, atk: 80, def: 55, spd: 75, locked: false, unlock: '' },
    { id: 1, name: 'DEPTH TRAWLER', type: 'SUPPORT', cost: 120, time: '15m', power: 180, atk: 40, def: 70, spd: 50, locked: false, unlock: '' },
    { id: 2, name: 'SHADOW DINGHY', type: 'RECON',   cost: 60,  time: '5m',  power: 150, atk: 55, def: 35, spd: 90, locked: false, unlock: '' },
    { id: 3, name: 'IRON FRIGATE',  type: 'COMBAT',  cost: 200, time: '30m', power: 380, atk: 90, def: 80, spd: 45, locked: true,  unlock: 'FLEET LV.13' },
    { id: 4, name: 'SALVAGE BARGE', type: 'SUPPORT', cost: 90,  time: '10m', power: 160, atk: 30, def: 80, spd: 40, locked: false, unlock: '' },
    { id: 5, name: 'STORM CUTTER',  type: 'COMBAT',  cost: 150, time: '20m', power: 290, atk: 85, def: 60, spd: 80, locked: true,  unlock: 'COMPLETE: IRON FLEET QUEST' },
  ]
  const cats = ['ALL', 'COMBAT', 'SUPPORT', 'RECON']
  const [selId, setSelId] = useState(0)
  const [cat, setCat] = useState('ALL')

  const filtered = cat === 'ALL' ? boats : boats.filter(b => b.type === cat)
  // #4 — find by id, fall back to first in filtered list
  const displayBoat = filtered.find(b => b.id === selId) ?? filtered[0] ?? boats[0]
  const salvage = 247
  const canAfford = salvage >= displayBoat.cost

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="BOAT CONSTRUCTION" onBack={() => onNav('settlement')}
        right={<><Lbl style={{ color: C.muted }}>✦ SALVAGE</Lbl><span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright, marginLeft: 4 }}>{salvage}</span></>} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-44 flex flex-col" style={{ borderRight: `1px solid ${C.border0}` }}>
          <div className="flex" style={{ borderBottom: `1px solid ${C.border0}`, minHeight: 44 }}>
            {cats.map((c) => (
              <button key={c} className="flex-1 cursor-pointer border-0"
                style={{
                  fontFamily: FONT_MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: cat === c ? C.bg2 : 'transparent', color: cat === c ? C.bright : C.muted,
                  borderBottom: cat === c ? `2px solid ${C.border2}` : '2px solid transparent', minHeight: 44,
                }}
                onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-2 px-2 cursor-pointer"
                style={{
                  borderBottom: `1px solid ${C.border0}`,
                  background: displayBoat.id === b.id ? C.bg2 : 'transparent',
                  opacity: b.locked ? 0.45 : 1, minHeight: 52,
                }}
                onClick={() => setSelId(b.id)}>
                <Img label={b.type[0]} style={{ width: 30, height: 22 }} />
                <div className="min-w-0 flex-1">
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 11, color: C.bright, letterSpacing: '0.08em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{b.type}</Lbl>
                </div>
                {b.locked && <span style={{ fontSize: 10 }}>🔒</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col p-3 gap-3">
          <div className="flex gap-3">
            <Img label={displayBoat.name} style={{ width: 110, height: 74 }} />
            <div className="flex-1">
              <Head size={15}>{displayBoat.name}</Head>
              <Lbl style={{ display: 'block', marginTop: 2, marginBottom: 6, color: C.muted }}>{displayBoat.type} CLASS · TIER 1</Lbl>
              <div className="grid grid-cols-2 gap-1.5">
                {[{ k: 'POWER', v: displayBoat.power }, { k: 'BUILD TIME', v: displayBoat.time }, { k: 'SALVAGE COST', v: displayBoat.cost }, { k: 'FUEL/DAY', v: 3 }].map((s) => (
                  <Panel key={s.k} className="px-2 py-1">
                    <Lbl style={{ fontSize: 9, color: C.muted, display: 'block' }}>{s.k}</Lbl>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{s.v}</span>
                  </Panel>
                ))}
              </div>
            </div>
          </div>
          <Panel title="COMBAT PROFILE" className="p-3">
            <div className="flex flex-col gap-2 pt-1">
              {[{ k: 'ATTACK', v: displayBoat.atk }, { k: 'DEFENSE', v: displayBoat.def }, { k: 'SPEED', v: displayBoat.spd }].map((s) => (
                <div key={s.k} className="flex items-center gap-2">
                  <Lbl style={{ width: 56, fontSize: 10, color: C.muted, flexShrink: 0 }}>{s.k}</Lbl>
                  <Bar value={s.v} className="flex-1" />
                  <Lbl style={{ width: 24, textAlign: 'right', color: C.mid }}>{s.v}</Lbl>
                </div>
              ))}
            </div>
          </Panel>
          {/* #29 lock condition */}
          {displayBoat.locked && (
            <Panel className="p-2 flex items-center gap-2" style={{ borderColor: C.border0 }}>
              <span style={{ fontSize: 13 }}>🔒</span>
              <div>
                <Lbl style={{ color: C.muted, display: 'block' }}>LOCKED</Lbl>
                <Lbl style={{ color: C.dim, fontSize: 10 }}>{displayBoat.unlock}</Lbl>
              </div>
            </Panel>
          )}
          {!displayBoat.locked && !canAfford && (
            <Panel className="p-2" style={{ borderColor: C.warnFill }}>
              <Lbl style={{ color: C.warnFill }}>INSUFFICIENT SALVAGE — NEED {displayBoat.cost - salvage} MORE</Lbl>
            </Panel>
          )}
          <div className="flex gap-2 mt-auto">
            {/* #5 BUILD now routes to settlement */}
            <Btn variant="primary" size="lg" className="flex-1"
              disabled={displayBoat.locked || !canAfford}
              onClick={() => onNav('settlement')}>
              {displayBoat.locked ? '🔒 LOCKED' : !canAfford ? 'INSUFFICIENT SALVAGE' : `BUILD — ${displayBoat.time}`}
            </Btn>
            <Btn size="md" onClick={() => onNav('boat-info')}>FULL SPECS</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 5. Boat Info — #24 captain tap-through ───────────────────────────────────
function BoatInfoScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState(0)
  const tabs = ['OVERVIEW', 'UPGRADES', 'COMBAT STATS']
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="SENTRY SKIFF · LV.3" onBack={() => onNav('settlement')} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 flex flex-col gap-2 p-3" style={{ borderRight: `1px solid ${C.border0}` }}>
          <Img label="BOAT RENDER" style={{ width: '100%', height: 80 }} />
          <div className="grid grid-cols-2 gap-1">
            {[{ k: 'PWR', v: 220 }, { k: 'SPD', v: 14 }, { k: 'HP', v: 340 }, { k: 'RNG', v: 6 }].map((s) => (
              <Panel key={s.k} className="p-1 text-center">
                <Lbl style={{ display: 'block', fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{s.v}</span>
              </Panel>
            ))}
          </div>
          {/* #24 captain portrait taps through to captain-detail */}
          <Panel title="CAPTAIN" className="cursor-pointer" onClick={() => onNav('captain-detail')} style={{ borderColor: C.border2 }}>
            <div className="p-2 flex items-center gap-2">
              <Img label="CAP" style={{ width: 28, height: 28 }} />
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 11, color: C.bright, letterSpacing: '0.08em' }}>MIRA STEELE</div>
                <Lbl style={{ fontSize: 9, color: C.muted }}>SCOUT · LV.5 →</Lbl>
              </div>
            </div>
          </Panel>
          <Panel className="p-2">
            <Lbl style={{ display: 'block', fontSize: 9, color: C.muted, marginBottom: 4 }}>DURABILITY</Lbl>
            <Bar value={80} />
            <div className="flex justify-between mt-1">
              <Lbl style={{ fontSize: 9, color: C.mid }}>272 / 340 HP</Lbl>
              <Btn size="sm" style={{ padding: '2px 8px' }}>REPAIR</Btn>
            </div>
          </Panel>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex" style={{ borderBottom: `1px solid ${C.border0}`, minHeight: 44 }}>
            {tabs.map((t, i) => (
              <button key={t} className="px-4 cursor-pointer border-0"
                style={{
                  fontFamily: FONT_HEAD, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: tab === i ? C.bg2 : 'transparent', color: tab === i ? C.bright : C.muted,
                  borderBottom: tab === i ? `2px solid ${C.border2}` : '2px solid transparent',
                  borderRight: `1px solid ${C.border0}`, minHeight: 44,
                }}
                onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>
          <div className="flex-1 p-3 overflow-y-auto">
            {tab === 0 && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  {['ARMOR', 'WEAPONS', 'ENGINE'].map((sys) => (
                    <Panel key={sys} className="p-2">
                      <Lbl style={{ display: 'block', marginBottom: 4 }}>{sys}</Lbl>
                      <Bar value={65} />
                      <Lbl style={{ display: 'block', marginTop: 2, fontSize: 9, color: C.muted }}>TIER 2</Lbl>
                    </Panel>
                  ))}
                </div>
              </div>
            )}
            {tab === 1 && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'REINFORCED HULL', cost: 60, installed: true },
                  { name: 'RAPID CANNONS', cost: 80, installed: false },
                  { name: 'STEALTH COATING', cost: 100, installed: false },
                  { name: 'RADAR ARRAY', cost: 70, installed: false },
                ].map((u) => (
                  <Panel key={u.name} className="p-2" accent={u.installed}>
                    <div className="flex gap-2 mb-2">
                      <Img label="MOD" style={{ width: 32, height: 32, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: FONT_HEAD, fontSize: 11, color: C.bright, letterSpacing: '0.08em' }}>{u.name}</div>
                        <Lbl style={{ fontSize: 9, color: u.installed ? C.mid : C.muted }}>{u.installed ? '✓ INSTALLED' : `✦ ${u.cost} SALVAGE`}</Lbl>
                      </div>
                    </div>
                    {!u.installed && <Btn size="sm" className="w-full">UPGRADE</Btn>}
                  </Panel>
                ))}
              </div>
            )}
            {tab === 2 && (
              <div className="grid grid-cols-3 gap-2">
                {[{ k: 'ATTACK', v: 84 }, { k: 'DEFENSE', v: 62 }, { k: 'SPEED', v: 78 }, { k: 'RANGE', v: 55 }, { k: 'FUEL EFF.', v: 70 }, { k: 'STEALTH', v: 45 }].map((s) => (
                  <Panel key={s.k} className="p-2">
                    <Lbl style={{ display: 'block', marginBottom: 4 }}>{s.k}</Lbl>
                    <Bar value={s.v} />
                    <Lbl style={{ display: 'block', marginTop: 2, color: C.mid }}>{s.v}/100</Lbl>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Captain card ─────────────────────────────────────────────────────────────
function CaptainCard({ name, spec, lv, rarity, available, onClick }: {
  name: string; spec: string; lv: number; rarity: string; available: boolean; onClick?: () => void
}) {
  const col = RARITY_COLORS[rarity] ?? C.muted
  const locked = rarity === 'LOCKED'
  return (
    <div className="flex flex-col cursor-pointer"
      style={{ border: `1px solid ${locked ? C.border0 : col}`, background: C.bg1, opacity: locked ? 0.3 : 1, position: 'relative' }}
      onClick={locked ? undefined : onClick}>
      <div style={{ height: 2, background: col, width: '100%' }} />
      <div className="p-2">
        <Img label={locked ? '???' : 'PORTRAIT'} style={{ width: '100%', height: 52, marginBottom: 6 }} />
        {locked ? (
          <div className="text-center">
            <Lbl style={{ color: C.border1 }}>LOCKED</Lbl>
            {/* #29 unlock condition */}
            <Lbl style={{ color: C.border0, display: 'block', marginTop: 2, textTransform: 'none', letterSpacing: '0.04em' }}>EXPLORE TO UNLOCK</Lbl>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: FONT_HEAD, fontSize: 11, color: C.bright, letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div className="flex justify-between items-center mt-0.5 mb-1.5">
              <Lbl style={{ fontSize: 9, color: C.muted }}>{spec}</Lbl>
              <Lbl style={{ fontSize: 9, color: C.mid }}>LV.{lv}</Lbl>
            </div>
            <div className="flex gap-0.5">
              {[72, 55, 80].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div style={{ height: 18, width: '100%', background: C.bg3, position: 'relative', border: `1px solid ${C.border0}` }}>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${v}%`, background: C.muted }} />
                  </div>
                  <Lbl style={{ fontSize: 8, color: C.border2 }}>{['A', 'D', 'S'][i]}</Lbl>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: available ? C.mid : C.muted, border: `1px solid ${available ? C.bright : C.muted}` }} />
              <Lbl style={{ fontSize: 9, color: available ? C.mid : C.muted }}>{available ? 'AVAILABLE' : 'DEPLOYED'}</Lbl>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── 6. Captains — #12 SQUAD PREP footer ─────────────────────────────────────
function CaptainsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const captains = [
    { name: 'MIRA STEELE', spec: 'SCOUT',    lv: 5, rarity: 'RARE',      available: false },
    { name: 'BROCK DUNE',  spec: 'GUNNER',   lv: 7, rarity: 'EPIC',      available: false },
    { name: 'LEX KORAL',   spec: 'MEDIC',    lv: 3, rarity: 'COMMON',    available: true  },
    { name: 'CYRA VALE',   spec: 'ENGINEER', lv: 6, rarity: 'RARE',      available: false },
    { name: 'FINN SHORE',  spec: 'SCOUT',    lv: 2, rarity: 'COMMON',    available: true  },
    { name: '???',         spec: '???',      lv: 0, rarity: 'LOCKED',    available: false },
    { name: '???',         spec: '???',      lv: 0, rarity: 'LOCKED',    available: false },
    { name: '???',         spec: '???',      lv: 0, rarity: 'LOCKED',    available: false },
  ]
  const [filter, setFilter] = useState('ALL')
  const filters = ['ALL', 'SCOUT', 'GUNNER', 'MEDIC', 'ENGINEER']
  const visible = filter === 'ALL' ? captains : captains.filter(c => c.spec === filter)
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="CAPTAIN ROSTER" onBack={() => onNav('settlement')}
        right={<Lbl style={{ color: C.muted }}>5 / 8 RECRUITED</Lbl>} />
      <div className="flex gap-1 px-3 py-2 overflow-x-auto shrink-0"
        style={{ borderBottom: `1px solid ${C.border0}`, ...safeSides }}>
        {filters.map((f) => (
          <button key={f} className="shrink-0 cursor-pointer border-0"
            style={{
              fontFamily: FONT_HEAD, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '6px 14px', minHeight: 36,
              background: filter === f ? C.bg3 : 'transparent',
              color: filter === f ? C.bright : C.muted,
              border: `1px solid ${filter === f ? C.border2 : C.border0}`,
            }}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {visible.map((c, i) => (
            <CaptainCard key={i} {...c} onClick={() => onNav('captain-detail')} />
          ))}
        </div>
      </div>
      {/* #12 SQUAD PREP persistent footer */}
      <div className="px-3 py-2 shrink-0 flex items-center gap-3"
        style={{ borderTop: `1px solid ${C.border0}`, background: C.bg0, ...safeBottom, ...safeSides }}>
        <Lbl style={{ color: C.muted, flex: 1 }}>2 AVAILABLE · 3 DEPLOYED</Lbl>
        <Btn variant="primary" size="md" style={{ minWidth: 140 }} onClick={() => onNav('squad-prep')}>SQUAD PREP ▶</Btn>
      </div>
    </div>
  )
}

// ─── 7. Captain Detail — #26 MOR explanation ─────────────────────────────────
function CaptainDetailScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="CAPTAIN DETAIL" onBack={() => onNav('captains')} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-44 flex flex-col gap-2 p-3" style={{ borderRight: `1px solid ${C.border0}` }}>
          <div>
            <div style={{ height: 2, background: RARITY_COLORS.EPIC, marginBottom: 1 }} />
            <Img label="PORTRAIT" style={{ width: '100%', height: 96 }} />
          </div>
          <Head size={14}>BROCK DUNE</Head>
          <div className="flex items-center gap-2">
            <Lbl style={{ color: C.muted }}>GUNNER</Lbl>
            <span style={{ color: C.border1 }}>·</span>
            <Lbl style={{ color: C.mid }}>LV.7</Lbl>
            <Lbl style={{ color: RARITY_COLORS.EPIC, marginLeft: 'auto' }}>EPIC</Lbl>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Lbl style={{ fontSize: 9, color: C.muted }}>EXPERIENCE</Lbl>
              <Lbl style={{ fontSize: 9, color: C.mid }}>650/1000</Lbl>
            </div>
            <Bar value={65} />
            <Lbl style={{ fontSize: 9, color: C.border2, display: 'block', marginTop: 2 }}>LV.10: OVERCHARGE UNLOCKS</Lbl>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[{ k: 'ATK', v: 88 }, { k: 'DEF', v: 55 }, { k: 'SPD', v: 60 }, { k: 'MOR', v: 72 }].map((s) => (
              <Panel key={s.k} className="p-1 text-center">
                <Lbl style={{ display: 'block', fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.bright }}>{s.v}</span>
              </Panel>
            ))}
          </div>
          {/* #26 MOR explanation inline */}
          <Lbl style={{ fontSize: 9, color: C.border2, textTransform: 'none', letterSpacing: '0.04em', lineHeight: 1.6 }}>
            MOR (MORALE) — REDUCES ABILITY COOLDOWN RATE
          </Lbl>
          <Btn variant="primary" size="md" className="mt-auto" onClick={() => onNav('squad-prep')}>ASSIGN TO SQUAD</Btn>
        </div>
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          <Panel title="ABILITIES" className="p-2">
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { name: 'BARRAGE', cd: '8s', desc: 'Heavy multi-shot volley', unlocked: true },
                { name: 'SUPPRESSION', cd: '12s', desc: 'Reduces enemy accuracy', unlocked: true },
                { name: 'OVERCHARGE', cd: '20s', desc: 'Double attack for 5s', unlocked: false, req: 'LV.10' },
                { name: 'LAST STAND', cd: '60s', desc: 'Revive once per battle', unlocked: false, req: 'LV.15' },
              ].map((ab) => (
                <div key={ab.name} className="flex gap-2 p-2"
                  style={{ background: ab.unlocked ? C.bg2 : C.bg1, border: `1px solid ${ab.unlocked ? C.border2 : C.border0}`, opacity: ab.unlocked ? 1 : 0.5 }}>
                  <Img label="AB" style={{ width: 36, height: 36, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.bright, letterSpacing: '0.08em' }}>{ab.name}</div>
                    <Lbl style={{ display: 'block', fontSize: 9, color: C.muted, marginBottom: 2 }}>CD: {ab.cd}{(ab as any).req ? ` · 🔒 ${(ab as any).req}` : ''}</Lbl>
                    <Lbl style={{ fontSize: 9, color: C.dim, textTransform: 'none', letterSpacing: '0.04em' }}>{ab.desc}</Lbl>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="EQUIPMENT SLOTS" className="p-2">
            <div className="flex gap-2 pt-1">
              {['WEAPON', 'ARMOR', 'TOOL'].map((slot) => (
                <div key={slot} className="flex-1 flex flex-col items-center gap-1 p-2"
                  style={{ border: `1px dashed ${C.border1}`, background: C.bg2 }}>
                  <Img label={slot[0]} style={{ width: 40, height: 40 }} />
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{slot}</Lbl>
                  <Lbl style={{ fontSize: 9, color: C.border2 }}>EMPTY</Lbl>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ─── 8. Squad Prep — #6 inline assignment overlay (no circular nav) ───────────
function SquadPrepScreen({ onNav }: { onNav: (s: Screen) => void }) {
  type SlotData = { id: number; boat: string | null; captain: string | null; spec: string | null; power: number }
  const [squads, setSquads] = useState<SlotData[]>([
    { id: 1, boat: 'SENTRY SKIFF',  captain: 'MIRA STEELE', spec: 'SCOUT',  power: 220 },
    { id: 2, boat: 'DEPTH TRAWLER', captain: 'BROCK DUNE',  spec: 'GUNNER', power: 310 },
    { id: 3, boat: null, captain: null, spec: null, power: 0 },
  ])
  const [assigningSlot, setAssigningSlot] = useState<number | null>(null)
  const [assignStep, setAssignStep] = useState<'boat' | 'captain'>('boat')
  const [pendingBoat, setPendingBoat] = useState<string | null>(null)

  const availableBoats = ['SHADOW DINGHY', 'SALVAGE BARGE']
  const availableCaptains = ['LEX KORAL (MEDIC)', 'FINN SHORE (SCOUT)']
  const totalPower = squads.reduce((s, sq) => s + sq.power, 0)

  const confirmAssign = (cap: string) => {
    if (assigningSlot === null || !pendingBoat) return
    setSquads(prev => prev.map(sq =>
      sq.id === assigningSlot
        ? { ...sq, boat: pendingBoat, captain: cap.split(' (')[0], spec: cap.match(/\((.+)\)/)?.[1] ?? '', power: 180 }
        : sq
    ))
    setAssigningSlot(null); setPendingBoat(null); setAssignStep('boat')
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0, position: 'relative' }}>
      <ScreenHeader title="SQUAD PREPARATION" onBack={() => onNav('captains')}
        right={<><Lbl style={{ color: C.muted }}>FLEET POWER</Lbl><span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.bright, marginLeft: 4 }}>{totalPower}</span></>} />
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        <div className="flex flex-col gap-2 flex-1">
          {squads.map((sq) => (
            <Panel key={sq.id} className="flex-1 flex items-center gap-3 p-3" accent={!!sq.boat}>
              <div className="flex flex-col items-center justify-center shrink-0"
                style={{ width: 26, height: 26, border: `1px solid ${C.border2}`, background: C.bg3 }}>
                <Lbl style={{ fontSize: 11, color: C.mid }}>S{sq.id}</Lbl>
              </div>
              {sq.boat ? (
                <>
                  <Img label="BOAT" style={{ width: 64, height: 44, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.bright, letterSpacing: '0.08em' }}>{sq.boat}</div>
                    <Lbl style={{ fontSize: 9, color: C.muted }}>VESSEL</Lbl>
                    <Bar value={100} className="mt-1 w-24" />
                  </div>
                  <div className="w-px h-10 shrink-0" style={{ background: C.border0 }} />
                  <Img label="CAP" style={{ width: 36, height: 36, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.bright, letterSpacing: '0.08em' }}>{sq.captain}</div>
                    <Lbl style={{ fontSize: 9, color: C.muted }}>{sq.spec}</Lbl>
                  </div>
                  <div className="text-right shrink-0">
                    <Lbl style={{ display: 'block', color: C.muted, fontSize: 9 }}>POWER</Lbl>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.bright }}>{sq.power}</span>
                  </div>
                  <Btn size="sm" variant="ghost" onClick={() => { setAssigningSlot(sq.id); setAssignStep('boat') }}>CHANGE</Btn>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  {/* #6 opens overlay, no longer navigates to captains */}
                  <Btn variant="ghost" size="md" style={{ minWidth: 140 }}
                    onClick={() => { setAssigningSlot(sq.id); setAssignStep('boat') }}>
                    + ASSIGN BOAT & CAPTAIN
                  </Btn>
                </div>
              )}
            </Panel>
          ))}
        </div>
        <div className="w-36 flex flex-col gap-2">
          <Panel title="FLEET SUMMARY" className="flex-1 p-2">
            {[{ k: 'SQUADS', v: `${squads.filter(s => s.boat).length} / 3` }, { k: 'FLEET POWER', v: totalPower }, { k: 'FUEL LOAD', v: '18' }, { k: 'CAPTAINS', v: squads.filter(s => s.captain).length }].map((s) => (
              <div key={s.k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border0}` }}>
                <Lbl style={{ fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.bright }}>{s.v}</span>
              </div>
            ))}
          </Panel>
          <Btn variant="primary" size="lg" className="w-full" onClick={() => onNav('world-map')}>TO MAP ▶</Btn>
          <Btn variant="ghost" size="sm" className="w-full" onClick={() => onNav('settlement')}>CANCEL</Btn>
        </div>
      </div>

      {/* Inline assignment overlay */}
      {assigningSlot !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(6,13,22,0.9)' }}>
          <Panel accent className="p-4" style={{ width: 340 }}>
            <div className="flex items-center justify-between mb-3">
              <Head size={14}>SQUAD {assigningSlot} — {assignStep === 'boat' ? 'SELECT VESSEL' : 'SELECT CAPTAIN'}</Head>
              <Btn size="sm" variant="ghost" onClick={() => { setAssigningSlot(null); setPendingBoat(null); setAssignStep('boat') }}>✕</Btn>
            </div>
            {assignStep === 'boat' ? (
              <div className="flex flex-col gap-2">
                {availableBoats.map((b) => (
                  <div key={b} className="flex items-center gap-3 p-2 cursor-pointer"
                    style={{ border: `1px solid ${C.border1}`, background: C.bg2 }}
                    onClick={() => { setPendingBoat(b); setAssignStep('captain') }}>
                    <Img label="B" style={{ width: 40, height: 28 }} />
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.bright, letterSpacing: '0.08em', flex: 1 }}>{b}</span>
                    <Lbl style={{ color: C.mid }}>SELECT →</Lbl>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Lbl style={{ color: C.mid, marginBottom: 4 }}>VESSEL: {pendingBoat}</Lbl>
                {availableCaptains.map((cap) => (
                  <div key={cap} className="flex items-center gap-3 p-2 cursor-pointer"
                    style={{ border: `1px solid ${C.border1}`, background: C.bg2 }}
                    onClick={() => confirmAssign(cap)}>
                    <Img label="C" style={{ width: 32, height: 32 }} />
                    <span style={{ fontFamily: FONT_HEAD, fontSize: 13, color: C.bright, letterSpacing: '0.08em', flex: 1 }}>{cap}</span>
                    <Lbl style={{ color: C.mid }}>ASSIGN →</Lbl>
                  </div>
                ))}
                <Btn size="sm" variant="ghost" className="mt-1" onClick={() => setAssignStep('boat')}>← BACK</Btn>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}

// ─── 9. World Map — #3 preserveAspectRatio, #21 cleared, #25 SALVAGE/CACHE ──
function WorldMapScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const nodes = [
    { id: 0, x: 22, y: 38, type: 'BATTLE',  label: 'RUST SHOAL',    power: 280, fuel: 4,  reward: 'SALVAGE ×40', disc: true,  cleared: true  },
    { id: 1, x: 40, y: 22, type: 'ELITE',   label: 'IRON WRECK',    power: 480, fuel: 7,  reward: 'BLUEPRINT',   disc: true,  cleared: false },
    { id: 2, x: 58, y: 52, type: 'BATTLE',  label: 'GREY REEF',     power: 350, fuel: 5,  reward: 'FUEL ×20',    disc: true,  cleared: false },
    { id: 3, x: 74, y: 30, type: 'BOSS',    label: 'COLOSSUS GATE', power: 700, fuel: 10, reward: 'EPIC CAPTAIN', disc: false, cleared: false },
    { id: 4, x: 35, y: 65, type: 'SALVAGE', label: 'DEBRIS FIELD',  power: 200, fuel: 3,  reward: 'SALVAGE ×60', disc: true,  cleared: false },
    { id: 5, x: 55, y: 78, type: 'CACHE',   label: 'SUNKEN DEPOT',  power: 320, fuel: 6,  reward: 'WATER ×30',   disc: false, cleared: false },
  ]
  const edges = [[0, 1], [0, 4], [1, 2], [1, 3], [2, 5], [3, 5]]
  const playerX = 13, playerY = 62

  // #25 SALVAGE and CACHE are now distinct colours
  const typeColor: Record<string, string> = {
    BATTLE: C.mid, ELITE: C.bright, BOSS: C.hi,
    SALVAGE: C.salvage,
    CACHE: C.cache,
  }
  const typeShape: Record<string, string> = { BATTLE: '×', ELITE: '◆', BOSS: '!', SALVAGE: 'S', CACHE: 'C' }
  const selNode = sel !== null ? nodes[sel] : null

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="OCEAN MAP" onBack={() => onNav('settlement')} backLabel="BASE"
        right={<><Lbl style={{ color: C.muted }}>⛽ FUEL: 38</Lbl><div className="w-px h-4 mx-1" style={{ background: C.border0 }} /><Lbl style={{ color: C.muted }}>PWR: 530</Lbl></>} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative overflow-hidden" style={{ background: '#080e18' }}>
          <div className="absolute inset-0 opacity-8" style={{
            backgroundImage: `linear-gradient(${C.border0} 1px, transparent 1px), linear-gradient(90deg, ${C.border0} 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }} />
          {/* #3 preserveAspectRatio fixed to xMidYMid meet */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="fogGrad" cx="80%" cy="20%" r="55%">
                <stop offset="0%" stopColor="#080e18" stopOpacity="0" />
                <stop offset="60%" stopColor="#080e18" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#080e18" stopOpacity="1" />
              </radialGradient>
              <radialGradient id="fogGrad2" cx="55%" cy="80%" r="40%">
                <stop offset="0%" stopColor="#080e18" stopOpacity="0" />
                <stop offset="70%" stopColor="#080e18" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#080e18" stopOpacity="1" />
              </radialGradient>
            </defs>
            {edges.map(([a, b]) => {
              const na = nodes[a], nb = nodes[b]
              const bothDisc = na.disc && nb.disc
              return (
                <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={bothDisc ? C.border1 : C.border0} strokeWidth="0.5"
                  strokeDasharray={bothDisc ? '' : '1.5 2.5'} opacity={bothDisc ? 0.6 : 0.3} />
              )
            })}
            <circle cx={playerX} cy={playerY} r="28" fill="none" stroke={C.border2} strokeWidth="0.4" strokeDasharray="2 3" opacity="0.3" />
            {nodes.map((node) => {
              const isSel = sel === node.id
              const col = typeColor[node.type]
              return (
                <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSel(sel === node.id ? null : node.id)}>
                  {/* #1 expanded hit area */}
                  <rect x={node.x - 5.5} y={node.y - 5.5} width={11} height={11} fill="transparent" />
                  <rect x={node.x - 4} y={node.y - 4} width={8} height={8}
                    fill={isSel ? C.bg2 : (node.cleared ? C.bg0 : C.bg1)}
                    stroke={isSel ? C.white : col}
                    strokeWidth={isSel ? 1.2 : 0.7}
                    opacity={node.disc ? 1 : 0.25} />
                  {/* #21 cleared state */}
                  {node.cleared && node.disc && (
                    <text x={node.x} y={node.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                      style={{ fontFamily: FONT_MONO, fontSize: 4, fill: C.muted }}>✓</text>
                  )}
                  {!node.cleared && (
                    <text x={node.x} y={node.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                      style={{ fontFamily: FONT_MONO, fontSize: 3.5, fill: col, opacity: node.disc ? 1 : 0.25 }}>
                      {typeShape[node.type]}
                    </text>
                  )}
                  {node.disc && (
                    <text x={node.x} y={node.y + 7} textAnchor="middle" dominantBaseline="hanging"
                      style={{ fontFamily: FONT_MONO, fontSize: 2.5, fill: node.cleared ? C.muted : C.dim }}>
                      {node.cleared ? `✓ ${node.label}` : node.label}
                    </text>
                  )}
                </g>
              )
            })}
            <polygon points={`${playerX},${playerY - 5} ${playerX - 4},${playerY + 4} ${playerX + 4},${playerY + 4}`}
              fill={C.bright} stroke={C.white} strokeWidth="0.6" />
            <text x={playerX} y={playerY + 7} textAnchor="middle" dominantBaseline="hanging"
              style={{ fontFamily: FONT_MONO, fontSize: 2.8, fill: C.hi }}>YOU</text>
            <rect x="0" y="0" width="100" height="100" fill="url(#fogGrad)" />
            <rect x="0" y="0" width="100" height="100" fill="url(#fogGrad2)" />
          </svg>
          <Panel className="absolute bottom-2 left-2 p-2">
            <div className="flex flex-col gap-1">
              {Object.entries(typeColor).map(([t, c]) => (
                <div key={t} className="flex items-center gap-1.5">
                  <div style={{ width: 8, height: 8, border: `1px solid ${c}` }} />
                  <Lbl style={{ fontSize: 9, color: c }}>{t}</Lbl>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-1">
                <div style={{ width: 8, height: 8, border: `1px dashed ${C.border2}` }} />
                <Lbl style={{ fontSize: 9, color: C.muted }}>FUEL RANGE</Lbl>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, background: C.bg0, border: `1px solid ${C.muted}` }} />
                <Lbl style={{ fontSize: 9, color: C.muted }}>CLEARED</Lbl>
              </div>
            </div>
          </Panel>
        </div>
        <div className="w-44 flex flex-col" style={{ borderLeft: `1px solid ${C.border0}`, background: C.bg1 }}>
          {selNode ? (
            <div className="flex flex-col h-full p-3 gap-2">
              <Lbl style={{ color: C.muted, display: 'block' }}>SELECTED</Lbl>
              <Head size={14}>{selNode.label}</Head>
              <Lbl style={{ color: typeColor[selNode.type] }}>{selNode.type}</Lbl>
              {selNode.cleared && <Lbl style={{ color: C.muted }}>✓ CLEARED</Lbl>}
              <div style={{ borderTop: `1px solid ${C.border0}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ k: 'REC. POWER', v: `${selNode.power}+` }, { k: 'FUEL COST', v: `⛽ ${selNode.fuel}` }, { k: 'REWARD', v: selNode.reward }].map((d) => (
                  <div key={d.k}>
                    <Lbl style={{ display: 'block', fontSize: 9, color: C.muted }}>{d.k}</Lbl>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mid }}>{d.v}</span>
                  </div>
                ))}
              </div>
              {!selNode.disc && <Panel className="p-2 text-center"><Lbl style={{ color: C.muted }}>UNEXPLORED</Lbl></Panel>}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Btn variant="primary" size="lg" className="w-full" onClick={() => onNav('encounter')}>▶ DEPLOY</Btn>
                <Btn variant="ghost" size="sm" className="w-full">INTEL</Btn>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full p-3 gap-2">
              <Lbl style={{ color: C.muted, display: 'block', marginBottom: 4 }}>FLEET STATUS</Lbl>
              {[{ k: 'FLEET POWER', v: '530' }, { k: 'FUEL', v: '38/100' }, { k: 'SQUADS READY', v: '2' }, { k: 'NODES CLEARED', v: '1/6' }].map((d) => (
                <div key={d.k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border0}` }}>
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{d.k}</Lbl>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mid }}>{d.v}</span>
                </div>
              ))}
              <Lbl style={{ color: C.border1, marginTop: 8, lineHeight: 1.8, textTransform: 'none', letterSpacing: '0.04em' }}>TAP A NODE TO INSPECT</Lbl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 10. Encounter — #14 underpowered warning ─────────────────────────────────
function EncounterScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const fleetPower = 530
  const recPower = 280
  const underpowered = fleetPower < recPower
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="ENCOUNTER: RUST SHOAL" onBack={() => onNav('world-map')} backLabel="MAP" />
      <div className="flex flex-1 overflow-hidden p-3 gap-3">
        <div className="flex-1 flex flex-col gap-3">
          <Panel title="ENEMY FORCE" className="flex-1">
            <div className="flex gap-3 p-3">
              <Img label="ENEMY FLEET" style={{ width: 110, height: 74, flexShrink: 0 }} />
              <div className="flex-1">
                <Head size={14}>SCAVENGER RAIDERS</Head>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {[{ k: 'WAVES', v: '3' }, { k: 'ENEMIES', v: '8–12' }, { k: 'POWER', v: '~280' }, { k: 'SPECIAL', v: 'NONE' }].map((s) => (
                    <Panel key={s.k} className="px-2 py-1.5">
                      <Lbl style={{ display: 'block', fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{s.v}</span>
                    </Panel>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="REWARDS" className="p-3">
            <div className="flex gap-2">
              {[{ type: 'SALVAGE', amt: '40–60', chance: '100%' }, { type: 'FUEL', amt: '5–10', chance: '60%' }, { type: 'BLUEPRINT', amt: '×1', chance: '15%' }].map((r) => (
                <Panel key={r.type} className="flex-1 p-2 flex flex-col items-center gap-1">
                  <Img label={r.type[0]} style={{ width: '100%', height: 28 }} />
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{r.type}</Lbl>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{r.amt}</span>
                  <Lbl style={{ fontSize: 9, color: C.dim }}>{r.chance}</Lbl>
                </Panel>
              ))}
            </div>
          </Panel>
        </div>
        <div className="w-48 flex flex-col gap-2">
          <Panel title="YOUR FLEET" className="flex-1 p-2">
            {[{ id: 'S1', name: 'SENTRY SKIFF', cap: 'MIRA', pwr: 220 }, { id: 'S2', name: 'DEPTH TRAWLER', cap: 'BROCK', pwr: 310 }].map((sq) => (
              <div key={sq.id} className="flex items-center gap-2 py-2" style={{ borderBottom: `1px solid ${C.border0}` }}>
                <Lbl style={{ width: 18, fontSize: 9, color: C.muted }}>{sq.id}</Lbl>
                <Img label="B" style={{ width: 24, height: 18, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 10, color: C.bright, letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sq.name}</div>
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{sq.cap}</Lbl>
                </div>
                <Lbl style={{ color: C.mid }}>{sq.pwr}</Lbl>
              </div>
            ))}
            <div className="mt-2 flex flex-col gap-1.5">
              {[{ k: 'FLEET POWER', v: `${fleetPower}`, ok: !underpowered }, { k: 'REC. POWER', v: `${recPower}+`, ok: true }, { k: 'FUEL COST', v: '⛽ 4', ok: true }, { k: 'REMAINING', v: '34', ok: true }].map((s) => (
                <div key={s.k} className="flex justify-between">
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: s.ok ? C.mid : C.warnFill }}>{s.v}</span>
                </div>
              ))}
            </div>
            {/* #14 underpowered warning */}
            {underpowered && (
              <Panel className="mt-2 p-2" style={{ borderColor: C.warnFill }}>
                <Lbl style={{ color: C.warnFill }}>⚠ UNDERPOWERED — HIGH RISK</Lbl>
              </Panel>
            )}
          </Panel>
          <Btn variant="primary" size="lg" className="w-full" onClick={() => onNav('combat')}>⚔ BATTLE</Btn>
          <Btn variant="ghost" size="md" className="w-full" onClick={() => onNav('world-map')}>RETREAT</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── 11. Combat — #18 no empty squads, 44px abilities, #19 HP vs energy, #23 full names ──
function CombatScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [speed, setSpeed] = useState(1)
  const [wave] = useState(1)
  const [paused, setPaused] = useState(false)

  // #18 only populated squads, no empty entries
  const squads = [
    { id: 1, name: 'SENTRY SKIFF', cap: 'MIRA', hp: 72, energy: 60,
      abilities: [{ name: 'VOLLEY', cost: 40, ready: true }, { name: 'EVADE', cost: 60, ready: false }, { name: 'SCAN', cost: 30, ready: true }] },
    { id: 2, name: 'DEPTH TRAWLER', cap: 'BROCK', hp: 45, energy: 90,
      abilities: [{ name: 'BARRAGE', cost: 50, ready: true }, { name: 'SUPPRESS', cost: 70, ready: true }, { name: 'LAST STAND', cost: 90, ready: false }] },
  ]
  const enemies = [
    { id: 'E1', name: 'RAIDER',  hp: 55 },
    { id: 'E2', name: 'GUNBOAT', hp: 80 },
    { id: 'E3', name: 'DRIFTER', hp: 20 },
  ]

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <div className="flex items-center gap-2 px-2 py-1.5 shrink-0"
        style={{ background: C.bg0, borderBottom: `1px solid ${C.border0}`, ...safeTop, ...safeSides, minHeight: 44 }}>
        <Btn size="sm" onClick={() => setPaused(!paused)}>{paused ? '▶' : '⏸'}</Btn>
        <Panel className="flex items-center gap-2 px-2 py-1">
          <Lbl style={{ fontSize: 9, color: C.muted }}>WAVE</Lbl>
          <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{wave} / 3</span>
        </Panel>
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          {enemies.map((e) => (
            <div key={e.id} className="flex items-center gap-1.5 min-w-0">
              <Img label={e.id} style={{ width: 20, height: 16, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <Lbl style={{ display: 'block', fontSize: 9, color: C.muted, marginBottom: 1 }}>{e.name}</Lbl>
                <Bar value={e.hp} style={{ width: 48 }} color={e.hp < 30 ? C.warnFill : C.hpFill} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center shrink-0" style={{ border: `1px solid ${C.border1}` }}>
          {[1, 2, 3].map((s) => (
            <button key={s} className="cursor-pointer border-0"
              style={{ fontFamily: FONT_MONO, fontSize: 11, padding: '4px 8px', background: speed === s ? C.bg3 : 'transparent', color: speed === s ? C.bright : C.muted, minHeight: 36 }}
              onClick={() => setSpeed(s)}>{s}×</button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: '#060d16' }}>
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1={0} y1={y} x2={100} y2={y} stroke={C.border0} strokeWidth="0.5" />
          ))}
        </svg>
        <div className="absolute flex flex-col gap-3" style={{ left: 20, top: '50%', transform: 'translateY(-50%)' }}>
          {squads.map((sq) => (
            <Img key={sq.id} label={`SQ${sq.id}`} style={{ width: 44, height: 32, border: `1px solid ${C.border2}` }} />
          ))}
        </div>
        <div className="absolute flex flex-col gap-3" style={{ right: 20, top: '50%', transform: 'translateY(-50%)' }}>
          {enemies.map((e) => (
            <Img key={e.id} label={e.id} style={{ width: 40, height: 28, border: `1px solid ${C.border1}` }} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Lbl style={{ color: C.border0, letterSpacing: '0.3em' }}>[ BATTLE ANIMATION ]</Lbl>
        </div>
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: 'rgba(6,13,22,0.8)' }}>
            <Panel accent className="px-8 py-5 flex flex-col items-center gap-3">
              <Head size={18}>PAUSED</Head>
              <Btn variant="primary" size="lg" onClick={() => setPaused(false)}>▶ RESUME</Btn>
              <Btn variant="ghost" size="sm" onClick={() => onNav('settlement')}>RETREAT TO BASE</Btn>
            </Panel>
          </div>
        )}
        <div className="absolute top-1 right-2 flex gap-1.5">
          <Btn size="sm" variant="ghost" onClick={() => onNav('victory')}>→ WIN</Btn>
          <Btn size="sm" variant="ghost" onClick={() => onNav('defeat')}>→ LOSE</Btn>
        </div>
      </div>

      {/* Squad controls — #18 empty squads collapsed, #23 full names, #19 distinct bars */}
      <div className="flex shrink-0"
        style={{ borderTop: `1px solid ${C.border0}`, background: C.bg1, ...safeBottom, ...safeSides }}>
        {squads.map((sq, i) => (
          <div key={sq.id} className="flex-1 flex flex-col gap-1.5 p-2"
            style={{ borderRight: i < squads.length - 1 ? `1px solid ${C.border0}` : 'none' }}>
            <div className="flex items-center gap-1.5">
              <Img label={`S${sq.id}`} style={{ width: 22, height: 18, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_HEAD, fontSize: 10, color: C.bright, letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sq.name}</div>
                <Lbl style={{ fontSize: 9, color: C.muted }}>{sq.cap}</Lbl>
              </div>
            </div>
            {/* #19 HP bar — blue-gray, labelled HP */}
            <div>
              <div className="flex justify-between mb-0.5">
                <Lbl style={{ fontSize: 9, color: C.muted }}>HP</Lbl>
                <Lbl style={{ fontSize: 9, color: sq.hp < 30 ? C.warnFill : C.dim }}>{sq.hp}%</Lbl>
              </div>
              <Bar value={sq.hp} color={sq.hp < 30 ? C.warnFill : C.hpFill} />
            </div>
            {/* #19 Energy bar — green-gray, visually distinct from HP */}
            <div>
              <div className="flex justify-between mb-0.5">
                <Lbl style={{ fontSize: 9, color: C.muted }}>ENERGY</Lbl>
                <Lbl style={{ fontSize: 9, color: C.dim }}>{sq.energy}%</Lbl>
              </div>
              <div style={{ height: 5, background: C.bg3, border: `1px solid ${C.border0}` }}>
                <div style={{ height: '100%', width: `${sq.energy}%`, background: C.energyFill }} />
              </div>
            </div>
            {/* #18 minHeight 44px, #23 no name truncation */}
            <div className="flex gap-1 mt-0.5">
              {sq.abilities.map((ab) => {
                const canUse = sq.energy >= ab.cost && ab.ready
                return (
                  <div key={ab.name} className="flex-1 flex flex-col items-center cursor-pointer"
                    style={{
                      border: `1px solid ${canUse ? C.border2 : C.border0}`,
                      background: canUse ? C.bg3 : C.bg2,
                      padding: '5px 2px', position: 'relative', overflow: 'hidden',
                      minHeight: 44,
                    }}>
                    {!ab.ready && <div style={{ position: 'absolute', inset: 0, background: C.bg0, opacity: 0.55 }} />}
                    <Img label="AB" style={{ width: '100%', height: 14, border: 'none' }} />
                    {/* #23 full name, no truncation — wraps instead */}
                    <Lbl style={{ fontSize: 8, color: canUse ? C.mid : C.muted, marginTop: 2, textAlign: 'center', zIndex: 1, position: 'relative', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: '100%' }}>
                      {ab.name}
                    </Lbl>
                    <Lbl style={{ fontSize: 8, color: C.border2, zIndex: 1, position: 'relative' }}>{ab.cost}EN</Lbl>
                    {!ab.ready && <Lbl style={{ fontSize: 8, color: C.muted, zIndex: 1, position: 'relative' }}>CD</Lbl>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 12. Victory — #13 tap-to-claim + level-up banner ────────────────────────
function VictoryScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [claimed, setClaimed] = useState<Set<string>>(new Set())
  const [levelUp, setLevelUp] = useState(false)

  const rewards = [
    { id: 'salvage', label: 'SALVAGE', val: '+48' },
    { id: 'fuel',    label: 'FUEL',    val: '+8'  },
    { id: 'exp',     label: 'EXP',     val: '+320' },
  ]

  const claim = (id: string) => {
    setClaimed(prev => new Set([...prev, id]))
    if (id === 'exp') setTimeout(() => setLevelUp(true), 400)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: C.bg0, position: 'relative' }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: C.border1 }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.border2 }}>✦ ✦ ✦</span>
            <div className="flex-1 h-px" style={{ background: C.border1 }} />
          </div>
          <Head size={24} style={{ letterSpacing: '0.3em', display: 'block' }}>VICTORY</Head>
          <Lbl style={{ color: C.muted, marginTop: 4, letterSpacing: '0.2em' }}>RUST SHOAL — CLEARED</Lbl>
        </div>
        <div className="flex gap-3">
          <Panel title="REWARDS" className="flex-1 p-2">
            {rewards.map((r) => {
              const isClaimed = claimed.has(r.id)
              return (
                <div key={r.id}
                  className="flex justify-between py-2 cursor-pointer items-center"
                  style={{ borderBottom: `1px solid ${C.border0}`, opacity: isClaimed ? 0.45 : 1 }}
                  onClick={() => !isClaimed && claim(r.id)}>
                  <Lbl style={{ color: C.dim }}>{r.label}</Lbl>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{r.val}</span>
                    {isClaimed
                      ? <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mid }}>✓</span>
                      : <Lbl style={{ color: C.border2, fontSize: 9 }}>TAP</Lbl>}
                  </div>
                </div>
              )
            })}
          </Panel>
          <Panel title="CAPTAIN XP" className="flex-1 p-2">
            {[{ name: 'MIRA', lv: 5, xp: 75 }, { name: 'BROCK', lv: 7, xp: 88 }].map((c) => (
              <div key={c.name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <Lbl style={{ color: C.dim }}>{c.name} · LV.{c.lv}</Lbl>
                  <Lbl style={{ color: C.mid }}>+120 XP</Lbl>
                </div>
                <Bar value={c.xp} />
              </div>
            ))}
          </Panel>
          <Panel title="BATTLE STATS" className="flex-1 p-2">
            {[{ k: 'ENEMIES SUNK', v: '9' }, { k: 'DMG TAKEN', v: '340' }, { k: 'WAVES', v: '3/3' }, { k: 'TIME', v: '2:14' }].map((s) => (
              <div key={s.k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border0}` }}>
                <Lbl style={{ fontSize: 9, color: C.muted }}>{s.k}</Lbl>
                <Lbl style={{ color: C.mid }}>{s.v}</Lbl>
              </div>
            ))}
          </Panel>
        </div>
        <div className="flex gap-2 mt-4">
          <Btn variant="primary" size="lg" className="flex-1" onClick={() => onNav('settlement')}>▶ RETURN TO BASE</Btn>
          <Btn size="md" onClick={() => onNav('world-map')}>STAY ON MAP</Btn>
        </div>
      </div>
      {/* #13 level-up banner */}
      {levelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Panel accent className="px-6 py-4 text-center" style={{ pointerEvents: 'all' }} onClick={() => setLevelUp(false)}>
            <Head size={13} style={{ display: 'block', color: C.dim, marginBottom: 4 }}>CAPTAIN LEVEL UP</Head>
            <Head size={20} style={{ display: 'block', letterSpacing: '0.2em' }}>BROCK DUNE → LV.8</Head>
            <Lbl style={{ display: 'block', marginTop: 6, color: C.mid }}>NEW ABILITY: OVERCHARGE</Lbl>
            <Lbl style={{ display: 'block', marginTop: 8, color: C.muted }}>TAP TO DISMISS</Lbl>
          </Panel>
        </div>
      )}
    </div>
  )
}

// ─── 13. Defeat — #15 UPGRADE FLEET, #17 repair costs ───────────────────────
function DefeatScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const losses = [
    { name: 'SENTRY SKIFF',  status: 'SUNK',    repairCost: 30 },
    { name: 'DEPTH TRAWLER', status: 'DAMAGED',  repairCost: 10 },
  ]
  const totalRepair = losses.reduce((s, l) => s + l.repairCost, 0)
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6"
      style={{ background: C.bg0 }}>
      <div className="w-full max-w-xl">
        <div className="text-center mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: C.border0 }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted }}>— — —</span>
            <div className="flex-1 h-px" style={{ background: C.border0 }} />
          </div>
          <Head size={24} style={{ letterSpacing: '0.3em', color: C.dim, display: 'block' }}>FLEET DEFEATED</Head>
          <Lbl style={{ color: C.muted, marginTop: 4, letterSpacing: '0.2em' }}>RUST SHOAL — FAILED</Lbl>
        </div>
        <div className="flex gap-3">
          <Panel title="LOSSES" className="flex-1 p-2">
            {/* #17 repair costs shown */}
            {losses.map((l) => (
              <div key={l.name} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${C.border0}` }}>
                <Img label="B" style={{ width: 24, height: 18, flexShrink: 0 }} />
                <div className="flex-1">
                  <div style={{ fontFamily: FONT_HEAD, fontSize: 10, color: C.dim, letterSpacing: '0.06em' }}>{l.name}</div>
                  <Lbl style={{ fontSize: 9, color: C.muted }}>{l.status}</Lbl>
                </div>
                <div className="text-right">
                  <Lbl style={{ fontSize: 9, color: C.warnFill, display: 'block' }}>REPAIR</Lbl>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.warnFill }}>✦ {l.repairCost}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <Lbl style={{ color: C.muted }}>TOTAL REPAIR</Lbl>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.warnFill }}>✦ {totalRepair}</span>
            </div>
          </Panel>
          <Panel title="PARTIAL REWARDS" className="flex-1 p-2">
            {[{ label: 'SALVAGE', val: '+12' }, { label: 'EXP', val: '+80' }].map((r) => (
              <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${C.border0}` }}>
                <Lbl style={{ color: C.muted }}>{r.label}</Lbl>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.dim }}>{r.val}</span>
              </div>
            ))}
            <Panel className="mt-3 p-2">
              <Lbl style={{ fontSize: 10, color: C.muted, lineHeight: 1.8, textTransform: 'none', letterSpacing: '0.04em' }}>
                TIP: UPGRADE YOUR FLEET BEFORE RETRYING.
              </Lbl>
            </Panel>
          </Panel>
        </div>
        <div className="flex gap-2 mt-4">
          <Btn variant="primary" size="lg" className="flex-1" onClick={() => onNav('settlement')}>← RETURN TO BASE</Btn>
          {/* #15 UPGRADE FLEET CTA */}
          <Btn size="md" onClick={() => onNav('construct')}>UPGRADE FLEET</Btn>
          <Btn size="md" onClick={() => onNav('encounter')}>RETRY</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── 14. Quests — #16 tabs below header, #27 reward text size ────────────────
function QuestPanel({ onNav }: { onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState(0)
  const quests = [
    { name: 'FIRST BLOOD',     desc: 'Win your first naval battle',  prog: 1, total: 1, done: true,  reward: 'SALVAGE ×50' },
    { name: 'BOAT BUILDER',    desc: 'Construct 3 support boats',    prog: 1, total: 3, done: false, reward: 'BLUEPRINT' },
    { name: 'CREW OF LEGENDS', desc: 'Recruit 4 captains',           prog: 2, total: 4, done: false, reward: 'EPIC CAPTAIN TOKEN' },
    { name: 'DEEP EXPLORER',   desc: 'Discover 5 encounter nodes',   prog: 3, total: 5, done: false, reward: 'MAP FRAGMENT' },
    { name: 'IRON FLEET',      desc: 'Reach Fleet Level 15',         prog: 12, total: 15, done: false, reward: 'FLAGSHIP UPGRADE' },
  ]
  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0 }}>
      <ScreenHeader title="QUESTS" onBack={() => onNav('settlement')} />
      {/* #16 tabs below header, not in top-right corner */}
      <div className="flex shrink-0" style={{ borderBottom: `1px solid ${C.border0}` }}>
        {['ACTIVE', 'DAILY', 'STORY'].map((t, i) => (
          <button key={t} className="flex-1 cursor-pointer border-0"
            style={{
              fontFamily: FONT_HEAD, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '10px 8px', minHeight: 44,
              background: tab === i ? C.bg2 : 'transparent',
              color: tab === i ? C.bright : C.muted,
              borderBottom: tab === i ? `2px solid ${C.border2}` : '2px solid transparent',
            }}
            onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
          {quests.map((q, i) => (
            <Panel key={i} className="flex items-center gap-3 p-3" accent={q.done}>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: 22, height: 22, border: `1px solid ${q.done ? C.mid : C.border1}`, background: q.done ? C.bg3 : 'transparent' }}>
                {q.done && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.mid }}>✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: FONT_HEAD, fontSize: 13, color: q.done ? C.bright : C.mid, letterSpacing: '0.08em' }}>{q.name}</div>
                <Lbl style={{ fontSize: 10, color: C.muted, textTransform: 'none', letterSpacing: '0.04em' }}>{q.desc}</Lbl>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 w-20">
                <Lbl style={{ color: C.mid }}>{q.prog}/{q.total}</Lbl>
                <Bar value={q.prog} max={q.total} style={{ width: '100%' }} />
              </div>
              <Panel className="px-2 py-1 text-center shrink-0 w-36">
                <Lbl style={{ display: 'block', fontSize: 9, color: C.muted }}>REWARD</Lbl>
                {/* #27 reward text at minimum 12px */}
                <span style={{ fontFamily: FONT_HEAD, fontSize: 12, color: C.mid, letterSpacing: '0.06em' }}>{q.reward}</span>
              </Panel>
              {q.done && <Btn variant="primary" size="sm" className="shrink-0">CLAIM</Btn>}
            </Panel>
          ))}
        </div>
        <div className="w-36 p-3 flex flex-col gap-2" style={{ borderLeft: `1px solid ${C.border0}` }}>
          <Panel title="PROGRESS" className="p-2">
            <span style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.mid, display: 'block' }}>3/12</span>
            <Lbl style={{ color: C.muted, display: 'block', marginBottom: 4 }}>QUESTS DONE</Lbl>
            <Bar value={25} />
          </Panel>
          <Panel className="p-2">
            <Lbl style={{ display: 'block', color: C.muted, fontSize: 9, marginBottom: 2 }}>DAILY RESET</Lbl>
            <span style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.bright }}>18:42:00</span>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ─── 15. Settings — #7 returnTo, #8 RESET confirm, #28 touch sliders ─────────
function SettingsScreen({ onNav, returnTo }: { onNav: (s: Screen) => void; returnTo: Screen }) {
  const [music, setMusic] = useState(70)
  const [sfx, setSfx] = useState(85)
  const [notifs, setNotifs] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [section, setSection] = useState('AUDIO')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const sections = ['AUDIO', 'DISPLAY', 'CONTROLS', 'ACCOUNT', 'ABOUT']

  return (
    <div className="w-full h-full flex flex-col" style={{ background: C.bg0, position: 'relative' }}>
      {/* #7 back returns to wherever the user came from */}
      <ScreenHeader title="SETTINGS" onBack={() => onNav(returnTo)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-32 flex flex-col p-2 gap-0.5" style={{ borderRight: `1px solid ${C.border0}` }}>
          {sections.map((s) => (
            <button key={s} className="w-full cursor-pointer border-0"
              style={{
                fontFamily: FONT_HEAD, fontSize: 12, letterSpacing: '0.1em', textAlign: 'left',
                padding: '10px 12px', textTransform: 'uppercase', minHeight: 44,
                background: section === s ? C.bg2 : 'transparent',
                color: section === s ? C.bright : C.muted,
                borderLeft: section === s ? `2px solid ${C.border2}` : '2px solid transparent',
              }}
              onClick={() => setSection(s)}>{s}</button>
          ))}
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-sm flex flex-col gap-5">
            {section === 'AUDIO' && (
              <>
                <Panel title="VOLUME" className="p-3">
                  {/* #28 custom touch sliders */}
                  {[{ label: 'MUSIC', val: music, set: setMusic }, { label: 'SFX', val: sfx, set: setSfx }].map((s) => (
                    <div key={s.label} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <Lbl style={{ color: C.muted }}>{s.label}</Lbl>
                        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.bright }}>{s.val}</span>
                      </div>
                      <TouchSlider value={s.val} onChange={s.set} />
                    </div>
                  ))}
                </Panel>
                <Panel title="PREFERENCES" className="p-3">
                  {[{ label: 'PUSH NOTIFICATIONS', val: notifs, set: setNotifs }, { label: 'AUTO-SAVE', val: autoSave, set: setAutoSave }].map((t) => (
                    <div key={t.label} className="flex items-center justify-between mb-3" style={{ minHeight: 44 }}>
                      <Lbl style={{ color: C.dim }}>{t.label}</Lbl>
                      <button className="cursor-pointer border-0 flex items-center"
                        style={{ width: 44, height: 24, background: t.val ? C.bg3 : C.bg2, border: `1px solid ${t.val ? C.border2 : C.border1}`, padding: 3, justifyContent: t.val ? 'flex-end' : 'flex-start' }}
                        onClick={() => t.set(!t.val)}>
                        <div style={{ width: 16, height: 16, background: t.val ? C.bright : C.muted }} />
                      </button>
                    </div>
                  ))}
                </Panel>
              </>
            )}
            {section === 'ACCOUNT' && (
              <Panel title="PLAYER PROFILE" className="p-3">
                <div className="flex items-center gap-3 mb-3">
                  <Img label="AVT" style={{ width: 44, height: 44 }} />
                  <div>
                    <div style={{ fontFamily: FONT_HEAD, fontSize: 14, color: C.bright, letterSpacing: '0.1em' }}>CMDR VOSS</div>
                    <Lbl style={{ color: C.muted }}>FLEET LEVEL 12</Lbl>
                  </div>
                  <Btn size="sm" className="ml-auto">EDIT</Btn>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" className="flex-1">CLOUD SAVE</Btn>
                  {/* #8 danger variant, opens confirmation */}
                  <Btn size="sm" variant="danger" className="flex-1" onClick={() => setShowResetConfirm(true)}>RESET DATA</Btn>
                </div>
              </Panel>
            )}
            {!['AUDIO', 'ACCOUNT'].includes(section) && (
              <Panel className="p-4 flex items-center justify-center">
                <Lbl style={{ color: C.border1 }}>[{section} — COMING SOON]</Lbl>
              </Panel>
            )}
          </div>
        </div>
      </div>
      {/* #8 confirmation dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title="RESET ALL DATA?"
          body="This will permanently delete your save. Day 14, Fleet Level 12 will be lost forever. This cannot be undone."
          confirmLabel="RESET EVERYTHING"
          dangerous
          onConfirm={() => { setShowResetConfirm(false); onNav('menu') }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('boot')
  const [prevScreen, setPrevScreen] = useState<Screen>('menu')

  // #7 — track previous screen so settings can go back to origin
  const nav = useCallback((to: Screen) => {
    setPrevScreen(screen)
    setScreen(to)
  }, [screen])

  const screens: Record<Screen, React.ReactNode> = {
    boot:             <BootScreen onDone={() => nav('menu')} />,
    menu:             <MenuScreen onNav={nav} />,
    settlement:       <SettlementScreen onNav={nav} activeScreen={screen} />,
    construct:        <ConstructScreen onNav={nav} />,
    'boat-info':      <BoatInfoScreen onNav={nav} />,
    captains:         <CaptainsScreen onNav={nav} />,
    'captain-detail': <CaptainDetailScreen onNav={nav} />,
    'squad-prep':     <SquadPrepScreen onNav={nav} />,
    'world-map':      <WorldMapScreen onNav={nav} />,
    encounter:        <EncounterScreen onNav={nav} />,
    combat:           <CombatScreen onNav={nav} />,
    victory:          <VictoryScreen onNav={nav} />,
    defeat:           <DefeatScreen onNav={nav} />,
    quests:           <QuestPanel onNav={nav} />,
    settings:         <SettingsScreen onNav={nav} returnTo={prevScreen} />,
  }

  const LABELS: Record<Screen, string> = {
    boot: 'BOOT', menu: 'MAIN MENU', settlement: 'SETTLEMENT', construct: 'CONSTRUCT',
    'boat-info': 'BOAT INFO', captains: 'CAPTAINS', 'captain-detail': 'CAPTAIN DETAIL',
    'squad-prep': 'SQUAD PREP', 'world-map': 'WORLD MAP', encounter: 'ENCOUNTER',
    combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT', quests: 'QUESTS', settings: 'SETTINGS',
  }
  const ALL: Screen[] = [
    'boot', 'menu', 'settlement', 'construct', 'boat-info',
    'captains', 'captain-detail', 'squad-prep', 'world-map',
    'encounter', 'combat', 'victory', 'defeat', 'quests', 'settings',
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3"
      style={{ background: '#06080d', fontFamily: FONT_MONO }}>
      <div className="w-full max-w-[920px] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2"
          style={{ background: '#08090f', border: `1px solid ${C.border0}`, borderBottom: 'none' }}>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', border: `1px solid ${C.border1}`, background: C.border0 }} />
            ))}
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 9, color: C.border1, letterSpacing: '0.2em' }}>
            LAST FLEET · PROTOTYPE V3 · {LABELS[screen]}
          </div>
          <Lbl style={{ color: C.border0, fontSize: 9 }}>LANDSCAPE · 16:9</Lbl>
        </div>
        <div style={{ aspectRatio: '16/9', border: `1px solid ${C.border0}`, overflow: 'hidden', position: 'relative' }}>
          {screens[screen]}
        </div>
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto"
          style={{ background: '#08090f', border: `1px solid ${C.border0}`, borderTop: `1px solid ${C.border0}` }}>
          <Lbl style={{ color: C.border1, marginRight: 4, flexShrink: 0 }}>JUMP TO:</Lbl>
          {ALL.map((s) => (
            <button key={s} className="shrink-0 cursor-pointer border-0"
              style={{
                fontFamily: FONT_MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '4px 8px', minHeight: 32,
                background: screen === s ? C.bg2 : 'transparent',
                color: screen === s ? C.bright : C.muted,
                border: `1px solid ${screen === s ? C.border2 : C.border0}`,
              }}
              onClick={() => nav(s)}>{LABELS[s]}</button>
          ))}
        </div>
      </div>
      <p style={{ marginTop: 8, fontFamily: FONT_MONO, fontSize: 9, color: C.border0, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        LAST FLEET · PROTOTYPE V3 · LOW-FIDELITY WIREFRAME
      </p>
    </div>
  )
}
