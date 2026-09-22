# STITCH.MD — PROMPT MAESTRO PARA GOOGLE STITCH

## INSTRUCCIÓN PRINCIPAL

Diseña la experiencia UX/UI completa de **La Tapatía Ahogadas**, restaurante mexicano en Morelia.

No construyas backend.
No inventes información.
No inventes precios.
No inventes horarios.
No inventes promociones.
No inventes testimonios.
No inventes métodos de pago.
No inventes zonas de entrega.

El objetivo es producir una interfaz premium, gastronómica, mobile-first y orientada a conversión.

---

# 1. NEGOCIO

Marca: **La Tapatía Ahogadas**

Dirección proporcionada:
**Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.**

WhatsApp:
**4433288181**

Google Maps:
`https://maps.app.goo.gl/Cb7RmeSY7idKGYyk9?g_st=ic`

Facebook:
`https://www.facebook.com/Latapatiaahogadas`

TikTok:
`https://www.tiktok.com/@ahogadas.la.tapat`

---

# 2. OBJETIVO UX

Diseñar el recorrido:

**DESCUBRIMIENTO → ANTOJO → CONFIANZA → ELECCIÓN → PERSONALIZACIÓN → PEDIDO → CONFIRMACIÓN → WHATSAPP**

En los primeros segundos el usuario debe entender:

- qué vende el restaurante;
- qué puede pedir;
- cuánto cuesta;
- cómo pedir;
- dónde está.

---

# 3. PRINCIPIO DE DISEÑO

La experiencia debe transmitir:

**“Se ve delicioso, sé qué pedir y puedo pedirlo ahora.”**

No crear un restaurante genérico.

Debe sentirse:

- mexicano;
- apetitoso;
- alegre;
- artesanal;
- urbano;
- cercano;
- contundente;
- moderno;
- memorable.

---

# 4. BRANDING

Antes de fijar colores o tipografías, analizar los assets reales que entregue el negocio provenientes de Facebook/TikTok.

Si no existe acceso a la identidad original:

- no inventar que determinados colores son oficiales;
- construir un sistema provisional;
- marcarlo como “propuesta digital pendiente de validación”.

La identidad visual debe derivarse de la marca real.

Definir:

- primary;
- secondary;
- accent;
- CTA;
- background;
- surface;
- text;
- muted text;
- success;
- warning;
- error.

Cada color debe tener suficiente contraste.

---

# 5. TIPOGRAFÍA

Seleccionar tipografías web modernas y legibles si la tipografía de marca no puede verificarse.

Debe existir:

- Display/H1
- H2
- H3
- Body
- Button
- Price
- Label

No utilizar demasiadas familias tipográficas.

---

# 6. HOME

## Header

Desktop:

- logo;
- menú;
- ubicación;
- CTA pedir ahora.

Mobile:

- logo;
- CTA;
- navegación compacta.

## Hero

Debe incluir:

- fotografía gastronómica real;
- mensaje de marca;
- CTA principal: **Pedir ahora**;
- CTA secundario: **Ver menú**.

No poner texto dentro de la fotografía.

## Sección de categorías

- Tacos
- Combo infantil
- Tostadas
- Tortas
- Extras
- Postre

## Productos

Cards con:

- fotografía;
- nombre;
- precio;
- descripción breve;
- opciones;
- extras;
- botón agregar.

---

# 7. MENÚ

Diseñar para escaneo rápido.

Cada categoría debe permitir:

- navegación horizontal en móvil;
- cards grandes;
- precio visible;
- acción directa.

Los precios iniciales provienen de la fotografía del Master Prompt:

### TACOS
- Tacos (3 piezas): $50 MXN
- Tacos combinados (3 piezas): $65 MXN
- Taco especial: $27 MXN
- Taco extra: $18 MXN
- Taco de chicharrón: $19 MXN

### COMBO INFANTIL
- Quecas de jamón (2 piezas): $69 MXN
- Pizza individual: $94 MXN

### TOSTADAS
- Tostadas de tiras o ceviche: $36 MXN
- Tostadas de piernas o cueritos: $27 MXN

### TORTAS
- Torta sencilla: $50 MXN
- Torta combinada: $65 MXN
- Torta especial: $70 MXN

### EXTRAS
- Caldillo o salsa de chipotle: $15 MXN
- Verdura extra: $11 MXN
- Queso panela: $21 MXN
- Aguacate: $15 MXN

### POSTRE
- Jericalla: $35 MXN

**IMPORTANTE:** la investigación web encontró precios diferentes en plataformas de delivery. No sustituir estos valores automáticamente. Todos deben aparecer como **PRECIO REQUIERE VALIDACIÓN** hasta que el negocio confirme el catálogo vigente.

