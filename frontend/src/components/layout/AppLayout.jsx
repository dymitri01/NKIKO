import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flex: '999 1 560px', minWidth: 0, p: { xs: 3, md: 5 } }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
