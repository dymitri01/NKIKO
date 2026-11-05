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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import api from '../api/client';
import TiersFormDialog from './tiers/TiersFormDialog';

const CATEGORIE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'TRANSPORTEUR', label: 'Transporteur' },
  { value: 'CHARGEUR', label: 'Chargeur' },
];

export default function TiersPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTiers, setEditingTiers] = useState(null);

  async function loadList() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('tiers/');
      setTiers(data);
    } catch {
      setError('Impossible de charger les tiers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  const filtered = useMemo(() => {
    return tiers.filter((t) => {
      if (categorieFilter && t.categorie !== categorieFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.nom.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tiers, categorieFilter, search]);

  function openCreate() {
    setEditingTiers(null);
    setDialogOpen(true);
  }

  function openEdit(t) {
    setEditingTiers(t);
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
            Tiers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {tiers.length} tiers au total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau tiers
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher un nom, un code…"
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
          {CATEGORIE_FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              onClick={() => setCategorieFilter(f.value)}
              color={categorieFilter === f.value ? 'primary' : 'default'}
              variant={categorieFilter === f.value ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.1fr 1fr 1.2fr 1fr 0.9fr 0.8fr',
            px: 3,
            py: 1.5,
            bgcolor: '#F7F5EE',
          }}
        >
          {['Nom', 'Catégorie', 'Code', 'Ville', 'Pays', 'Statut', 'Actions'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun tiers ne correspond.
            </Typography>
          </Box>
        )}

        {filtered.map((t) => (
          <Box
            key={t.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.1fr 1fr 1.2fr 1fr 0.9fr 0.8fr',
              alignItems: 'center',
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" fontWeight={600}>{t.nom}</Typography>
            <Typography variant="body2">{t.categorie}</Typography>
            <Typography variant="body2">{t.code}</Typography>
            <Typography variant="body2">{t.ville}</Typography>
            <Typography variant="body2">{t.pays}</Typography>
            <Chip
              label={t.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
              size="small"
              sx={{
                bgcolor: t.statut === 'ACTIF' ? 'success.light' : '#E7E4DC',
                color: t.statut === 'ACTIF' ? 'success.main' : '#4A4940',
                fontWeight: 700,
                width: 'fit-content',
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => openEdit(t)}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Paper>

      <TiersFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tiers={editingTiers}
        onSaved={loadList}
      />
    </Box>
  );
}
