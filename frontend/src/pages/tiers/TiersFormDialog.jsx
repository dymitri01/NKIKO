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

const CATEGORIES = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'TRANSPORTEUR', label: 'Transporteur' },
  { value: 'CHARGEUR', label: 'Chargeur' },
];

const STATUTS = [
  { value: 'ACTIF', label: 'Actif' },
  { value: 'INACTIF', label: 'Inactif' },
];

const EMPTY_FORM = {
  nom: '',
  categorie: 'CLIENT',
  code: '',
  email: '',
  telephone: '',
  adresse: '',
  ville: '',
  pays: '',
  boite_postale: '',
  numero_fiscal: '',
  statut: 'ACTIF',
};

export default function TiersFormDialog({ open, onClose, tiers, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(tiers);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(tiers ? { ...EMPTY_FORM, ...tiers } : EMPTY_FORM);
  }, [open, tiers]);

  function handleChange(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`tiers/${tiers.id}/`, form);
      } else {
        await api.post('tiers/', form);
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
      <DialogTitle>{isEdit ? `Modifier ${tiers.nom}` : 'Nouveau tiers'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Nom" value={form.nom} onChange={handleChange('nom')} required sx={{ gridColumn: '1 / -1' }} />
            <TextField select label="Catégorie" value={form.categorie} onChange={handleChange('categorie')} required>
              {CATEGORIES.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Code" value={form.code} onChange={handleChange('code')} required />
            <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} />
            <TextField label="Téléphone" value={form.telephone} onChange={handleChange('telephone')} />
            <TextField label="Adresse" value={form.adresse} onChange={handleChange('adresse')} sx={{ gridColumn: '1 / -1' }} />
            <TextField label="Ville" value={form.ville} onChange={handleChange('ville')} />
            <TextField label="Pays" value={form.pays} onChange={handleChange('pays')} />
            <TextField label="Boîte postale" value={form.boite_postale} onChange={handleChange('boite_postale')} />
            <TextField label="Numéro fiscal" value={form.numero_fiscal} onChange={handleChange('numero_fiscal')} />
            <TextField select label="Statut" value={form.statut} onChange={handleChange('statut')} required>
              {STATUTS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
