import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { label: 'Tableau de bord', to: '/', icon: DashboardOutlinedIcon },
  { label: 'Contrats', to: '/contrats', icon: DescriptionOutlinedIcon },
  { label: 'Réception', to: '/reception', icon: LocalShippingOutlinedIcon },
  { label: 'Expéditions', to: '/expeditions', icon: Inventory2OutlinedIcon },
  { label: 'Stock', to: '/stock', icon: WarehouseOutlinedIcon },
  { label: 'Tiers', to: '/tiers', icon: GroupsOutlinedIcon },
  { label: 'Comptes utilisateurs', to: '/comptes-utilisateurs', icon: AccountCircleOutlinedIcon },
  { label: 'Notifications', to: '/notifications', icon: NotificationsOutlinedIcon, badge: 3 },
  { label: 'Rapports', to: '/rapports', icon: BarChartOutlinedIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <Box
      component="nav"
      sx={{
        width: 272,
        flexShrink: 0,
        bgcolor: '#F2EFE6',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        py: 3.5,
        minHeight: '100vh',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, pb: 3.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: 'primary.main',
            color: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
          }}
        >
          N
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.dark' }}>
          NKIKO
        </Typography>
      </Box>

      <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {NAV_ITEMS.map(({ label, to, icon: Icon, badge }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={to === '/'}
            sx={{
              borderRadius: '12px',
              py: 1.1,
              px: 1.75,
              '&.active': {
                bgcolor: 'primary.light',
                color: 'success.main',
                fontWeight: 600,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 'inherit' }}
            />
            {badge ? (
              <Badge
                badgeContent={badge}
                color="error"
                sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
              />
            ) : null}
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flex: 1 }} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.75,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 1,
        }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 13 }}>
          {initials}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {user?.username}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user?.role_display ?? '—'}
          </Typography>
        </Box>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: '8px', px: 1, py: 0.5, minWidth: 'auto' }}
        >
          <Typography variant="caption" fontWeight={600}>
            Quitter
          </Typography>
        </ListItemButton>
      </Box>
    </Box>
  );
}
