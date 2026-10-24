import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import api from '../../api/client';
import { extractErrorMessage } from '../../utils/apiError';

const TYPES = [
  { value: 'D15', label: 'D15' },
  { value: 'TITRE_PROVENANCE', label: 'Titre de provenance' },
];

const EMPTY_FORM = {
  client: '',
  type: 'D15',
  provenance: '',
  marchandise: '',
  volume_total_autorise: '',
};

export default function ContratFormDialog({ open, onClose, contrat, clients, marchandises, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(contrat);
  const isLocked =
    isEdit && contrat.volume_total_restant !== contrat.volume_total_autorise;

  useEffect(() => {
    if (!open) return;
    setError('');
    if (contrat) {
      setForm({
        client: contrat.client,
        type: contrat.type,
        provenance: contrat.provenance,
        marchandise: contrat.marchandise,
        volume_total_autorise: contrat.volume_total_autorise,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, contrat]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`contrats/${contrat.id}/`, form);
      } else {
        await api.post('contrats/', form);
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? `Modifier ${contrat.numero_contrat}` : 'Nouveau contrat'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {isLocked && (
            <Alert severity="warning">
              Ce contrat a déjà été consommé (au moins une réception enregistrée) et
              ne peut plus être modifié.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Client"
            value={form.client}
            onChange={handleChange('client')}
            required
            disabled={isLocked}
          >
            {clients.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nom}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type"
            value={form.type}
            onChange={handleChange('type')}
            required
            disabled={isLocked}
          >
            {TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Provenance"
            value={form.provenance}
            onChange={handleChange('provenance')}
            required
            disabled={isLocked}
          />

          <TextField
            select
            label="Essence (marchandise)"
            value={form.marchandise}
            onChange={handleChange('marchandise')}
            required
            disabled={isLocked}
          >
            {marchandises.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.nom}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Volume total autorisé (m³)"
            type="number"
            value={form.volume_total_autorise}
            onChange={handleChange('volume_total_autorise')}
            required
            disabled={isLocked}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting || isLocked}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
