import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import api from '../api/client';

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [essenceFilter, setEssenceFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [colisRes, lvRes] = await Promise.all([
          api.get('colis/'),
          api.get('lettres-voiture/'),
        ]);
        const statutParLV = new Map(lvRes.data.map((lv) => [lv.id, lv.statut]));
        const disponibles = colisRes.data.filter(
          (c) => c.chargement === null && statutParLV.get(c.lettre_voiture) === 'CLOTURE'
        );
        setStock(disponibles);
      } catch {
        setError('Impossible de charger le stock.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const parEssence = useMemo(() => {
    const map = new Map();
    for (const c of stock) {
      const key = c.marchandise_nom;
      const entry = map.get(key) || { nom: key, volume: 0, nbBilles: 0 };
      entry.volume += parseFloat(c.volume) || 0;
      entry.nbBilles += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.volume - a.volume);
  }, [stock]);

  const filtered = useMemo(() => {
    return stock.filter((c) => {
      if (essenceFilter && c.marchandise_nom !== essenceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.numero_bille.toLowerCase().includes(q) ||
          c.contrat_numero.toLowerCase().includes(q) ||
          c.lettre_voiture_numero.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stock, search, essenceFilter]);

  const totalVolume = stock.reduce((sum, c) => sum + (parseFloat(c.volume) || 0), 0);

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
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Stock
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {stock.length} billes en stock — {totalVolume.toFixed(2)} m³ au total
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {parEssence.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Aucune bille en stock pour l'instant.
          </Typography>
        )}
        {parEssence.map((e) => (
          <Paper
            key={e.nom}
            variant="outlined"
            onClick={() => setEssenceFilter(essenceFilter === e.nom ? '' : e.nom)}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              borderColor: essenceFilter === e.nom ? 'primary.main' : 'divider',
              borderWidth: essenceFilter === e.nom ? 2 : 1,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: 'secondary.light',
                color: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <WarehouseOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              {e.volume.toFixed(1)} m³
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {e.nom} — {e.nbBilles} billes
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher une bille, un contrat, une réception…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: '1 1 280px', maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        {essenceFilter && (
          <Chip label={essenceFilter} onDelete={() => setEssenceFilter('')} color="primary" />
        )}
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr 1.3fr 1.3fr 0.9fr',
            px: 3,
            py: 1.5,
            bgcolor: '#F7F5EE',
          }}
        >
          {['N° bille', 'Essence', 'Contrat', 'Réception', 'Volume (m³)'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucune bille ne correspond.
            </Typography>
          </Box>
        )}

        {filtered.map((c) => (
          <Box
            key={c.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr 1.3fr 1.3fr 0.9fr',
              alignItems: 'center',
              px: 3,
              py: 1.75,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {c.numero_bille}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {c.marchandise_nom}
            </Typography>
            <Typography variant="body2">{c.contrat_numero}</Typography>
            <Typography variant="body2">{c.lettre_voiture_numero}</Typography>
            <Typography variant="body2" fontWeight={600}>
              {c.volume}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
