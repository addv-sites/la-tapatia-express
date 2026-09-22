# BUILDCLAUDE.MD — PROMPT MAESTRO PARA CLAUDE CODE

## MISIÓN

Construye posteriormente el sitio web de **La Tapatía Ahogadas** utilizando las especificaciones del proyecto.

NO inventes información.

Antes de escribir código debes analizar todos los documentos disponibles:

- `seo.md`
- `images_prompt.md`
- `stitch.md`
- cualquier brand asset validado
- cualquier catálogo/Google Sheet entregado

---

# 1. STACK

Objetivo de despliegue:

**GitHub Pages**

Arquitectura:

- HTML5
- CSS3
- JavaScript moderno
- Static Site / JAMstack
- Google Sheets como fuente de datos
- Google Apps Script cuando sea necesario
- WhatsApp para cierre del pedido

No depender de:

- Node server permanente
- PHP
- VPS
- backend tradicional
- base de datos propia
- secretos privados en frontend

Puedes utilizar un framework estático si aporta valor real y puede desplegarse de manera compatible con GitHub Pages. Si no aporta valor, preferir HTML/CSS/JS ligero.

---

# 2. REGLA DE INFORMACIÓN

Nunca inventes:

- productos;
- precios;
- ingredientes;
- horarios;
- promociones;
- testimonios;
- métodos de pago;
- cobertura;
- costos de envío;
- tiempos de entrega;
- disponibilidad.

Cuando falte un dato:

1. Crear variable configurable.
2. Documentar el dato faltante.
3. Mostrar un estado seguro.
4. No inventar.

---

# 3. DATOS INICIALES

Marca:

**La Tapatía Ahogadas**

WhatsApp:

**4433288181**

Dirección:

**Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.**

Google Maps:

`https://maps.app.goo.gl/Cb7RmeSY7idKGYyk9?g_st=ic`

Facebook:

`https://www.facebook.com/Latapatiaahogadas`

TikTok:

`https://www.tiktok.com/@ahogadas.la.tapat`

---

# 4. MENÚ INICIAL

Usar como dataset inicial de referencia:

```text
TACOS
Tacos (3 piezas) — $50
Tacos combinados (3 piezas) — $65
Taco especial — $27
Taco extra — $18
Taco de chicharrón — $19

COMBO INFANTIL
Quecas de jamón (2 piezas) — $69
Pizza individual — $94

TOSTADAS
Tostadas de tiras o ceviche — $36
Tostadas de piernas o cueritos — $27

TORTAS
Torta sencilla — $50
Torta combinada — $65
Torta especial — $70

EXTRAS
Caldillo o salsa de chipotle — $15
Verdura extra — $11
Queso panela — $21
Aguacate — $15

POSTRE
Jericalla — $35
```

**Todos los precios deben quedar marcados internamente como `requiresValidation: true` hasta confirmación del negocio**, porque las plataformas públicas consultadas muestran precios diferentes.

No sobrescribirlos silenciosamente.

---

# 5. CONFIGURACIÓN CENTRAL

Crear un archivo equivalente a:

`src/config/site.js`

o estructura equivalente.

Debe centralizar:

- businessName
- phone
- whatsapp
- address
- googleMapsUrl
- socialLinks
- analytics IDs
- branch
- feature flags
- menu source
- order configuration

Nunca repetir valores críticos en múltiples componentes.

---

# 6. CATÁLOGO

Preparar modelo:

```text
product_id
category_id
category
name
short_description
description
price
image
active
featured
sort_order
tags
options
extras
branch_id
requiresValidation
```

---

# 7. GOOGLE SHEETS

Preparar arquitectura compatible con Google Sheets.

Hojas:

### CATÁLOGO

Campos:

- product_id
- category_id
- category
- name
- short_description
- description
- price
- image
- active
- featured
- sort_order
- tags
- options
- extras
- branch_id

### PEDIDOS

- order_id
- created_at
- customer_name
- customer_phone
- items
- subtotal
- total
- notes
- order_type
- branch_id
- status
- source
- whatsapp_sent
- internal_notes

### SUCURSALES

- branch_id
- name
- address
- phone
- whatsapp
- google_maps_url
- active
- latitude
- longitude
- schedule

### CONFIG

- promotions
- messages
- schedules
- contact
- social
- SEO
- WhatsApp
- default_branch

---

# 8. GOOGLE APPS SCRIPT

Si se implementa:

Documentar:

- endpoint;
- método;
- payload;
- response;
- validaciones;
- sanitización;
- errores;
- protección anti-spam;
- idempotencia;
- rate limiting o estrategia equivalente.

No poner secretos en frontend.

Nunca insertar credenciales privadas en el repositorio público.

---

# 9. PEDIDO

Implementar:

1. seleccionar producto;
2. seleccionar cantidad;
3. variantes;
4. extras;
5. carrito;
6. subtotal;
7. total;
8. datos mínimos;
9. notas;
10. modalidad únicamente si está habilitada;
11. generar mensaje;
12. abrir WhatsApp;
13. permitir revisar antes de enviar.

---

# 10. MENSAJE WHATSAPP

Generar texto estructurado:

```text
Hola, quiero realizar un pedido en La Tapatía Ahogadas:

1. [Producto] x [Cantidad]
   Extras: [Extras]

Subtotal: $XXX
Total: $XXX

Nombre: [Nombre]
Teléfono: [Teléfono]

Notas:
[Notas]
```

Codificar correctamente el mensaje para URL.

No enviar automáticamente sin acción explícita del usuario.

---

# 11. UX MOBILE-FIRST

Prioridad:

- smartphone;
- una mano;
- conexión móvil;
- velocidad.

Implementar:

