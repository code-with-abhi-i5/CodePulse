declare module "lucide-react" {
  import * as React from "react"
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number
    color?: string
    strokeWidth?: string | number
  }
  export type LucideIcon = React.FC<LucideProps>
  export const XIcon: LucideIcon
  export const X: LucideIcon
  export const PanelLeftIcon: LucideIcon
  export const [key: string]: LucideIcon
}
