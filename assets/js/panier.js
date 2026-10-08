// Le module panier/commande est conservé pour une éventuelle réactivation future,
// mais il est désactivé pour la version vitrine autonome.

window.ajouterProduit = () => {};
window.supprimerProduit = () => {};
window.modifierQuantite = () => {};
window.viderPanier = () => [];
window.calculerTotal = () => 0;
window.sauvegarderPanier = () => [];
window.chargerPanier = () => [];
window.renderPanier = () => {};
window.getPanier = () => [];
window.updateCartBadge = () => {};
window.validerCommande = async () => null;
window.validateOrder = async () => null;
window.createOrder = async () => null;
window.saveOrder = async () => null;
window.submitOrder = async () => null;
window.checkout = async () => null;

    }[field];
    const input = document.getElementById(inputId);
    if (input) {
      input.required = isDelivery;
      input.setCustomValidity('');
    }
  });
  renderPanier();
}

async function prefillDeliveryAddressFromProfile() {
  const status = document.getElementById('delivery-profile-status');
  if (!status) return;
  if (!window.supabaseClient || !window.mcaAuth?.getUser) {
    status.textContent = 'Profil indisponible. Vous pouvez saisir une adresse de livraison ci-dessous.';
    return;
  }

  const { data: sessionData, error: sessionError } = await window.mcaAuth.getSession();
  if (sessionError) {
    console.error('[checkout] failed to check session for delivery address', sessionError);
    status.textContent = 'Impossible de vérifier votre session. Vous pouvez saisir une adresse ci-dessous.';
    return;
  }
  if (!sessionData?.session) {
    status.textContent = 'Connectez-vous pour préremplir votre adresse, ou saisissez-la ci-dessous.';
    return;
  }

  const { data: userData, error: userError } = await window.mcaAuth.getUser();
  if (userError) {
    console.error('[checkout] failed to read current user for delivery address', userError);
    status.textContent = 'Profil indisponible. Vous pouvez saisir une adresse de livraison ci-dessous.';
    return;
  }
  if (!userData?.user) {
    status.textContent = 'Connectez-vous pour préremplir votre adresse, ou saisissez-la ci-dessous.';
    return;
  }

  const { data: profile, error } = await window.supabaseClient
    .from('profils')
    .select('adresse, code_postal, ville, pays')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) {
    console.error('[checkout] failed to load delivery profile', error);
    status.textContent = 'Impossible de charger votre profil. Vous pouvez saisir votre adresse ci-dessous.';
    return;
  }

  const addressValues = {
    'delivery-address': profile?.adresse,
    'delivery-postal-code': profile?.code_postal,
    'delivery-city': profile?.ville,
    'delivery-country': profile?.pays
  };
  Object.entries(addressValues).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && !input.value) input.value = value || '';
  });
  status.textContent = profile?.adresse
    ? 'Adresse préremplie depuis votre profil. Vous pouvez la modifier pour cette commande.'
    : 'Aucune adresse enregistrée dans votre profil. Renseignez votre adresse de livraison.';
}

