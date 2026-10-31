import '@/features/pixel-art/styles/container.css'
import { NavOptions } from '@/features/pixel-art/components/nav-options'
import { CanvasBoard } from '@/features/pixel-art/components/canvas-board'

export const Container = () => {
  return (
    <section className="am-container">
      <h1>PIXEL ART EDITOR</h1>
      <NavOptions />
      <CanvasBoard />
    </section>
  )
}
