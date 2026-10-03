/**
 * DENTISTA MORALES - MICROINTERACCIONES & EASTER EGGS ARTESANALES
 * Código hecho a mano con cariño, sin librerías pesadas (0 KB frameworks).
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mensaje secreto en la consola para desarrolladores curiosos
  console.log(
    '%c🦷 DENTISTA MORALES | Chamberí, Madrid %c\n' +
    '¡Hola curioso/a! Si buscas una plantilla generada con Bootstrap o un tema clónico de IA, ' +
    'aquí no lo vas a encontrar.\n' +
    'Esta web está programada a mano, cuidando la accesibilidad, el RGPD real y el respeto por los tiempos de carga.\n' +
    '— El equipo de Dentista Morales (y quien nos ayuda con la web entre café y café).',
    'color: #203B31; font-size: 16px; font-weight: bold; font-family: serif; background: #FAF7F2; padding: 4px 8px; border-radius: 4px; border: 1px solid #203B31;',
    'color: #6B665F; font-size: 12px;'
  );

  // 2. Easter Egg en el Logo: 5 clics consecutivos desatan una sorpresa
  let logoClicks = 0;
  let clickTimer = null;
  const logoElement = document.querySelector('.brand-logo');

  if (logoElement) {
    logoElement.addEventListener('click', (e) => {
      logoClicks++;
      clearTimeout(clickTimer);
      
      // Retroalimentación táctil ligera si el dispositivo lo soporta
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      if (logoClicks >= 5) {
        e.preventDefault();
        showToast('🎉 ¡Has descubierto el secreto de Chamberí! Di en recepción la palabra "MOLAR" y te invitamos a un café de especialidad antes de tu consulta.');
        logoClicks = 0;
      } else {
        clickTimer = setTimeout(() => {
          logoClicks = 0;
        }, 1200);
      }
    });
  }

  // 3. Frase aleatoria viva en el Footer
  const footerQuotes = [
    'Hecho con café, paciencia y un poco de estrés en Chamberí.',
    'Si has llegado hasta aquí leyendo, te mereces un premio. Pregunta en la clínica por el "descuento del footer".',
    'Ningún diente fue dañado durante la programación de esta web.',
    'Actualizado a mano en marzo de 2025 mientras el Dr. Javier intentaba mejorar su saque de tenis.',
    'Aviso: La Dra. Lucía sigue insistiendo en que el ukelele relaja más que la anestesia.',
    'Esta web no utiliza cookies de seguimiento invasivo. Respetamos tu privacidad tanto como tus encías.'
  ];

  const quoteBox = document.getElementById('footer-dynamic-quote');
  if (quoteBox) {
    const randomIdx = Math.floor(Math.random() * footerQuotes.length);
    quoteBox.textContent = `« ${footerQuotes[randomIdx]} »`;
  }

  // 4. Estado de apertura en tiempo real (Horario Chamberí)
  const statusPill = document.getElementById('clinic-status-pill');
  if (statusPill) {
    const now = new Date();
    const day = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    const hour = now.getHours();
    let isOpen = false;
    let text = 'Cerrado ahora (Abrimos a las 9:00)';

    if (day >= 1 && day <= 5) {
      // Lunes a Viernes 9:00 a 20:00
      if (hour >= 9 && hour < 20) {
        isOpen = true;
        text = 'Abierto hoy hasta las 20:00';
      }
    } else if (day === 6) {
      // Sábado 10:00 a 14:00
      if (hour >= 10 && hour < 14) {
        isOpen = true;
        text = 'Abierto hoy hasta las 14:00';
      }
    } else {
      text = 'Cerrado hoy domingo (Urgencias por WhatsApp)';
    }

    statusPill.innerHTML = `<span class="status-dot" style="background-color: ${isOpen ? '#5CD47A' : '#E5A93C'}; box-shadow: 0 0 6px ${isOpen ? '#5CD47A' : '#E5A93C'};"></span> <span>${text}</span>`;
  }

  // 5. Acordeones accesibles para FAQ
  const faqButtons = document.querySelectorAll('.faq-button');
  faqButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Cerrar otros (opcional, dejamos que puedan abrir varios)
      item.classList.toggle('active');
      button.setAttribute('aria-expanded', !isExpanded);

      if (navigator.vibrate) {
        navigator.vibrate(15);
      }
    });
  });

  // 6. Menú móvil interactivo
  const mobileToggle = document.querySelector('.mobile-toggle');
  const siteHeader = document.querySelector('.site-header');
  if (mobileToggle && siteHeader) {
    mobileToggle.addEventListener('click', () => {
      siteHeader.classList.toggle('mobile-nav-active');
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
    });
  }

  // 7. Micro-interacción: Botones con feedback táctil y compresión
  const allButtons = document.querySelectorAll('.btn');
  allButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (navigator.vibrate) {
        navigator.vibrate([15, 20, 15]);
      }
    });
  });

  // 8. Manejo de formularios de captación con tono humano
  const leadForms = document.querySelectorAll('form.js-lead-form');
  leadForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = form.querySelector('input[name="nombre"]');
      const phoneInput = form.querySelector('input[name="telefono"]');
      const name = nameInput ? nameInput.value.trim() : 'amigo/a';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (!phone || phone.length < 9) {
        showToast('⚠️ Por favor, escribe un teléfono válido para que podamos llamarte o escribirte.');
        if (phoneInput) phoneInput.focus();
        return;
      }

      // Checkboxes RGPD
      const rgpdCheckbox = form.querySelector('input[name="rgpd_consent"]');
      if (rgpdCheckbox && !rgpdCheckbox.checked) {
        showToast('🔒 Es necesario marcar la casilla de aceptación para que podamos gestionar tu cita legalmente.');
        rgpdCheckbox.focus();
        return;
      }

      // Simulación de envío exitoso
      showToast(`✅ ¡Gracias, ${name}! Hemos recibido tu solicitud. Te llamaremos en menos de 2 horas (en horario de clínica).`);
      form.reset();
    });
  });

  // Función auxiliar para notificaciones Toast
  function showToast(message) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 6000);
  }
});
