import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import api from '../api/client';

function KpiCard({ value, label, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.75 }}>
      <Typography variant="h5" fontWeight={700} sx={{ color: color || 'text.primary' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {label}
      </Typography>
    </Paper>
  );
}

function debutMois() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

export default function RapportsPage() {
  const [colis, setColis] = useState([]);
  const [lettresVoiture, setLettresVoiture] = useState([]);
  const [chargements, setChargements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateDebut, setDateDebut] = useState(debutMois());
  const [dateFin, setDateFin] = useState(aujourdhui());

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [colisRes, lvRes, chargRes] = await Promise.all([
          api.get('colis/'),
          api.get('lettres-voiture/'),
          api.get('chargements/'),
        ]);
        setColis(colisRes.data);
        setLettresVoiture(lvRes.data);
        setChargements(chargRes.data);
      } catch {
        setError('Impossible de charger les données du rapport.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rapport = useMemo(() => {
    const lvParId = new Map(lettresVoiture.map((lv) => [lv.id, lv]));
    const chargParId = new Map(chargements.map((c) => [c.id, c]));

    function dansLaPeriode(dateStr) {
      return dateStr >= dateDebut && dateStr <= dateFin;
    }

    const parEssence = new Map();
    function ajouter(essence, champ, volume) {
      const entry = parEssence.get(essence) || { nom: essence, recu: 0, expedie: 0 };
      entry[champ] += volume;
      parEssence.set(essence, entry);
    }

    let volumeRecu = 0;
    const receptionsClotureesVues = new Set();
    let volumeExpedie = 0;
    const chargementsClotureesVues = new Set();

    for (const c of colis) {
      const lv = lvParId.get(c.lettre_voiture);
      if (lv && lv.statut === 'CLOTURE' && dansLaPeriode(lv.date_arrivee)) {
        const v = parseFloat(c.volume) || 0;
        volumeRecu += v;
        ajouter(c.marchandise_nom, 'recu', v);
        receptionsClotureesVues.add(lv.id);
      }

      if (c.chargement) {
        const charg = chargParId.get(c.chargement);
        if (charg && charg.statut === 'CLOTURE' && dansLaPeriode(charg.date)) {
          const v = parseFloat(c.volume) || 0;
          volumeExpedie += v;
          ajouter(c.marchandise_nom, 'expedie', v);
          chargementsClotureesVues.add(charg.id);
        }
      }
    }

    return {
      volumeRecu,
      volumeExpedie,
      nbReceptions: receptionsClotureesVues.size,
      nbChargements: chargementsClotureesVues.size,
      parEssence: [...parEssence.values()].sort((a, b) => b.recu + b.expedie - (a.recu + a.expedie)),
    };
  }, [colis, lettresVoiture, chargements, dateDebut, dateFin]);

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
            Rapports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Volumes reçus et expédiés sur la période choisie
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            size="small"
            label="Du"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Au"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        <KpiCard value={`${rapport.volumeRecu.toFixed(2)} m³`} label="Volume reçu" color="success.main" />
        <KpiCard value={`${rapport.volumeExpedie.toFixed(2)} m³`} label="Volume expédié" color="secondary.main" />
        <KpiCard value={rapport.nbReceptions} label="Réceptions clôturées" />
        <KpiCard value={rapport.nbChargements} label="Chargements clôturés" />
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', px: 3, py: 1.5, bgcolor: '#F7F5EE' }}>
          {['Essence', 'Volume reçu (m³)', 'Volume expédié (m³)'].map((h) => (
            <Typography key={h} variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {h}
            </Typography>
          ))}
        </Box>

        {rapport.parEssence.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucun mouvement sur cette période.
            </Typography>
          </Box>
        )}

        {rapport.parEssence.map((e) => (
          <Box
            key={e.nom}
            sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', alignItems: 'center', px: 3, py: 1.75, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="body2" fontWeight={600}>{e.nom}</Typography>
            <Typography variant="body2" color="success.main" fontWeight={600}>{e.recu.toFixed(2)}</Typography>
            <Typography variant="body2" color="secondary.main" fontWeight={600}>{e.expedie.toFixed(2)}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
