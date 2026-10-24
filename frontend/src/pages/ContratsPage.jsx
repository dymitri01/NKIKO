import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../utils/apiError';
import ContratFormDialog from './contrats/ContratFormDialog';

const STATUT_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'EPUISE', label: 'Épuisé' },
];

const STATUT_CHIP = {
  EN_ATTENTE: { label: 'En attente', bgcolor: 'warning.light', color: 'warning.main' },
  ACTIF: { label: 'Actif', bgcolor: 'success.light', color: 'success.main' },
  EPUISE: { label: 'Épuisé', bgcolor: 'error.light', color: 'error.main' },
};

function progressColor(pct) {
  if (pct <= 15) return '#C4621B';
  if (pct <= 40) return '#8A5A00';
  return '#335C42';
}

export default function ContratsPage() {
  const { user } = useAuth();
  const canApprove = user?.is_superuser || ['ADMINISTRATEUR', 'CHEF_DEPOT'].includes(user?.role);

  const [contrats, setContrats] = useState([]);
  const [clients, setClients] = useState([]);
  const [marchandises, setMarchandises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContrat, setEditingContrat] = useState(null);
  const [actionError, setActionError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [contratsRes, tiersRes, marchandisesRes] = await Promise.all([
        api.get('contrats/'),
        api.get('tiers/'),
        api.get('marchandises/'),
      ]);
      setContrats(contratsRes.data);
      setClients(tiersRes.data.filter((t) => t.categorie === 'CLIENT'));
      setMarchandises(marchandisesRes.data);
    } catch {
      setError('Impossible de charger les contrats.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    return contrats.filter((c) => {
      if (statutFilter && c.statut !== statutFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.numero_contrat.toLowerCase().includes(q) ||
          c.client_nom.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contrats, statutFilter, search]);

  function openCreate() {
    setEditingContrat(null);
    setDialogOpen(true);
  }

  function openEdit(contrat) {
    setEditingContrat(contrat);
    setDialogOpen(true);
  }

  async function handleAction(contrat, action) {
    setActionError('');
    try {
      await api.post(`contrats/${contrat.id}/${action}/`);
      loadAll();
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
            Contrats
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {contrats.length} contrats au total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau contrat
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher un numéro, un client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: '1 1 260px', maxWidth: 340 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {STATUT_FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              onClick={() => setStatutFilter(f.value)}
              color={statutFilter === f.value ? 'primary' : 'default'}
              variant={statutFilter === f.value ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.6fr 1.1fr 1.6fr 1fr 1fr',
            px: 3,
            py: 1.5,
            bgcolor: '#F7F5EE',
          }}
        >
          {['Numéro', 'Client', 'Essence', 'Volume restant', 'Statut', 'Actions'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun contrat ne correspond.
            </Typography>
          </Box>
        )}

        {filtered.map((c) => {
          const autorise = parseFloat(c.volume_total_autorise) || 0;
          const restant = parseFloat(c.volume_total_restant) || 0;
          const pct = autorise > 0 ? (restant / autorise) * 100 : 0;
          const chip = STATUT_CHIP[c.statut];

          return (
            <Box
              key={c.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.6fr 1.1fr 1.6fr 1fr 1fr',
                alignItems: 'center',
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {c.numero_contrat}
              </Typography>
              <Typography variant="body2">{c.client_nom}</Typography>
              <Typography variant="body2">{c.marchandise_nom}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(pct, 100)}
                  sx={{
                    flex: 1,
                    maxWidth: 110,
                    height: 7,
                    borderRadius: 4,
                    bgcolor: '#EFEBDE',
                    '& .MuiLinearProgress-bar': { bgcolor: progressColor(pct), borderRadius: 4 },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {restant.toFixed(1)} m³
                </Typography>
              </Box>
              <Chip
                label={chip.label}
                size="small"
                sx={{ bgcolor: chip.bgcolor, color: chip.color, fontWeight: 700, width: 'fit-content' }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                {canApprove && c.statut === 'EN_ATTENTE' && (
                  <>
                    <Tooltip title="Valider">
                      <IconButton size="small" color="success" onClick={() => handleAction(c, 'valider')}>
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rejeter">
                      <IconButton size="small" color="error" onClick={() => handleAction(c, 'rejeter')}>
                        <HighlightOffIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                <Tooltip title="Modifier">
                  <IconButton size="small" onClick={() => openEdit(c)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Paper>

      <ContratFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        contrat={editingContrat}
        clients={clients}
        marchandises={marchandises}
        onSaved={loadAll}
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