function renderPanier() {
  const panier = getPanier();
  const cartList = document.getElementById('cartList');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const subtotalValue = document.getElementById('subtotalValue');
  const totalValue = document.getElementById('totalValue');
  const shippingValue = document.getElementById('shippingValue');

  const totalGeneral = calculerTotal();
  const livraison = getDeliveryFee(totalGeneral);
  const montantFinal = totalGeneral + livraison;
  const totalArticles = panier.reduce((sum, item) => sum + Number(item.quantite || 0), 0);

  if (cartCountBadge) {
    cartCountBadge.textContent = `${totalArticles} article${totalArticles > 1 ? 's' : ''}`;
  }

  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    badge.textContent = String(totalArticles);
    badge.setAttribute('aria-label', `${totalArticles} article${totalArticles > 1 ? 's' : ''} dans le panier`);
    badge.hidden = totalArticles === 0;
  });

  if (!cartList) return;

  if (!panier.length) {
    cartList.innerHTML = `
      <div class="card border-0 bg-light">
        <div class="card-body py-5 text-center text-muted">
          <i class="fa-solid fa-bag-shopping fa-2x mb-3" aria-hidden="true"></i>
          <p class="mb-0">Votre panier est vide.</p>
        </div>
      </div>
    `;

    if (subtotalValue) subtotalValue.textContent = formatPrix(0);
    if (shippingValue) shippingValue.textContent = formatPrix(0);
    if (totalValue) totalValue.textContent = formatPrix(0);
    return;
  }

  cartList.innerHTML = panier.map((item) => {
    const ligne = (Number(item.prix) || 0) * (Number(item.quantite) || 0);
    const id = echapperHtml(item.id);
    const nom = echapperHtml(item.nom);
    const image = echapperHtml(item.image || 'https://placehold.co/120x120/f5f5f5/111111?text=Produit');
    return `
      <article class="card mb-3" data-id="${id}">
        <div class="card-body d-flex flex-column flex-md-row align-items-md-center gap-3">
          <img src="${image}" alt="${nom}" class="rounded" style="width:76px;height:76px;object-fit:cover;" />
          <div class="cart-item-details flex-grow-1">
            <div class="cart-item-title">${nom}</div>
            <div class="cart-item-price">${formatPrix(item.prix)} / unité</div>
            <div class="qty-controls">
              <button class="qty-btn" data-action="minus" data-id="${id}" type="button" aria-label="Diminuer la quantité" ${item.quantite <= 1 ? 'disabled' : ''}>−</button>
              <span class="qty-value">${item.quantite}</span>
              <button class="qty-btn" data-action="plus" data-id="${id}" type="button" aria-label="Augmenter la quantité">+</button>
            </div>
          </div>
          <div class="text-md-end ms-md-auto">
            <div class="fw-bold mb-2">${formatPrix(ligne)}</div>
            <button class="btn btn-link text-danger p-0 remove-btn" data-id="${id}" type="button">Supprimer</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  if (subtotalValue) subtotalValue.textContent = formatPrix(totalGeneral);
  if (shippingValue) shippingValue.textContent = formatPrix(livraison);
  if (totalValue) totalValue.textContent = formatPrix(montantFinal);

  cartList.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const action = button.dataset.action;
      const currentItem = panier.find((item) => String(item.id) === String(id));
      if (!currentItem) return;
      const nextQty = action === 'plus' ? currentItem.quantite + 1 : Math.max(1, currentItem.quantite - 1);
      if (nextQty === currentItem.quantite) return;
      modifierQuantite(id, nextQty);
    });
  });

  cartList.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => {
      supprimerProduit(button.dataset.id);
    });
  });
}

function chargerPanier() {
  return getPanier();
}

function getCurrentUserForCheckout() {
  return window.mcaAuth?.getUser ? window.mcaAuth.getUser() : Promise.resolve({ data: { user: null }, error: { message: 'Supabase Auth indisponible.' } });
}

async function validateCartStock(cartItems = []) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  const validations = [];

  for (const item of items) {
    const productId = Number(item.id ?? item.product_id ?? 0);
    const quantity = Number(item.quantite ?? item.quantity ?? 1);

    if (!productId) {
      throw new Error('Produit invalide dans le panier pour la validation du stock.');
    }

    const { data: product, error } = await window.supabaseClient
      .from('produits')
      .select('id, nom, stock, stock_min')
      .eq('id', productId)
      .maybeSingle();

    console.log('[orders] stock validation lookup', {
      productId,
      quantity,
      product,
      error
    });

    if (error) {
      throw normalizeOrderError(error);
    }

    if (!product) {
      throw new Error(`Produit #${productId} introuvable dans la table produits.`);
    }

    const availableStock = Number(product.stock ?? 0);
    const stockMin = Number(product.stock_min ?? 0);
    const requestedQty = Number(quantity || 0);
    const nextStock = availableStock - requestedQty;

    console.log('[orders] stock validation result', {
      productId,
      productName: product.nom,
      availableStock,
      stockMin,
      requestedQty,
      nextStock,
      isOutOfStock: availableStock === 0,
      isLowStock: availableStock <= stockMin
    });

    if (requestedQty > availableStock) {
      throw new Error(`Stock insuffisant pour « ${product.nom || 'ce produit'} » : disponible ${availableStock}, demandé ${requestedQty}.`);
    }

    validations.push({
      productId,
      productName: product.nom || 'Produit',
      currentStock: availableStock,
      stockMin,
      requestedQty,
      nextStock
    });
  }

  return validations;
}

