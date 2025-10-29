import '@/components/05/styles/Container.css'
import { NavOptions } from '@/components/05/components/NavOptions'
import { CanvasBoard } from '@/components/05/components/CanvasBoard'

export const Container = () => {
  return (
    <section className="am-container">
      <h1>PIXEL ART EDITOR</h1>
      <NavOptions />
      <CanvasBoard />
    </section>
  )
}
