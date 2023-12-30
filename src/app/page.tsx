import Game from '@/components/game'
import Header from '@/components/header'
import React from 'react'

export default function Home (): React.JSX.Element {
  return (
    <div>
      <Header />
      <Game />
    </div>
  )
}