async function decrementProductStockFromCart(cartItems = []) {
  const items = Array.isArray(cartItems) ? cartItems : [];

  for (const item of items) {
    const productId = Number(item.id ?? item.product_id ?? 0);
    const quantity = Number(item.quantite ?? item.quantity ?? 1);

    if (!productId || quantity <= 0) continue;

    const rpcPayload = {
      product_id: productId,
      quantity
    };

    console.log('[RPC] decrement_stock called');
    console.log('[RPC] payload', rpcPayload);

    const { data, error } = await window.supabaseClient.rpc('decrement_stock', rpcPayload);

    const rpcResult = Array.isArray(data) ? data[0] : data;

    console.log('[RPC] result', data);
    console.log('[RPC] error', error);

    console.log('[orders] decrementProductStock update result', {
      produitConcerne: {
        id: productId,
        nom: rpcResult?.nom || item.nom || item.name || null
      },
      stockAvant: rpcResult?.stock_avant ?? null,
      stockApres: rpcResult?.stock_apres ?? null,
      resultatUpdateSupabase: data,
      erreurComplete: error
        ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            fullError: error
          }
        : null
    });

    if (!error && !rpcResult) {
      console.warn('[orders] decrementProductStock possible RLS block on produits update', {
        produitConcerne: {
          id: productId,
          nom: item.nom || item.name || null
        },
        resultatUpdateSupabase: data,
        erreurComplete: error,
        diagnostic: 'Aucune ligne retournée par la RPC decrement_stock. Vérifiez les droits EXECUTE et la fonction SQL.'
      });
    }

    if (error) {
      throw error;
    }

    if (!rpcResult) {
      throw new Error(`La décrémentation du stock n'a retourné aucun résultat pour le produit #${productId}.`);
    }
  }
}

async function createOrder({ userId, total, statut = 'En attente', deliveryDetails = getDeliveryDetails() }) {
  if (!userId) {
    throw new Error('Utilisateur non connecté pour créer une commande.');
  }

  const payload = {
    user_id: userId,
    total: Number(total) || 0,
    statut,
    ...deliveryDetails,
    created_at: new Date().toISOString()
  };

  console.log('[orders] createOrder payload', payload);
  console.log('[orders] createOrder before insert into commandes', {
    table: 'commandes',
    payload
  });

  const { data, error } = await window.supabaseClient
    .from('commandes')
    .insert([payload])
    .select()
    .single();

  console.log('[orders] createOrder response', { data, error });

  if (error) {
    throw error;
  }

  return data;
}

async function saveOrder({ userId, total, statut = 'En attente', deliveryDetails }) {
  return createOrder({ userId, total, statut, deliveryDetails });
}

async function triggerOrderEmails(orderId) {
  if (!orderId || !window.supabaseClient?.functions?.invoke) return null;

  const payload = { orderId };

  console.log('[EMAIL] before invoke');
  console.log('[EMAIL] payload', payload);

  const response = await window.supabaseClient.functions.invoke('send-order-emails', {
    body: payload
  });

  console.log('[EMAIL] response', response.data);
  console.log('[EMAIL] error', response.error);

  if (response.error) {
    throw normalizeOrderError(response.error);
  }

  return response.data;
}

