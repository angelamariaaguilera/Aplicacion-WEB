import { Cat, Dog, PawPrint } from 'lucide-react'

/** Elige el ícono y el color del avatar según la especie. */
export default function PetAvatar({ species = '', size }) {
  const normalized = String(species).toLowerCase()

  let tone = 'other'
  let Icon = PawPrint

  if (normalized.includes('perro') || normalized.includes('dog') || normalized.includes('canino')) {
    tone = 'dog'
    Icon = Dog
  } else if (normalized.includes('gato') || normalized.includes('cat') || normalized.includes('felino')) {
    tone = 'cat'
    Icon = Cat
  }

  return (
    <span className={`pet-avatar ${tone} ${size === 'lg' ? 'lg' : ''}`}>
      <Icon size={size === 'lg' ? 26 : 19} strokeWidth={1.9} />
    </span>
  )
}