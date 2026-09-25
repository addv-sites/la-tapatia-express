/**
 * Guías rápidas animadas del dashboard (/admin/): tutoriales tipo
 * coachmark sobre una maqueta simplificada de la pantalla real — nunca
 * una grabación real, solo ilustran el flujo. Motor genérico + 3
 * definiciones (repartidor, catálogo, horario).
 */
(function () {
  const GUIDES = {
    repartidor: {
      title: 'Asignar un pedido a un repartidor',
      mockup:
        '<div class="max-w-xs mx-auto">' +
        '  <p class="font-label-sm text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-2">Listo / En Reparto</p>' +
        '  <div id="g-order-card" class="bg-surface-container-lowest rounded-xl p-3 text-left shadow-sm">' +
        '    <p class="font-label-md text-label-md font-bold">#TA-0042 · $145</p>' +
        '    <p class="font-body-sm text-[11px] text-on-surface-variant mb-2">Entrega a domicilio</p>' +
        '    <div id="g-select" class="h-9 rounded-lg border border-outline-variant bg-surface px-2 flex items-center font-label-sm text-[11px] text-on-surface-variant">Sin asignar ▾</div>' +
        '  </div>' +
        '</div>',
      steps: [
        { target: '#g-order-card', text: 'Este pedido ya está "Listo" y es entrega a domicilio.' },
        { target: '#g-select', text: 'Dale click al selector "Sin asignar".' },
        { target: '#g-select', text: 'Elige un repartidor de la lista — se guarda solo, al instante.',
          apply: function (stage) {
            const el = stage.querySelector('#g-select');
            el.textContent = 'Juan Pérez ▾';
            el.classList.add('text-tertiary', 'font-bold');
          } }
      ]
    },
    catalogo: {
      title: 'Configurar el catálogo',
      mockup:
        '<div class="max-w-xs mx-auto flex flex-col gap-2.5">' +
        '  <div class="flex justify-between items-center">' +
        '    <span class="font-label-sm text-[11px] text-on-surface-variant font-bold">Catálogo</span>' +
        '    <div id="g-add-btn" class="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-[10.5px] font-bold">+ Agregar platillo</div>' +
        '  </div>' +
        '  <div id="g-form" class="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-2 text-left shadow-sm">' +
        '    <div class="h-8 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10.5px] text-on-surface-variant">Nombre del platillo</div>' +
        '    <div class="h-8 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10.5px] text-on-surface-variant">Precio (MXN)</div>' +
        '    <div id="g-save-btn" class="h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-label-sm text-[10.5px] font-bold">Guardar</div>' +
        '  </div>' +
        '  <div id="g-validate-row" class="bg-mustard-light rounded-lg p-2 flex items-center justify-between">' +
        '    <span class="font-label-sm text-[10.5px] text-on-secondary-container">Taco especial · $27</span>' +
        '    <div id="g-validate-btn" class="px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[9.5px] font-bold">Validar</div>' +
        '  </div>' +
        '</div>',
      steps: [
        { target: '#g-add-btn', text: 'Dale click en "+ Agregar platillo".' },
        { target: '#g-form', text: 'Llena nombre, categoría, precio y foto (opcional).' },
        { target: '#g-save-btn', text: 'Guarda — se sube en tiempo real a Google Sheets.' },
        { target: '#g-validate-row', text: 'El precio nuevo queda "pendiente" hasta que lo valides aquí con este botón.' }
      ]
    },
    horario: {
      title: 'Configurar horarios',
      mockup:
        '<div class="max-w-xs mx-auto flex flex-col gap-2.5">' +
        '  <div class="self-start px-3 py-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-label-sm text-[10.5px] font-bold">Horario</div>' +
        '  <div id="g-hours-box" class="bg-surface-container-lowest rounded-xl p-3 flex flex-col gap-1.5 text-left shadow-sm">' +
        '    <div class="flex items-center gap-2"><span class="font-label-sm text-[10.5px] font-bold w-8">Lun</span><div class="h-8 flex-1 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10px] text-on-surface-variant">10:00</div><div class="h-8 flex-1 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10px] text-on-surface-variant">18:00</div></div>' +
        '    <div class="flex items-center gap-2"><span class="font-label-sm text-[10.5px] font-bold w-8">Dom</span><div class="h-8 flex-1 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10px] text-on-surface-variant">9:30</div><div class="h-8 flex-1 rounded-lg bg-surface-container-low px-2 flex items-center font-body-sm text-[10px] text-on-surface-variant">18:00</div></div>' +
        '  </div>' +
        '  <div id="g-save-horario" class="h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center font-label-sm text-[10.5px] font-bold">Guardar configuración</div>' +
        '</div>',
      steps: [
        { target: '#g-hours-box', text: 'Captura la hora de apertura y cierre de cada día.' },
        { target: '#g-save-horario', text: 'Guarda — el sitio muestra "Abierto/Cerrado" en tiempo real según esto.' }
      ]
    }
  };

  let currentGuide = null;
  let currentStep = 0;

  function renderStep(stage, dotsEl, prevBtn, nextBtn) {
    const guide = currentGuide;
    const step = guide.steps[currentStep];
    if (step.apply) step.apply(stage);

    dotsEl.innerHTML = guide.steps.map((_, i) =>
      '<div class="h-1.5 rounded-full transition-all ' +
      (i === currentStep ? 'w-4 bg-primary' : 'w-1.5 bg-surface-container-high') + '"></div>'
    ).join('');

    const stageRect = stage.getBoundingClientRect();
    const targetEl = stage.querySelector(step.target);
    const r = targetEl.getBoundingClientRect();
    const top = r.top - stageRect.top;
    const left = r.left - stageRect.left;

    let ring = stage.querySelector('#g-spotlight');
    if (!ring) {
      ring = document.createElement('div');
      ring.id = 'g-spotlight';
      ring.className = 'absolute rounded-xl border-2 border-primary pointer-events-none transition-all duration-500';
      ring.style.boxShadow = '0 0 0 4px rgba(147,0,11,.15)';
      stage.appendChild(ring);
    }
    ring.style.top = (top - 4) + 'px';
    ring.style.left = (left - 4) + 'px';
    ring.style.width = (r.width + 8) + 'px';
    ring.style.height = (r.height + 8) + 'px';

    let bubble = stage.querySelector('#g-bubble');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.id = 'g-bubble';
      bubble.className = 'absolute bg-inverse-surface text-inverse-on-surface font-label-sm text-[11px] font-medium px-3 py-2 rounded-xl max-w-[220px] leading-snug transition-all duration-500 shadow-lg';
      stage.appendChild(bubble);
    }
    bubble.textContent = step.text;
    bubble.style.opacity = '0';
    const bubbleTop = top + r.height + 10;
    bubble.style.top = bubbleTop + 'px';
    bubble.style.left = Math.max(4, left) + 'px';
    requestAnimationFrame(() => { bubble.style.opacity = '1'; });

    prevBtn.classList.toggle('opacity-40', currentStep === 0);
    nextBtn.textContent = currentStep === guide.steps.length - 1 ? 'Listo' : 'Siguiente';
  }

  function openGuide(key) {
    const guide = GUIDES[key];
    if (!guide) return;
    currentGuide = guide;
    currentStep = 0;

    const overlay = document.getElementById('guide-overlay');
    const stage = document.getElementById('guide-stage');
    const dotsEl = document.getElementById('guide-dots');
    const prevBtn = document.getElementById('guide-prev');
    const nextBtn = document.getElementById('guide-next');

    document.getElementById('guide-title').textContent = guide.title;
    stage.innerHTML = guide.mockup;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    setTimeout(() => renderStep(stage, dotsEl, prevBtn, nextBtn), 50);
  }

  function closeGuide() {
    const overlay = document.getElementById('guide-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    currentGuide = null;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.guide-trigger').forEach((btn) => {
      btn.addEventListener('click', () => openGuide(btn.dataset.guide));
    });
    document.getElementById('guide-close').addEventListener('click', closeGuide);
    document.getElementById('guide-next').addEventListener('click', () => {
      if (!currentGuide) return;
      const stage = document.getElementById('guide-stage');
      if (currentStep < currentGuide.steps.length - 1) {
        currentStep++;
        renderStep(stage, document.getElementById('guide-dots'), document.getElementById('guide-prev'), document.getElementById('guide-next'));
      } else {
        closeGuide();
      }
    });
    document.getElementById('guide-prev').addEventListener('click', () => {
      if (!currentGuide || currentStep === 0) return;
      currentStep--;
      renderStep(document.getElementById('guide-stage'), document.getElementById('guide-dots'), document.getElementById('guide-prev'), document.getElementById('guide-next'));
    });
  });
})();
