import { useEffect, useMemo, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/client';
import { extractErrorMessage } from '../../utils/apiError';

const EMPTY_GENERALE = {
  numero_dex: '',
  date: '',
  destination: '',
  moyen_transport: '',
};

export default function ChargementDrawer({ open, onClose, chargement, onSaved }) {
  const isEdit = Boolean(chargement);

  const [generale, setGenerale] = useState(EMPTY_GENERALE);
  const [moyensTransport, setMoyensTransport] = useState([]);
  const [stock, setStock] = useState([]); // billes en stock, eligibles
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [originalIds, setOriginalIds] = useState(new Set());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');

    if (chargement) {
      setGenerale({
        numero_dex: chargement.numero_dex,
        date: chargement.date,
        destination: chargement.destination,
        moyen_transport: chargement.moyen_transport,
      });
      const attachedIds = new Set((chargement.colis_charges || []).map((c) => c.id));
      setSelectedIds(attachedIds);
      setOriginalIds(attachedIds);
    } else {
      setGenerale(EMPTY_GENERALE);
      setSelectedIds(new Set());
      setOriginalIds(new Set());
    }

    api.get('moyens-transport/').then(({ data }) => {
      const disponibles = data.filter((m) => m.statut === 'DISPONIBLE');
      if (chargement && !disponibles.some((m) => m.id === chargement.moyen_transport)) {
        disponibles.push({
          id: chargement.moyen_transport,
          numero: chargement.moyen_transport_numero,
          volume: null,
        });
      }
      setMoyensTransport(disponibles);
    });

    Promise.all([api.get('colis/'), api.get('lettres-voiture/')]).then(
      ([colisRes, lvRes]) => {
        const statutParLV = new Map(lvRes.data.map((lv) => [lv.id, lv.statut]));
        const dejaAttachees = chargement ? chargement.colis_charges || [] : [];
        const dejaAttacheesIds = new Set(dejaAttachees.map((c) => c.id));

        const disponibles = colisRes.data.filter(
          (c) =>
            (c.chargement === null && statutParLV.get(c.lettre_voiture) === 'CLOTURE') ||
            dejaAttacheesIds.has(c.id)
        );
        // On garantit que les billes déjà attachées (venant du nested
        // colis_charges, moins de champs) sont bien représentées avec
        // leurs infos complètes issues de /api/colis/.
        setStock(disponibles);
      }
    );
  }, [open, chargement]);

  function toggle(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleGeneraleChange(field) {
    return (event) => setGenerale((prev) => ({ ...prev, [field]: event.target.value }));
  }

  const selectedColis = useMemo(
    () => stock.filter((c) => selectedIds.has(c.id)),
    [stock, selectedIds]
  );
  const totalVolume = selectedColis.reduce((sum, c) => sum + (parseFloat(c.volume) || 0), 0);
  const moyenChoisi = moyensTransport.find((m) => m.id === generale.moyen_transport);
  const capacite = moyenChoisi?.volume != null ? parseFloat(moyenChoisi.volume) : null;
  const depasseCapacite = capacite != null && totalVolume > capacite;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let chargementId;
      if (isEdit) {
        await api.patch(`chargements/${chargement.id}/`, generale);
        chargementId = chargement.id;
      } else {
        const { data } = await api.post('chargements/', generale);
        chargementId = data.id;
      }

      const aAttacher = [...selectedIds].filter((id) => !originalIds.has(id));
      const aDetacher = [...originalIds].filter((id) => !selectedIds.has(id));

      for (const id of aAttacher) {
        await api.patch(`colis/${id}/`, { chargement: chargementId });
      }
      for (const id of aDetacher) {
        await api.patch(`colis/${id}/`, { chargement: null });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: { xs: '100vw', sm: '70vw' },
          maxWidth: 1010,
          minWidth: { sm: 620 },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? `Modifier ${chargement.numero_dex}` : 'Nouveau chargement'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Informations générales puis billes à charger
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 3.5 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Informations générales
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 2.25, mt: 1.5, mb: 2 }}>
            <TextField label="Numéro DEX" value={generale.numero_dex} onChange={handleGeneraleChange('numero_dex')} required />
            <TextField
              label="Date"
              type="date"
              value={generale.date}
              onChange={handleGeneraleChange('date')}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Destination" value={generale.destination} onChange={handleGeneraleChange('destination')} required />
            <TextField select label="Moyen de transport" value={generale.moyen_transport} onChange={handleGeneraleChange('moyen_transport')} required>
              {moyensTransport.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.numero} {m.volume != null ? `(capacité ${parseFloat(m.volume).toFixed(1)} m³)` : ''}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {capacite != null && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2" fontWeight={600}>
                  Volume sélectionné
                </Typography>
                <Typography variant="body2" fontWeight={600} color={depasseCapacite ? 'error.main' : 'success.main'}>
                  {totalVolume.toFixed(2)} / {capacite.toFixed(2)} m³
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((totalVolume / capacite) * 100, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#EFEBDE',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: depasseCapacite ? 'error.main' : 'success.main',
                    borderRadius: 4,
                  },
                }}
              />
              {depasseCapacite && (
                <Typography variant="caption" color="error.main">
                  Dépasse la capacité du moyen de transport — la clôture sera refusée tant que ce n'est pas corrigé.
                </Typography>
              )}
            </Box>
          )}

          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Billes disponibles en stock
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
            Seules les billes d'une réception déjà clôturée et pas encore chargées apparaissent ici.
          </Typography>

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '44px 1fr 1.2fr 1fr 1fr 0.9fr', px: 2, py: 1, bgcolor: '#F7F5EE' }}>
              {['', 'N° bille', 'Réception', 'Contrat', 'Essence', 'Volume (m³)'].map((h) => (
                <Typography key={h} variant="caption" fontWeight={700} color="text.secondary">
                  {h}
                </Typography>
              ))}
            </Box>

            {stock.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Aucune bille disponible pour l'instant.
                </Typography>
              </Box>
            )}

            {stock.map((c) => (
              <Box
                key={c.id}
                onClick={() => toggle(c.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 1.2fr 1fr 1fr 0.9fr',
                  alignItems: 'center',
                  px: 2,
                  py: 0.75,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  bgcolor: selectedIds.has(c.id) ? 'primary.light' : 'transparent',
                }}
              >
                <Checkbox size="small" checked={selectedIds.has(c.id)} onChange={() => toggle(c.id)} />
                <Typography variant="body2">{c.numero_bille}</Typography>
                <Typography variant="body2">{c.lettre_voiture_numero}</Typography>
                <Typography variant="body2">{c.contrat_numero}</Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  {c.marchandise_nom}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {c.volume}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, px: 4, py: 2.5 }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