- sticky CTA;
- botón WhatsApp;
- carrito accesible;
- category navigation;
- imágenes grandes;
- precios claros;
- pocos pasos.

---

# 12. COMPONENTES

Crear componentes reutilizables:

- Header
- Navigation
- Hero
- CategoryNav
- ProductCard
- ProductDetail
- Cart
- Checkout
- WhatsAppButton
- Toast
- Modal
- QuantitySelector
- LoadingState
- EmptyState
- ErrorState
- SuccessState
- LocationCard
- SocialCard
- Footer

---

# 13. DESIGN SYSTEM

Usar tokens CSS:

```css
--color-primary
--color-secondary
--color-accent
--color-cta
--color-background
--color-surface
--color-text
--color-muted
--color-success
--color-warning
--color-error

--radius-sm
--radius-md
--radius-lg

--shadow-sm
--shadow-md
--shadow-lg

--space-xs
--space-sm
--space-md
--space-lg
--space-xl
```

Los valores deben derivarse del brand system validado.

---

# 14. FOTOGRAFÍA

Usar únicamente fotografías reales aprobadas.

No generar fotografías artificiales de productos si existen fotografías reales.

Aplicar `images_prompt.md`.

Preparar:

- 1:1
- 4:5
- 16:9

WebP/AVIF cuando sea posible.

---

# 15. SEO TÉCNICO

Implementar según `seo.md`:

- title;
- meta description;
- canonical;
- H1/H2;
- sitemap;
- robots;
- Open Graph;
- Twitter/X;
- Schema.org;
- Restaurant;
- LocalBusiness;
- Menu/MenuItem cuando corresponda;
- breadcrumbs cuando existan;
- alt text.

No generar structured data con información no confirmada.

No inventar aggregate ratings.

---

# 16. PERFORMANCE

Objetivo: excelente experiencia móvil.

Implementar:

- lazy loading;
- imágenes responsivas;
- `width`/`height`;
- WebP/AVIF;
- minificación;
- CSS eficiente;
- JS mínimo;
- fuentes optimizadas;
- evitar dependencias innecesarias;
- caching compatible con GitHub Pages.

---

# 17. ACCESIBILIDAD

Implementar:

- semántica HTML;
- keyboard navigation;
- focus visible;
- labels;
- aria-label cuando corresponda;
- alt text;
- contraste;
- touch targets;
- reduced motion;
- mensajes de error claros.

---

# 18. ANALÍTICA

Preparar:

```text
page_view
menu_view
product_view
add_to_cart
remove_from_cart
begin_order
generate_whatsapp_order
click_whatsapp
click_maps
click_facebook
click_tiktok
```

Usar:

`GA_MEASUREMENT_ID`

`GTM_CONTAINER_ID`

como placeholders.

No inventar IDs.

---

# 19. ESTADOS UX

Todo componente interactivo debe contemplar:

- default;
- hover;
- focus;
- active;
- disabled;
- loading;
- success;
- error;
- empty.

No dejar pantallas rotas ante errores de red.

---

# 20. SEGURIDAD

No exponer:

- API keys privadas;
- tokens;
- contraseñas;
- credenciales;
- secretos.

Validar entradas.

Sanitizar texto.

Evitar XSS.

No confiar en datos enviados desde cliente.

Implementar idempotencia para operaciones sensibles si existe backend serverless.

---

# 21. FUTURAS SUCURSALES

Desde el inicio:

```text
branch_id
```

debe formar parte del modelo.

Preparar para:

- diferentes direcciones;
- teléfonos;
- WhatsApp;
- horarios;
- menú;
- productos;
- disponibilidad;
- configuración.

---

# 22. ARCHIVOS A CREAR

Como mínimo:

```text
/
├── index.html
├── README.md
├── robots.txt
├── sitemap.xml
├── assets/
├── css/
├── js/
├── data/
└── docs/
```

La estructura exacta puede variar si se utiliza framework.

---

# 23. README

Documentar:

- instalación;
- desarrollo;
- build;
- despliegue;
- configuración;
- catálogo;
- Google Sheets;
- Apps Script;
- WhatsApp;
- analítica;
- SEO;
- imágenes;
- sucursales;
- variables;
- solución de problemas.

---

# 24. VALIDACIÓN

Antes de considerar terminado:

### Funcional
- [ ] menú carga;
- [ ] categorías funcionan;
- [ ] producto abre;
- [ ] cantidades funcionan;
- [ ] extras funcionan;
- [ ] carrito calcula;
- [ ] total correcto;
- [ ] WhatsApp genera mensaje;
- [ ] enlaces sociales funcionan;
- [ ] Maps funciona.

### Responsive
- [ ] 360px
- [ ] 390px
- [ ] 430px
- [ ] 768px
- [ ] 1024px
- [ ] desktop

### SEO
- [ ] title
- [ ] description
- [ ] canonical
- [ ] H1
- [ ] schema
- [ ] sitemap
- [ ] robots
- [ ] OG

### Accesibilidad
- [ ] keyboard
- [ ] focus
- [ ] labels
- [ ] contrast
- [ ] alt

### Performance
- [ ] imágenes optimizadas
- [ ] lazy loading
- [ ] JS mínimo
- [ ] CSS eficiente

---

# 25. REGLA FINAL

Construye una experiencia que comunique:

**ANTOJO + CONFIANZA + CLARIDAD + FACILIDAD + ACCIÓN**

pero sin manipulación engañosa.

La prioridad es que una persona pueda:

**descubrir → ver el menú → elegir → personalizar → revisar → abrir WhatsApp**

con la menor fricción posible.

No publiques ni despliegues automáticamente.

Antes de cualquier despliegue, entrega un reporte de validación y una lista explícita de datos pendientes de confirmación.
