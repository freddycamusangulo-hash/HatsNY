document.addEventListener('DOMContentLoaded', () => {

  // -----------------------------------------
  // 1. ESTADO DE DATOS (ahora viene de Firestore, no de localStorage)
  // -----------------------------------------
  let products = [];

  const defaultSettings = {
    announcement: '📍 Envíos rápidos en Coquimbo y La Serena (IV Región)',
    heroTitle: 'EL ESTILO QUE TE DEFINE',
    heroSubtitle: 'Gorros exclusivos con excelentes terminaciones y el mejor precio de la Cuarta Región.',
    aboutTitle: 'CALIDAD SIN COMPROMISOS EN COQUIMBO',
    aboutText: 'En Hats NY creemos que vestir elegante no debe costar una fortuna. Seleccionamos cada gorro pensando en el mejor precio de la Cuarta Región.',
    contactText: 'Escríbenos directo y te respondemos al tiro.',
    whatsapp: '',
    contactMeta: 'Coquimbo, Chile'
  };
  let settings = { ...defaultSettings };

  // Referencias DOM
  const productsGrid = document.getElementById('products-grid');
  const emptyCatalog = document.getElementById('empty-catalog');
  const adminProductsList = document.getElementById('admin-products-list');
  const loginModal = document.getElementById('login-modal');
  const adminView = document.getElementById('admin-view');
  const publicView = document.getElementById('public-view');

  // -----------------------------------------
  // 2. HELPERS
  // -----------------------------------------
  const clp = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

  const whatsappLink = (message) => {
    const phone = (settings.whatsapp || '').replace(/\D/g, '');
    if (!phone) return '#';
    const text = encodeURIComponent(message || '¡Hola! Tengo una consulta sobre sus gorros.');
    return `https://wa.me/${phone}?text=${text}`;
  };

  const stockInfo = (stock) => {
    const n = Number(stock) || 0;
    if (n <= 0) return { label: 'Agotado', cls: 'out' };
    if (n <= 3) return { label: `¡Quedan ${n}!`, cls: 'low' };
    return { label: 'En stock', cls: 'ok' };
  };

  // Redimensiona/comprime una foto subida para que quepa cómodamente en Firestore
  const resizeImage = (file, maxWidth = 800, quality = 0.72) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // -----------------------------------------
  // 3. RENDERIZADO
  // -----------------------------------------
  const applySettingsToDOM = () => {
    document.getElementById('announcement-text').textContent = settings.announcement;
    document.getElementById('hero-title').textContent = settings.heroTitle;
    document.getElementById('hero-subtitle').textContent = settings.heroSubtitle;
    document.getElementById('about-title').textContent = settings.aboutTitle;
    document.getElementById('about-text').textContent = settings.aboutText;
    document.getElementById('contact-text').textContent = settings.contactText;
    document.getElementById('contact-meta').textContent = settings.contactMeta;

    const hasWhatsapp = !!(settings.whatsapp || '').replace(/\D/g, '');
    const navBtn = document.getElementById('nav-whatsapp-btn');
    const contactBtn = document.getElementById('contact-whatsapp-btn');
    [navBtn, contactBtn].forEach(btn => {
      if (hasWhatsapp) {
        btn.href = whatsappLink();
        btn.classList.remove('hidden');
      } else {
        btn.href = '#';
        btn.classList.add('hidden');
      }
    });
  };

  const renderPublicCatalog = () => {
    productsGrid.innerHTML = '';

    if (products.length === 0) {
      emptyCatalog.classList.remove('hidden');
      return;
    }
    emptyCatalog.classList.add('hidden');

    products.forEach(prod => {
      const stock = stockInfo(prod.stock);
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-img-wrap">
          <span class="stock-badge ${stock.cls}">${stock.label}</span>
          <img src="${prod.img || ''}" alt="${prod.title}" loading="lazy">
        </div>
        <div class="product-info">
          <div>
            <h3 class="product-title">${prod.title}</h3>
            <p class="product-desc">${prod.desc}</p>
          </div>
          <div class="product-price-box">
            <span class="price-value">${clp(prod.price)}</span>
          </div>
          <a class="button button--accent product-ask-btn full-width ask-btn" data-title="${prod.title.replace(/"/g, '&quot;')}" ${stock.cls === 'out' ? 'style="pointer-events:none;opacity:.5;"' : ''} target="_blank" rel="noopener">Preguntar por este gorro</a>
        </div>
      `;
      productsGrid.appendChild(card);
    });

    document.querySelectorAll('.ask-btn').forEach(btn => {
      const title = btn.getAttribute('data-title');
      const hasWhatsapp = !!(settings.whatsapp || '').replace(/\D/g, '');
      if (hasWhatsapp) {
        btn.href = whatsappLink(`¡Hola! Me interesa el "${title}", ¿sigue disponible?`);
      } else {
        btn.href = '#';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.4';
      }
    });
  };

  const renderAdminList = () => {
    if (!adminProductsList) return;
    adminProductsList.innerHTML = '';

    if (products.length === 0) {
      adminProductsList.innerHTML = '<p class="empty-admin-list">Todavía no has agregado productos.</p>';
    } else {
      products.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
          <div class="admin-item-info">
            <img src="${prod.img || ''}" alt="" class="admin-item-thumb">
            <div>
              <div class="admin-item-title">${prod.title}</div>
              <div class="admin-item-meta">
                <span class="admin-item-price">${clp(prod.price)}</span>
                <span class="admin-item-stock">· ${prod.stock} u.</span>
              </div>
            </div>
          </div>
          <div class="admin-item-actions">
            <button class="icon-btn edit-btn" data-id="${prod.id}" title="Editar">✏️</button>
            <button class="icon-btn danger delete-btn" data-id="${prod.id}" title="Eliminar">🗑️</button>
          </div>
        `;
        adminProductsList.appendChild(item);
      });
    }

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteProduct(e.currentTarget.getAttribute('data-id')));
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => startEditProduct(e.currentTarget.getAttribute('data-id')));
    });
  };

  const renderStats = () => {
    document.getElementById('stat-count').textContent = products.length;
    document.getElementById('stat-stock').textContent = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  };

  // -----------------------------------------
  // 4. LISTENERS EN TIEMPO REAL DE FIRESTORE
  // -----------------------------------------
  db.collection('products').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderPublicCatalog();
    renderAdminList();
    renderStats();
  }, (err) => console.error('Error cargando productos:', err));

  db.collection('settings').doc('site').onSnapshot((doc) => {
    settings = { ...defaultSettings, ...(doc.exists ? doc.data() : {}) };
    applySettingsToDOM();
    if (!adminView.classList.contains('hidden')) fillSettingsForm();
  }, (err) => console.error('Error cargando configuración:', err));

  // -----------------------------------------
  // 5. FORMULARIO DE PRODUCTOS (agregar / editar)
  // -----------------------------------------
  const form = document.getElementById('product-form');
  const editIdInput = document.getElementById('edit-id');
  const formTitle = document.getElementById('form-title');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const imgInput = document.getElementById('p-img');
  const imgPreview = document.getElementById('p-img-preview');

  let pendingImageData = null;

  imgInput.addEventListener('change', async () => {
    const file = imgInput.files[0];
    if (!file) return;
    try {
      pendingImageData = await resizeImage(file);
      imgPreview.src = pendingImageData;
      imgPreview.classList.remove('hidden');
    } catch (err) {
      alert('⚠️ No se pudo procesar la imagen. Prueba con otra foto.');
    }
  });

  const resetForm = () => {
    form.reset();
    editIdInput.value = '';
    formTitle.textContent = 'Añadir Nuevo Gorro';
    cancelEditBtn.classList.add('hidden');
    imgPreview.classList.add('hidden');
    imgPreview.src = '';
    pendingImageData = null;
  };

  const startEditProduct = (id) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    editIdInput.value = prod.id;
    document.getElementById('p-title').value = prod.title;
    document.getElementById('p-price').value = prod.price;
    document.getElementById('p-stock').value = prod.stock;
    document.getElementById('p-desc').value = prod.desc;
    pendingImageData = null;
    if (prod.img) {
      imgPreview.src = prod.img;
      imgPreview.classList.remove('hidden');
    } else {
      imgPreview.classList.add('hidden');
    }
    formTitle.textContent = 'Editar Gorro';
    cancelEditBtn.classList.remove('hidden');
    document.querySelector('[data-tab="tab-productos"]').click();
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  cancelEditBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editingId = editIdInput.value || null;
    const title = document.getElementById('p-title').value.trim();
    const price = parseInt(document.getElementById('p-price').value, 10) || 0;
    const stock = parseInt(document.getElementById('p-stock').value, 10) || 0;
    const desc = document.getElementById('p-desc').value.trim();

    const data = { title, price, stock, desc };
    if (pendingImageData) data.img = pendingImageData;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'GUARDANDO...';

    try {
      if (editingId) {
        await db.collection('products').doc(editingId).update(data);
      } else {
        if (!pendingImageData) {
          alert('⚠️ Por favor sube una foto del producto.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'GUARDAR';
          return;
        }
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('products').add(data);
      }
      resetForm();
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'GUARDAR';
    }
  });

  const deleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que deseas retirar este gorro del catálogo público?')) return;
    try {
      await db.collection('products').doc(id).delete();
    } catch (err) {
      alert('❌ Error al eliminar: ' + err.message);
    }
  };

  // -----------------------------------------
  // 6. FORMULARIO DE CONFIGURACIÓN DEL SITIO
  // -----------------------------------------
  const settingsForm = document.getElementById('settings-form');
  const settingsFieldMap = {
    's-announcement': 'announcement',
    's-hero-title': 'heroTitle',
    's-hero-subtitle': 'heroSubtitle',
    's-about-title': 'aboutTitle',
    's-about-text': 'aboutText',
    's-contact-text': 'contactText',
    's-whatsapp': 'whatsapp',
    's-contact-meta': 'contactMeta'
  };

  const fillSettingsForm = () => {
    Object.entries(settingsFieldMap).forEach(([elId, key]) => {
      document.getElementById(elId).value = settings[key] || '';
    });
  };

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updated = {};
    Object.entries(settingsFieldMap).forEach(([elId, key]) => {
      updated[key] = document.getElementById(elId).value.trim();
    });
    try {
      await db.collection('settings').doc('site').set(updated, { merge: true });
      alert('✅ Contenido del sitio actualizado.');
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    }
  });

  // -----------------------------------------
  // 7. SEGURIDAD: LOGIN CON FIREBASE AUTHENTICATION
  // -----------------------------------------
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginModal.classList.add('hidden');
      adminView.classList.remove('hidden');
      publicView.style.display = 'none';
      fillSettingsForm();
      renderStats();
    } else {
      adminView.classList.add('hidden');
      publicView.style.display = 'block';
    }
  });

  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorBox = document.getElementById('login-error');

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        errorBox.classList.add('hidden');
        document.getElementById('login-form').reset();
      })
      .catch(() => {
        errorBox.textContent = 'Correo o contraseña incorrectos.';
        errorBox.classList.remove('hidden');
      });
  });

  document.getElementById('open-admin-login')?.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    document.getElementById('admin-email').focus();
  });
  document.querySelector('.close-login')?.addEventListener('click', () => {
    loginModal.classList.add('hidden');
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.signOut();
    resetForm();
    window.scrollTo(0, 0);
  });

  // -----------------------------------------
  // 8. NAVEGACIÓN POR PESTAÑAS EN EL PANEL ADMIN
  // -----------------------------------------
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabs = document.querySelectorAll('.admin-tab');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = document.getElementById(btn.getAttribute('data-tab'));
      if (targetTab) targetTab.classList.add('active');
    });
  });
});