async function submitOrder(cartItems = [], userId = null) {
  const safeItems = Array.isArray(cartItems) ? cartItems : [];
  const activeUserId = userId || (await getCurrentUserForCheckout()).data?.user?.id;

  if (!activeUserId) {
    throw new Error('Vous devez être connecté pour valider une commande.');
  }

  const stockChecks = await validateCartStock(safeItems);
  console.log('[orders] submitOrder stock validation checks', stockChecks);

  const subtotal = safeItems.reduce((sum, item) => {
    const price = Number(item.prix ?? item.price ?? 0);
    const quantity = Number(item.quantite ?? item.quantity ?? 1);
    return sum + price * quantity;
  }, 0);
  const deliveryDetails = getDeliveryDetails();
  const total = subtotal + getDeliveryFee(subtotal, deliveryDetails.mode_retrait);

  const order = await createOrder({ userId: activeUserId, total, statut: 'En attente', deliveryDetails });

  const details = safeItems.map((item) => ({
    commande_id: order.id,
    produit_id: Number(item.id) || item.id,
    quantite: Number(item.quantite ?? item.quantity ?? 1),
    prix: Number(item.prix ?? item.price ?? 0)
  }));

  console.log('[orders] submitOrder details payload', details);
  console.log('[orders] submitOrder before insert into commande_details', {
    table: 'commande_details',
    details
  });

  const { data, error } = await window.supabaseClient
    .from('commande_details')
    .insert(details)
    .select();

  console.log('[orders] submitOrder details response', { data, error });

  if (error) {
    throw error;
  }

  await decrementProductStockFromCart(safeItems);

  try {
    await window.mcaInvoices?.ensureInvoiceForOrderId?.(order.id);
  } catch (invoiceError) {
    console.error('[invoice] automatic generation failed after submitOrder', invoiceError);
  }

  try {
    await triggerOrderEmails(order.id);
  } catch (emailError) {
    console.error('[emails] automatic sending failed after submitOrder', emailError);
  }

  return { order, items: data || details };
}

async function checkout() {
  const panier = getPanier();

  if (!panier.length) {
    window.alert('Votre panier est vide.');
    return null;
  }

  if (!window.supabaseClient) {
    window.alert('La connexion Supabase est indisponible.');
    return null;
  }

  try {
    const { data: userData, error: userError } = await getCurrentUserForCheckout();

    if (userError || !userData?.user) {
      window.location.href = 'login.html?redirect=panier.html';
      return null;
    }

    const result = await submitOrder(panier, userData.user.id);
    viderPanier();
    window.location.href = `confirmation.html?order_id=${encodeURIComponent(result.order.id)}`;
    return result;
  } catch (error) {
    const normalizedError = normalizeOrderError(error);
    console.error('[orders] checkout failed', normalizedError);
    window.alert(`La commande n’a pas pu être enregistrée : ${normalizedError.message || 'erreur inconnue'}`);
    return null;
  }
}

