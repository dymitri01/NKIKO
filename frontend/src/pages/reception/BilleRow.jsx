import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';

export function calcVolume(longueur, diametre) {
  const L = parseFloat(longueur) || 0;
  const D = parseFloat(diametre) || 0;
  return (Math.PI * (D / 2) ** 2 * L).toFixed(2);
}

const GRID = '1fr 1.6fr 0.9fr 0.9fr 0.9fr 44px';

export function BilleRowHeader() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: GRID, px: 2, py: 1, bgcolor: '#F7F5EE' }}>
      {['N° bille', 'Contrat', 'Longueur (m)', 'Diamètre (m)', 'Volume (m³)', ''].map((h) => (
        <Typography key={h} variant="caption" fontWeight={700} color="text.secondary">
          {h}
        </Typography>
      ))}
    </Box>
  );
}

// `options` doit toujours contenir le contrat actuellement sélectionné sur
// la ligne, même s'il n'est plus "Actif" (sinon le <select> affiche une
// valeur invalide) — c'est à l'appelant de fournir cette liste fusionnée.
export function BilleRow({ value, options, onChange, onRemove }) {
  const contratCourant = options.find((c) => c.id === value.contrat);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
      <TextField
        size="small"
        value={value.numero_bille}
        onChange={(e) => onChange('numero_bille', e.target.value)}
        required
      />
      <TextField
        size="small"
        select
        value={value.contrat}
        onChange={(e) => onChange('contrat', e.target.value)}
        required
        helperText={contratCourant ? `Essence : ${contratCourant.marchandise_nom}` : ' '}
      >
        {options.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.numero_contrat} — {c.marchandise_nom}
            {c.volume_total_restant != null
              ? ` (restant ${parseFloat(c.volume_total_restant).toFixed(1)} m³)`
              : ''}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        type="number"
        value={value.longueur}
        onChange={(e) => onChange('longueur', e.target.value)}
        required
      />
      <TextField
        size="small"
        type="number"
        value={value.diametre}
        onChange={(e) => onChange('diametre', e.target.value)}
        required
      />
      <Typography variant="body2" fontWeight={600}>
        {calcVolume(value.longueur, value.diametre)}
      </Typography>
      <IconButton size="small" onClick={onRemove}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
