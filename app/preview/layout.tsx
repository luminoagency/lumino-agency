import { cormorant, libre, cinzel, lato, inter } from '@/templates/shared/fonts'
import '@/templates/styles/luxury/theme.css'
import '@/templates/styles/exotic/theme.css'
import '@/templates/styles/modern/theme.css'

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    cormorant.variable,
    libre.variable,
    cinzel.variable,
    lato.variable,
    inter.variable,
  ].join(' ')

  return (
    <div className={fontVars}>
      {children}
    </div>
  )
}
