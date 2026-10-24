import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PlaceholderPage({ title }) {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Cet écran sera construit dans une prochaine branche.
      </Typography>
    </Box>
  );
}
