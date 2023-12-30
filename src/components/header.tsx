import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Image from 'next/image';

function ResponsiveAppBar (): React.JSX.Element {
  return (
    <AppBar className='paper-texture' position="static" sx={{ bgcolor: 'rgb(66 32 6)', mb: '40px' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
            <Image className="mr-4" src="/magic-the-griddening.png" alt="logo" height={32} width={32}></Image>
            <p className='text-3xl'>Magic: The Griddening</p>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
export default ResponsiveAppBar
