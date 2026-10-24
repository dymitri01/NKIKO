import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, sub, subColor }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.75 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.75,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mt: 1.25, color: subColor }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function progressColor(pct) {
  if (pct <= 15) return '#C4621B';
  if (pct <= 40) return '#8A5A00';
  return '#335C42';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [contratsProches, setContratsProches] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [contratsActifsRes, colisRes, lettresVoitureRes, lvApprobRes, chgApprobRes] =
          await Promise.all([
            api.get('contrats/?statut=ACTIF'),
            api.get('colis/'),
            api.get('lettres-voiture/'),
            api.get('lettres-voiture/?statut=EN_ATTENTE_APPROBATION'),
            api.get('chargements/?statut=EN_ATTENTE_APPROBATION'),
          ]);
        if (cancelled) return;

        const contratsActifs = contratsActifsRes.data;

        const volumeStock = colisRes.data
          .filter((c) => c.chargement === null)
          .reduce((sum, c) => sum + (parseFloat(c.volume) || 0), 0);

        const now = new Date();
        const receptionsCeMois = lettresVoitureRes.data.filter((lv) => {
          const d = new Date(lv.date_arrivee);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        const enAttenteApprobation = lvApprobRes.data.length + chgApprobRes.data.length;

        const proches = contratsActifs
          .map((c) => {
            const autorise = parseFloat(c.volume_total_autorise) || 0;
            const restant = parseFloat(c.volume_total_restant) || 0;
            const pct = autorise > 0 ? (restant / autorise) * 100 : 0;
            return { ...c, pct, restant };
          })
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 4);

        setStats({
          contratsActifs: contratsActifs.length,
          volumeStock,
          receptionsCeMois,
          enAttenteApprobation,
        });
        setContratsProches(proches);
      } catch {
        if (!cancelled) setError('Impossible de charger les données du tableau de bord.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Bonjour, {user?.username}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        <KpiCard
          icon={DescriptionOutlinedIcon}
          iconBg="success.light"
          iconColor="success.main"
          value={stats.contratsActifs}
          label="Contrats actifs"
        />
        <KpiCard
          icon={WarehouseOutlinedIcon}
          iconBg="secondary.light"
          iconColor="secondary.main"
          value={`${stats.volumeStock.toFixed(1)} m³`}
          label="Volume en stock"
          sub="Billes non encore chargées"
          subColor="text.secondary"
        />
        <KpiCard
          icon={LocalShippingOutlinedIcon}
          iconBg="success.light"
          iconColor="success.main"
          value={stats.receptionsCeMois}
          label="Réceptions ce mois"
        />
        <KpiCard
          icon={NotificationsOutlinedIcon}
          iconBg="warning.light"
          iconColor="warning.main"
          value={stats.enAttenteApprobation}
          label="En attente d'approbation"
          sub={stats.enAttenteApprobation > 0 ? 'À traiter' : undefined}
          subColor="warning.main"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.25 }}>
            Contrats proches de l'épuisement
          </Typography>
          {contratsProches.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun contrat actif pour le moment.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
              {contratsProches.map((c) => (
                <Box key={c.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {c.numero_contrat} — {c.marchandise_nom}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ color: progressColor(c.pct) }}>
                      {c.pct.toFixed(0)} % restant
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(c.pct, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#EFEBDE',
                      '& .MuiLinearProgress-bar': { bgcolor: progressColor(c.pct), borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.25 }}>
            Activité récente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            À venir : ce bloc affichera les derniers événements (réceptions
            clôturées, contrats validés, chargements expédiés) une fois qu'un
            modèle de journal d'activité sera ajouté côté backend.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
