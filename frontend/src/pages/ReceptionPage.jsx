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
import Snackbar from '@mui/material/Snackbar';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../utils/apiError';
import ReceptionDrawer from './reception/ReceptionDrawer';

const STATUT_CHIP = {
  EN_ATTENTE: { label: 'En attente', bgcolor: 'warning.light', color: 'warning.main' },
  CLOTURE: { label: 'Clôturé', bgcolor: '#E7E4DC', color: '#4A4940' },
  EN_ATTENTE_APPROBATION: {
    label: "En attente d'approbation",
    bgcolor: '#F1EFE6',
    color: '#5B5A4E',
  },
};

export default function ReceptionPage() {
  const { user } = useAuth();
  const canApprove = user?.is_superuser || ['ADMINISTRATEUR', 'CHEF_DEPOT'].includes(user?.role);

  const [lettresVoiture, setLettresVoiture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLV, setEditingLV] = useState(null);

  async function loadList() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('lettres-voiture/');
      setLettresVoiture(data);
    } catch {
      setError('Impossible de charger les réceptions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  function openCreate() {
    setEditingLV(null);
    setDrawerOpen(true);
  }

  function openEdit(lv) {
    setEditingLV(lv);
    setDrawerOpen(true);
  }

  async function handleAction(lv, action) {
    setActionError('');
    try {
      await api.post(`lettres-voiture/${lv.id}/${action}/`);
      loadList();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleDownloadBordereau(lv) {
    setActionError('');
    try {
      const response = await api.get(`lettres-voiture/${lv.id}/bordereau/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
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
            Réception
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Historique des camions réceptionnés
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouvelle réception
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.8fr 1.4fr 1.1fr 1.5fr 1.2fr',
            px: 3,
            py: 1.5,
            bgcolor: '#F7F5EE',
          }}
        >
          {['N° lettre de voiture', 'Client', 'Transporteur', 'Arrivée', 'Statut', 'Actions'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {lettresVoiture.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucune réception enregistrée.
            </Typography>
          </Box>
        )}

        {lettresVoiture.map((lv) => {
          const chip = STATUT_CHIP[lv.statut];
          return (
            <Box
              key={lv.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.8fr 1.4fr 1.1fr 1.5fr 1.2fr',
                alignItems: 'center',
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {lv.numero_lettre_voiture}
              </Typography>
              <Typography variant="body2">{lv.client_nom}</Typography>
              <Typography variant="body2">{lv.transporteur_nom}</Typography>
              <Typography variant="body2">
                {new Date(lv.date_arrivee).toLocaleDateString('fr-FR')}
              </Typography>
              <Chip
                label={chip.label}
                size="small"
                sx={{ bgcolor: chip.bgcolor, color: chip.color, fontWeight: 700, width: 'fit-content' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                {lv.statut === 'CLOTURE' && (
                  <>
                    <Tooltip title="Voir le bordereau">
                      <IconButton size="small" onClick={() => handleDownloadBordereau(lv)}>
                        <PictureAsPdfOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Demander une modification">
                      <IconButton size="small" onClick={() => handleAction(lv, 'demander_modification')}>
                        <LockOpenOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {lv.statut === 'EN_ATTENTE_APPROBATION' && canApprove && (
                  <>
                    <Tooltip title="Autoriser la modification">
                      <IconButton size="small" color="success" onClick={() => handleAction(lv, 'autoriser_modification')}>
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refuser">
                      <IconButton size="small" color="error" onClick={() => handleAction(lv, 'refuser_modification')}>
                        <HighlightOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {lv.statut === 'EN_ATTENTE' && (
                  <>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => openEdit(lv)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Clôturer">
                      <IconButton size="small" color="success" onClick={() => handleAction(lv, 'cloturer')}>
                        <TaskAltOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Paper>

      <ReceptionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lettreVoiture={editingLV}
        onSaved={loadList}
      />

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={6000}
        onClose={() => setActionError('')}
        message={actionError}
      />
    </Box>
  );
}