---

# 8. PRODUCT DETAIL

Modal o drawer mobile-first.

Mostrar:

- imagen;
- nombre;
- precio;
- descripción;
- variantes;
- extras;
- cantidad;
- agregar al carrito.

Botón:

**Agregar al pedido**

---

# 9. CARRITO

Mostrar:

- productos;
- cantidades;
- extras;
- subtotal;
- total;
- notas;
- CTA continuar.

Estados:

- vacío;
- cargando;
- error;
- producto agregado;
- pedido preparado.

---

# 10. PEDIDO WHATSAPP

El usuario debe revisar antes de enviar.

Formato de mensaje:

```text
Hola, quiero realizar el siguiente pedido en La Tapatía Ahogadas:

[Producto] x [cantidad]
Extras:
[extras]

Subtotal: $XXX
Total: $XXX

Nombre:
[cliente]

Notas:
[notas]
```

No afirmar automáticamente:

- entrega;
- costo de envío;
- forma de pago;
- tiempo;
- cobertura.

Esos datos deben ser configurables.

---

# 11. MOBILE UX

Prioridad máxima.

Incluir:

- CTA persistente;
- carrito visible;
- WhatsApp;
- touch targets de mínimo ~44px;
- navegación con una mano;
- fotos grandes;
- precios claros;
- scroll eficiente.

Evitar:

- menús hamburguesa excesivos;
- popups invasivos;
- sliders innecesarios;
- formularios largos.

---

# 12. CRO ÉTICO

Aplicar:

- jerarquía visual;
- lenguaje sensorial;
- recomendaciones;
- cross-selling;
- upselling;
- combos;
- productos destacados solo cuando exista evidencia;
- prueba social solo con evidencia real;
- urgencia únicamente si es real;
- escasez únicamente si es real.

Nunca usar:

- dark patterns;
- contador falso;
- reseñas falsas;
- “más vendido” sin datos;
- “últimas piezas” sin inventario;
- descuentos inventados.

---

# 13. UBICACIÓN

Crear una sección de ubicación con:

**Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.**

CTA:

**Cómo llegar**

Abrir Google Maps.

No inventar estacionamiento, accesibilidad, horarios o amenidades.

---

# 14. FOOTER

Incluir:

- logo;
- contacto;
- WhatsApp;
- dirección;
- Facebook;
- TikTok;
- navegación;
- aviso legal si corresponde.

---

# 15. DESIGN SYSTEM

Crear componentes reutilizables:

- Header
- Navigation
- Hero
- CategoryNav
- ProductCard
- ProductDetail
- Price
- Badge
- CTA
- Cart
- Checkout
- WhatsAppButton
- Modal
- Toast
- Input
- Select
- QuantitySelector
- Loading
- Empty
- Error
- Success
- Footer
- LocationCard
- SocialCard

---

# 16. RESPONSIVE

Diseñar explícitamente:

- 360px
- 390px
- 430px
- 768px
- 1024px
- 1440px+

Validar:

- overflow;
- tamaños;
- legibilidad;
- sticky elements;
- botones;
- imágenes;
- carrito.

---

# 17. ACCESIBILIDAD

Aplicar buenas prácticas WCAG:

- contraste;
- focus;
- keyboard;
- labels;
- alt;
- aria;
- reduced motion;
- screen reader;
- touch targets.

---

# 18. SEO

Diseñar con:

- H1 único;
- H2 claros;
- contenido semántico;
- URLs limpias;
- imágenes con alt;
- Schema preparado;
- Open Graph;
- estructura Restaurant/LocalBusiness.

---

# 19. ANALÍTICA

Preparar eventos:

- page_view
- menu_view
- product_view
- add_to_cart
- remove_from_cart
- begin_order
- generate_whatsapp_order
- click_whatsapp
- click_maps
- click_facebook
- click_tiktok

No inventar IDs.

---

# 20. ARQUITECTURA FUTURA

El diseño debe poder soportar:

- sucursales;
- menús por sucursal;
- horarios;
- productos temporales;
- promociones;
- cupones;
- inventario;
- clientes recurrentes.

No diseñar una solución que obligue a rediseñar todo al abrir una segunda sucursal.

---

# 21. OUTPUT ESPERADO

Genera una experiencia visual completa:

1. Home
2. Menú
3. Product detail
4. Carrito
5. Pedido/checkout
6. Confirmación
7. Ubicación
8. Contacto

Crear estados:

- normal;
- hover;
- focus;
- active;
- disabled;
- loading;
- empty;
- error;
- success.

Prioridad visual:

**ANTOJO + CONFIANZA + CLARIDAD + FACILIDAD + ACCIÓN**
