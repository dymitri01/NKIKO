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

const ROLES = [
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
  { value: 'CHEF_DEPOT', label: 'Chef de dépôt' },
  { value: 'AGENT_TRANSIT', label: 'Agent de transit' },
];

export default function CompteUtilisateurFormDialog({ open, onClose, compte, onSaved }) {
  const isEdit = Boolean(compte);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('AGENT_TRANSIT');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setUsername(compte?.username ?? '');
    setPassword('');
    setRole(compte?.role ?? 'AGENT_TRANSIT');
  }, [open, compte]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`comptes-utilisateurs/${compte.id}/`, { role });
      } else {
        await api.post('comptes-utilisateurs/', { username, password, role });
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
      <DialogTitle>{isEdit ? `Modifier ${compte.username}` : 'Nouveau compte utilisateur'}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isEdit}
            helperText={isEdit ? "Le nom d'utilisateur ne peut pas être changé depuis cet écran." : ' '}
          />

          {!isEdit && (
            <TextField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <TextField select label="Rôle" value={role} onChange={(e) => setRole(e.target.value)} required>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>
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
