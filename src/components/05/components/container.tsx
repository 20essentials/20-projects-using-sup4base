import '@/components/05/styles/container.css'
import { NavOptions } from '@/components/05/components/nav-options'
import { CanvasBoard } from '@/components/05/components/canvas-board'

export const Container = () => {
  return (
    <section className="am-container">
      <h1>PIXEL ART EDITOR</h1>
      <NavOptions />
      <CanvasBoard />
    </section>
  )
}