async function validateOrder(cartItems = [], userId = null) {
  const panier = Array.isArray(cartItems) && cartItems.length ? cartItems : getPanier();

  if (!panier.length) {
    window.alert('Votre panier est vide.');
    return null;
  }

  if (!window.supabaseClient) {
    window.alert('La connexion Supabase est indisponible.');
    return null;
  }

  try {
    const { data: userData, error: userError } = userId
      ? { data: { user: { id: userId } }, error: null }
      : await getCurrentUserForCheckout();

    if (userError || !userData?.user) {
      window.location.href = 'login.html?redirect=panier.html';
      return null;
    }

    const activeUserId = userId || userData.user.id;
    const stockChecks = await validateCartStock(panier);
    console.log('[orders] validateOrder stock validation checks', stockChecks);

    const subtotal = Number(panier.reduce((sum, item) => {
      const price = Number(item.prix ?? item.price ?? 0);
      const quantity = Number(item.quantite ?? item.quantity ?? 1);
      return sum + price * quantity;
    }, 0)) || 0;
    const deliveryDetails = getDeliveryDetails();
    const total = subtotal + getDeliveryFee(subtotal, deliveryDetails.mode_retrait);

    const orderPayload = {
      user_id: activeUserId,
      total,
      statut: 'En attente',
      ...deliveryDetails,
      created_at: new Date().toISOString()
    };

    console.log('[orders] validateOrder payload', orderPayload);
    console.log('[orders] validateOrder before insert into commandes', {
      table: 'commandes',
      payload: orderPayload
    });

    const { data: commande, error: commandeError } = await window.supabaseClient
      .from('commandes')
      .insert([orderPayload])
      .select()
      .single();

    console.log('[orders] validateOrder response', { data: commande, error: commandeError });

    if (commandeError) {
      throw commandeError;
    }

    const details = panier.map((item) => ({
      commande_id: commande.id,
      produit_id: Number(item.id) || item.id,
      quantite: Number(item.quantite || item.quantity || 1),
      prix: Number(item.prix || item.price || 0)
    }));

    console.log('[orders] validateOrder details payload', details);
    console.log('[orders] validateOrder before insert into commande_details', {
      table: 'commande_details',
      details
    });

    const { error: detailsError } = await window.supabaseClient
      .from('commande_details')
      .insert(details);

    console.log('[orders] validateOrder details response', { error: detailsError });

    if (detailsError) {
      throw detailsError;
    }

    await decrementProductStockFromCart(panier);

    try {
      await window.mcaInvoices?.ensureInvoiceForOrderId?.(commande.id);
    } catch (invoiceError) {
      console.error('[invoice] automatic generation failed after validateOrder', invoiceError);
    }

    try {
      await triggerOrderEmails(commande.id);
    } catch (emailError) {
      console.error('[emails] automatic sending failed after validateOrder', emailError);
    }

    viderPanier();
    window.location.href = `confirmation.html?order_id=${encodeURIComponent(commande.id)}`;
    return { order: commande, items: details };
  } catch (error) {
    const normalizedError = normalizeOrderError(error);
    console.error('[orders] validation failed', normalizedError);
    window.alert(`La commande n’a pas pu être enregistrée : ${normalizedError.message || 'erreur inconnue'}`);
    return null;
  }
}

async function validerCommande() {
  return validateOrder();
}

window.ajouterProduit = ajouterProduit;
window.supprimerProduit = supprimerProduit;
window.modifierQuantite = modifierQuantite;
window.viderPanier = viderPanier;
window.calculerTotal = calculerTotal;
window.sauvegarderPanier = sauvegarderPanier;
window.chargerPanier = chargerPanier;
window.renderPanier = renderPanier;
window.getPanier = getPanier;
window.updateCartBadge = () => renderPanier();
window.validerCommande = validerCommande;
window.validateOrder = validateOrder;
window.createOrder = createOrder;
window.saveOrder = saveOrder;
window.submitOrder = submitOrder;
window.checkout = checkout;

document.addEventListener('DOMContentLoaded', () => {
  const cartList = document.getElementById('cartList');
  const emptyCartBtn = document.getElementById('emptyCartBtn');
  const validateOrderButton = document.getElementById('validate-order-button');

  document.querySelectorAll('input[name="mode_retrait"]').forEach((input) => {
    input.addEventListener('change', updateDeliveryAddressVisibility);
  });
  DELIVERY_PROFILE_FIELDS.forEach((field) => {
    const inputId = {
      adresse_livraison: 'delivery-address',
      code_postal: 'delivery-postal-code',
      ville: 'delivery-city',
      pays: 'delivery-country'
    }[field];
    document.getElementById(inputId)?.addEventListener('input', (event) => {
      event.currentTarget.setCustomValidity('');
    });
  });
  updateDeliveryAddressVisibility();
  prefillDeliveryAddressFromProfile();

  if (emptyCartBtn) {
    emptyCartBtn.addEventListener('click', () => {
      viderPanier();
    });
  }

  if (validateOrderButton) {
    validateOrderButton.addEventListener('click', () => {
      validerCommande();
    });
  }

  if (cartList) {
    renderPanier();
  } else {
    renderPanier();
  }
});

window.addEventListener('storage', (event) => {
  if (STORAGE_KEYS.includes(event.key)) renderPanier();
});
