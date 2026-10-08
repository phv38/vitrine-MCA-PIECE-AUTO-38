document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const messageNode = document.getElementById('contact-form-message');
  if (!form) return;

  const setMessage = (message, isError = false) => {
    if (!messageNode) return;
    messageNode.textContent = message;
    messageNode.style.color = isError ? '#b91c1c' : '#047857';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      nom: String(formData.get('nom') || '').trim(),
      prenom: String(formData.get('prenom') || '').trim(),
      telephone: String(formData.get('telephone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      message: String(formData.get('message') || '').trim()
    };

    if (!payload.nom || !payload.prenom || !payload.telephone || !payload.email || !payload.message) {
      setMessage('Veuillez compléter tous les champs du formulaire.', true);
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    setMessage('Envoi en cours…');

    try {
      const { data, error } = await window.supabaseClient.functions.invoke('send-contact-email', {
        body: payload
      });

      if (error) throw error;

      setMessage(data?.message || 'Votre message a bien été envoyé.');
      form.reset();
    } catch (error) {
      console.error('[contact] send failed', error);
      setMessage(`Votre message n’a pas pu être envoyé : ${error?.message || 'erreur inconnue'}`, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});
