import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import api from '../api/client';
import CompteUtilisateurFormDialog from './comptes/CompteUtilisateurFormDialog';

const ROLE_CHIP = {
  ADMINISTRATEUR: { label: 'Administrateur', bgcolor: 'success.light', color: 'success.main' },
  CHEF_DEPOT: { label: 'Chef de dépôt', bgcolor: 'secondary.light', color: 'secondary.main' },
  AGENT_TRANSIT: { label: 'Agent de transit', bgcolor: '#F1EFE6', color: '#5B5A4E' },
};

export default function ComptesUtilisateursPage() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState(null);

  async function loadList() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('comptes-utilisateurs/');
      setComptes(data);
    } catch {
      setError('Impossible de charger les comptes utilisateurs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  function openCreate() {
    setEditingCompte(null);
    setDialogOpen(true);
  }

  function openEdit(c) {
    setEditingCompte(c);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Comptes utilisateurs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Comptes internes (Administrateur, Chef de dépôt, Agent de transit) — réservé à l'Administrateur
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau compte
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.6fr 1.6fr 0.9fr', px: 3, py: 1.5, bgcolor: '#F7F5EE' }}>
          {["Nom d'utilisateur", 'Rôle', 'Actions'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {comptes.map((c) => {
          const chip = ROLE_CHIP[c.role];
          return (
            <Box
              key={c.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.6fr 0.9fr',
                alignItems: 'center',
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" fontWeight={600}>{c.username}</Typography>
              <Chip
                label={chip.label}
                size="small"
                sx={{ bgcolor: chip.bgcolor, color: chip.color, fontWeight: 700, width: 'fit-content' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Modifier le rôle">
                  <IconButton size="small" onClick={() => openEdit(c)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Paper>

      <CompteUtilisateurFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        compte={editingCompte}
        onSaved={loadList}
      />
    </Box>
  );
}
