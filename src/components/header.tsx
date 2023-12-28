import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';

function ResponsiveAppBar() {

  return (
    <AppBar className='paper-texture' position="static" sx={{bgcolor: 'rgb(66 32 6)', mb: '40px'}}> 
      <Container maxWidth="xl">
        <Toolbar disableGutters>
            <p className='text-3xl'>Magic: The Griddening</p>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;