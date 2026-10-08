// @ts-nocheck
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function escapeHtml(value: string) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char] as string));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'MCA Pièces Autos <onboarding@resend.dev>';
    const contactToEmail = Deno.env.get('CONTACT_TO_EMAIL') || 'contact@mcapiecesauto.fr';

    if (!resendApiKey) {
      console.error('[send-contact-email] RESEND_API_KEY manquante');
      return jsonResponse(500, { error: 'Configuration email indisponible.' });
    }

    const body = await request.json().catch(() => ({}));
    const nom = String(body?.nom || '').trim();
    const prenom = String(body?.prenom || '').trim();
    const telephone = String(body?.telephone || '').trim();
    const email = String(body?.email || '').trim();
    const message = String(body?.message || '').trim();

    if (!nom || !prenom || !telephone || !email || !message) {
      return jsonResponse(400, { error: 'Tous les champs sont obligatoires.' });
    }

    const html = `
      <div style="font-family:Inter,Segoe UI,sans-serif;max-width:680px;margin:0 auto;background:#ffffff;color:#0f172a;">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#111827,#1f2937);color:#ffffff;">
          <div style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">MCA Pièces Autos 38</div>
          <h1 style="margin:8px 0 0;font-size:28px;">Nouveau message de contact</h1>
        </div>
        <div style="padding:28px;">
          <p><strong>Nom :</strong> ${escapeHtml(nom)}</p>
          <p><strong>Prénom :</strong> ${escapeHtml(prenom)}</p>
          <p><strong>Téléphone :</strong> ${escapeHtml(telephone)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Message :</strong></p>
          <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>
    `;

    const text = [
      'Nouveau message de contact',
      `Nom : ${nom}`,
      `Prénom : ${prenom}`,
      `Téléphone : ${telephone}`,
      `Email : ${email}`,
      '',
      'Message :',
      message
    ].join('\n');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: contactToEmail,
        reply_to: email,
        subject: `Nouveau message contact - ${prenom} ${nom}`,
        html,
        text
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[send-contact-email] Resend API error', payload);
      return jsonResponse(500, { error: payload?.message || 'Échec de l’envoi du message.' });
    }

    return jsonResponse(200, {
      success: true,
      message: 'Votre message a bien été envoyé',
      emailId: payload?.id || null
    });
  } catch (error) {
    console.error('[send-contact-email] unexpected error', error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l’envoi du message.'
    });
  }
});
