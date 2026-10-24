// Les erreurs DRF arrivent sous des formes différentes selon où elles sont
// levées : un tableau de chaînes au niveau racine (ValidationError levée
// directement dans une vue/serializer), un objet {detail: "..."} (nos
// actions personnalisées, ou les erreurs de permission), ou un objet
// {champ: ["erreur"]} (validation standard d'un ModelSerializer).
export function extractErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return 'Une erreur réseau est survenue. Vérifie que le serveur est joignable.';
  }

  if (Array.isArray(data)) {
    return data.join(' ');
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.non_field_errors) {
    return data.non_field_errors.join(' ');
  }

  const fieldErrors = Object.entries(data)
    .map(([field, messages]) => `${field} : ${Array.isArray(messages) ? messages.join(' ') : messages}`)
    .join(' — ');

  return fieldErrors || 'Une erreur est survenue.';
}
