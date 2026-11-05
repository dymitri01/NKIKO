import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../utils/apiError';

function Section({ title, items, renderItem, emptyLabel }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {title} {items.length > 0 && `(${items.length})`}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {items.map(renderItem)}
        </Box>
      )}
    </Box>
  );
}

function NotificationCard({ titre, sousTitre, actions }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
      }}
    >
      <Box>
        <Typography variant="body2" fontWeight={600}>{titre}</Typography>
        <Typography variant="caption" color="text.secondary">{sousTitre}</Typography>
      </Box>
      {actions}
    </Paper>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const canApprove = user?.is_superuser || ['ADMINISTRATEUR', 'CHEF_DEPOT'].includes(user?.role);

  const [contrats, setContrats] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [chargements, setChargements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [contratsRes, receptionsRes, chargementsRes] = await Promise.all([
        api.get('contrats/?statut=EN_ATTENTE'),
        api.get('lettres-voiture/?statut=EN_ATTENTE_APPROBATION'),
        api.get('chargements/?statut=EN_ATTENTE_APPROBATION'),
      ]);
      setContrats(contratsRes.data);
      setReceptions(receptionsRes.data);
      setChargements(chargementsRes.data);
    } catch {
      setError('Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAction(resource, id, action) {
    setActionError('');
    try {
      await api.post(`${resource}/${id}/${action}/`);
      loadAll();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {canApprove
            ? "Contrats et modifications de réceptions/chargements en attente d'approbation"
            : "Suivi de ce qui est en attente d'approbation par le Chef de dépôt"}
        </Typography>
      </Box>

      <Section
        title="Contrats en attente de validation"
        items={contrats}
        emptyLabel="Aucun contrat en attente."
        renderItem={(c) => (
          <NotificationCard
            key={c.id}
            titre={`${c.numero_contrat} — ${c.client_nom}`}
            sousTitre={`${c.marchandise_nom} — volume autorisé ${parseFloat(c.volume_total_autorise).toFixed(1)} m³`}
            actions={
              canApprove && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                    onClick={() => handleAction('contrats', c.id, 'valider')}
                  >
                    Valider
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<HighlightOffIcon fontSize="small" />}
                    onClick={() => handleAction('contrats', c.id, 'rejeter')}
                  >
                    Rejeter
                  </Button>
                </Box>
              )
            }
          />
        )}
      />

      <Section
        title="Réceptions en attente d'approbation de modification"
        items={receptions}
        emptyLabel="Aucune réception en attente."
        renderItem={(lv) => (
          <NotificationCard
            key={lv.id}
            titre={`${lv.numero_lettre_voiture} — ${lv.client_nom}`}
            sousTitre={`Transporteur : ${lv.transporteur_nom} — arrivée le ${new Date(lv.date_arrivee).toLocaleDateString('fr-FR')}`}
            actions={
              canApprove && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                    onClick={() => handleAction('lettres-voiture', lv.id, 'autoriser_modification')}
                  >
                    Autoriser
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<HighlightOffIcon fontSize="small" />}
                    onClick={() => handleAction('lettres-voiture', lv.id, 'refuser_modification')}
                  >
                    Refuser
                  </Button>
                </Box>
              )
            }
          />
        )}
      />

      <Section
        title="Chargements en attente d'approbation de modification"
        items={chargements}
        emptyLabel="Aucun chargement en attente."
        renderItem={(c) => (
          <NotificationCard
            key={c.id}
            titre={`${c.numero_dex} — ${c.destination}`}
            sousTitre={`Moyen de transport : ${c.moyen_transport_numero}`}
            actions={
              canApprove && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                    onClick={() => handleAction('chargements', c.id, 'autoriser_modification')}
                  >
                    Autoriser
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<HighlightOffIcon fontSize="small" />}
                    onClick={() => handleAction('chargements', c.id, 'refuser_modification')}
                  >
                    Refuser
                  </Button>
                </Box>
              )
            }
          />
        )}
      />

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={6000}
        onClose={() => setActionError('')}
        message={actionError}
      />
    </Box>
  );
}
