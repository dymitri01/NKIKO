import { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import api from '../../api/client';
import { extractErrorMessage } from '../../utils/apiError';

const EMPTY_GENERALE = {
  numero_bl: '',
  client: '',
  trajet: '',
  date_arrivee: '',
  chargeur: '',
  transporteur: '',
  chauffeur: '',
  immatriculation_camion: '',
  pays_provenance: '',
};

function calcVolume(longueur, diametre) {
  const L = parseFloat(longueur) || 0;
  const D = parseFloat(diametre) || 0;
  return (Math.PI * (D / 2) ** 2 * L).toFixed(2);
}

let tempIdCounter = 0;
function nextTempId() {
  tempIdCounter += 1;
  return `temp-${tempIdCounter}`;
}

export default function ReceptionDrawer({ open, onClose, lettreVoiture, onSaved }) {
  const isEdit = Boolean(lettreVoiture);

  const [generale, setGenerale] = useState(EMPTY_GENERALE);
  const [clients, setClients] = useState([]);
  const [chargeurs, setChargeurs] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [contratsDuClient, setContratsDuClient] = useState([]);
  const [billes, setBilles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setBilles([]);

    api.get('tiers/').then(({ data }) => {
      setClients(data.filter((t) => t.categorie === 'CLIENT'));
      setChargeurs(data.filter((t) => t.categorie === 'CHARGEUR'));
      setTransporteurs(data.filter((t) => t.categorie === 'TRANSPORTEUR'));
    });

    if (lettreVoiture) {
      setGenerale({
        numero_bl: lettreVoiture.numero_bl,
        client: lettreVoiture.client,
        trajet: lettreVoiture.trajet,
        date_arrivee: lettreVoiture.date_arrivee,
        chargeur: lettreVoiture.chargeur,
        transporteur: lettreVoiture.transporteur,
        chauffeur: lettreVoiture.chauffeur,
        immatriculation_camion: lettreVoiture.immatriculation_camion,
        pays_provenance: lettreVoiture.pays_provenance,
      });
    } else {
      setGenerale(EMPTY_GENERALE);
    }
  }, [open, lettreVoiture]);

  useEffect(() => {
    if (!generale.client) {
      setContratsDuClient([]);
      return;
    }
    api
      .get(`contrats/?client=${generale.client}&statut=ACTIF`)
      .then(({ data }) => setContratsDuClient(data));
  }, [generale.client]);

  function handleGeneraleChange(field) {
    return (event) => setGenerale((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function addBille() {
    setBilles((prev) => [
      ...prev,
      { tempId: nextTempId(), numero_bille: '', contrat: '', longueur: '', diametre: '' },
    ]);
  }

  function updateBille(tempId, field, value) {
    setBilles((prev) =>
      prev.map((b) => (b.tempId === tempId ? { ...b, [field]: value } : b))
    );
  }

  function removeBille(tempId) {
    setBilles((prev) => prev.filter((b) => b.tempId !== tempId));
  }

  const totalNouveau = billes.reduce(
    (sum, b) => sum + (parseFloat(calcVolume(b.longueur, b.diametre)) || 0),
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let lvId;
      if (isEdit) {
        await api.patch(`lettres-voiture/${lettreVoiture.id}/`, generale);
        lvId = lettreVoiture.id;
      } else {
        const { data } = await api.post('lettres-voiture/', generale);
        lvId = data.id;
      }

      for (const b of billes) {
        await api.post('colis/', {
          lettre_voiture: lvId,
          contrat: b.contrat,
          numero_bille: b.numero_bille,
          longueur: b.longueur,
          diametre: b.diametre,
        });
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
              {isEdit ? `Modifier ${lettreVoiture.numero_lettre_voiture}` : 'Nouvelle réception'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Informations générales puis billes reçues
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
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
              gap: 2.25,
              mt: 1.5,
              mb: 4,
            }}
          >
            <TextField label="Numéro de BL" value={generale.numero_bl} onChange={handleGeneraleChange('numero_bl')} required />
            <TextField select label="Client" value={generale.client} onChange={handleGeneraleChange('client')} required>
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date d'arrivée"
              type="date"
              value={generale.date_arrivee}
              onChange={handleGeneraleChange('date_arrivee')}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField label="Trajet" value={generale.trajet} onChange={handleGeneraleChange('trajet')} required />
            <TextField label="Pays de provenance" value={generale.pays_provenance} onChange={handleGeneraleChange('pays_provenance')} required />
            <Box />
            <TextField select label="Chargeur" value={generale.chargeur} onChange={handleGeneraleChange('chargeur')} required>
              {chargeurs.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Transporteur" value={generale.transporteur} onChange={handleGeneraleChange('transporteur')} required>
              {transporteurs.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.nom}</MenuItem>
              ))}
            </TextField>
            <TextField label="Chauffeur" value={generale.chauffeur} onChange={handleGeneraleChange('chauffeur')} required />
            <TextField label="Immatriculation camion" value={generale.immatriculation_camion} onChange={handleGeneraleChange('immatriculation_camion')} required />
          </Box>

          {isEdit && lettreVoiture.colis?.length > 0 && (
            <>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Billes déjà enregistrées
              </Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mt: 1, mb: 3 }}>
                {lettreVoiture.colis.map((c) => (
                  <Box key={c.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', fontSize: 13 }}>
                    <span>{c.numero_bille}</span>
                    <span>{c.contrat_numero}</span>
                    <span style={{ fontStyle: 'italic', color: '#8A8976' }}>{c.marchandise_nom}</span>
                    <span>{c.volume} m³</span>
                  </Box>
                ))}
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700 }}>
              {isEdit ? 'Ajouter de nouvelles billes' : 'Billes reçues'}
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addBille}
              disabled={!generale.client}
              sx={{ bgcolor: 'secondary.light', color: 'secondary.main' }}
            >
              Ajouter une bille
            </Button>
          </Box>

          {!generale.client && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choisis un client ci-dessus pour pouvoir ajouter des billes (ça filtre les contrats disponibles).
            </Typography>
          )}

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 0.9fr 0.9fr 0.9fr 44px', px: 2, py: 1, bgcolor: '#F7F5EE' }}>
              {['N° bille', 'Contrat', 'Longueur (m)', 'Diamètre (m)', 'Volume (m³)', ''].map((h) => (
                <Typography key={h} variant="caption" fontWeight={700} color="text.secondary">
                  {h}
                </Typography>
              ))}
            </Box>

            {billes.map((b) => {
              const contrat = contratsDuClient.find((c) => c.id === b.contrat);
              return (
                <Box key={b.tempId} sx={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 0.9fr 0.9fr 0.9fr 44px', alignItems: 'center', px: 2, py: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                  <TextField
                    size="small"
                    value={b.numero_bille}
                    onChange={(e) => updateBille(b.tempId, 'numero_bille', e.target.value)}
                    required
                  />
                  <TextField
                    size="small"
                    select
                    value={b.contrat}
                    onChange={(e) => updateBille(b.tempId, 'contrat', e.target.value)}
                    required
                    helperText={contrat ? `Essence : ${contrat.marchandise_nom}` : ' '}
                  >
                    {contratsDuClient.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.numero_contrat} — {c.marchandise_nom} (restant {parseFloat(c.volume_total_restant).toFixed(1)} m³)
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    type="number"
                    value={b.longueur}
                    onChange={(e) => updateBille(b.tempId, 'longueur', e.target.value)}
                    required
                  />
                  <TextField
                    size="small"
                    type="number"
                    value={b.diametre}
                    onChange={(e) => updateBille(b.tempId, 'diametre', e.target.value)}
                    required
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {calcVolume(b.longueur, b.diametre)}
                  </Typography>
                  <IconButton size="small" onClick={() => removeBille(b.tempId)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 0.9fr 0.9fr 0.9fr 44px', px: 2, py: 1.25, bgcolor: '#F7F5EE', borderTop: '1px solid', borderColor: 'divider' }}>
              <Box /><Box /><Box />
              <Typography variant="caption" fontWeight={700} sx={{ alignSelf: 'center' }}>Total</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">{totalNouveau.toFixed(2)} m³</Typography>
              <Box />
            </Box>
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
