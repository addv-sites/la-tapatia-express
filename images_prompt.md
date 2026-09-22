# IMAGES_PROMPT.MD — LA TAPATÍA AHOGADAS

## Objetivo

Procesar fotografías reales del negocio para convertirlas en assets gastronómicos profesionales para web, manteniendo **la identidad real del alimento**.

Las fotografías provenientes de Facebook/TikTok deben considerarse fuente visual del negocio, no material para inventar nuevos productos.

## REGLA MAESTRA

**MEJORAR LA FOTOGRAFÍA, NO CAMBIAR EL PRODUCTO.**

No agregar ingredientes.  
No quitar ingredientes relevantes.  
No cambiar forma, tamaño, cantidad o composición del alimento.  
No transformar tacos en otros tacos.  
No inventar salsas.  
No agregar queso, aguacate, carne, verduras o toppings que no aparezcan.  
No sustituir el producto por uno generado.

---

# 1. PROMPT MAESTRO DE RESTAURACIÓN

```text
Actúa como fotógrafo gastronómico profesional, retocador editorial y restaurador de fotografía comercial para restaurantes.

Trabaja EXCLUSIVAMENTE sobre la fotografía proporcionada.

OBJETIVO:
Convertir la fotografía real del producto en una imagen gastronómica profesional para sitio web, conservando completamente la identidad del alimento original.

REGLAS ABSOLUTAS:
- No cambiar el producto.
- No inventar ingredientes.
- No agregar ingredientes.
- No eliminar ingredientes relevantes.
- No cambiar la cantidad de piezas.
- No alterar artificialmente el tamaño.
- No modificar la forma del alimento.
- No sustituir elementos por versiones generadas.
- No convertir el alimento en otro producto.
- No crear una presentación inexistente.
- No falsificar características del producto.

MEJORAS PERMITIDAS:
- Corrección de exposición.
- Balance de blancos.
- Recuperación de sombras.
- Recuperación de altas luces.
- Corrección de color.
- Reducción de ruido.
- Aumento moderado de nitidez.
- Mejora de microcontraste.
- Limpieza de manchas del sensor.
- Eliminación de elementos accidentales del fondo.
- Corrección de perspectiva cuando sea necesaria.
- Recorte profesional.
- Separación visual del producto respecto al fondo.
- Mejora sutil de textura.

ESTILO:
Fotografía gastronómica profesional, apetecible pero realista, natural, cálida y auténtica.

RESULTADO:
Debe parecer una fotografía real tomada por un fotógrafo gastronómico profesional, no una imagen generada por IA.
```

# 2. PROMPT PARA HERO

```text
Transforma esta fotografía real del producto en un hero gastronómico premium para un restaurante mexicano.

Conserva exactamente el producto original.

No agregues ingredientes ni cambies su presentación.

Composición horizontal 16:9.
Producto claramente visible.
Zona de respiración para colocar copy y CTA mediante HTML/CSS.
Iluminación cálida y natural.
Texturas realistas.
Profundidad de campo sutil.
Fondo coherente con una identidad mexicana urbana y contemporánea, sin competir con el alimento.

El resultado debe provocar apetito mediante fotografía realista, no mediante exageración artificial.

No generar texto dentro de la imagen.
```

# 3. PROMPT 1:1 PARA PRODUCT CARDS

```text
Prepara esta fotografía real para una tarjeta de producto de restaurante.

Formato cuadrado 1:1.

Mantén exactamente el alimento original.

Centrar el producto.
Dejar margen seguro.
Fondo limpio.
Iluminación gastronómica profesional.
Contraste suficiente.
Colores apetitosos pero reales.
Textura visible.
Sin ingredientes inventados.
Sin texto.
Sin logos inventados.
Sin elementos decorativos que no pertenezcan a la fotografía original.
```

# 4. PROMPT 4:5

```text
Adapta la fotografía real a formato vertical 4:5 para redes y módulos gastronómicos.

No cambiar el producto.

Reencuadra inteligentemente conservando todas las características importantes.
Mejora iluminación, color, nitidez y profundidad.
Mantén apariencia auténtica.
No inventes ingredientes.
No generes alimentos adicionales.
No agregues texto.
```

# 5. LIMPIEZA DEL FONDO

```text
Conserva el alimento exactamente como aparece.

Limpia únicamente elementos accidentales o distractores del fondo.

No reconstruyas el alimento.
No modifiques sus ingredientes.
No cambies el plato o recipiente salvo que sea imprescindible para eliminar un defecto accidental.
Mantén sombras naturales y contacto realista con la superficie.
Resultado fotográfico realista.
```

# 6. UPSCALE

```text
Aumenta la resolución de esta fotografía real manteniendo fidelidad fotográfica.

Recupera detalle sin inventar textura.
No reconstruyas artificialmente ingredientes.
No cambies el producto.
No suavices excesivamente.
Evita halos, sobreenfoque y apariencia plástica.

Output preparado para web.
```

# 7. COLOR

```text
Realiza una corrección profesional de color gastronómico.

Mantén colores reales del alimento.
Incrementa ligeramente la separación cromática y la apetitosidad sin sobresaturar.
Corrige dominantes de color.
Conserva tonos naturales de carne, tortilla, pan, verduras, salsas y queso cuando existan en la fotografía.

No inventar colores.
```

# 8. CONSISTENCIA DE TODA LA GALERÍA

Aplicar un tratamiento consistente:

- Temperatura visual cálida.
- Contraste moderado.
- Negros controlados.
- Blancos limpios.
- Saturación natural.
- Textura gastronómica visible.
- Fondo discreto.
- Producto como protagonista.
- Sin filtros extremos.

## Presets sugeridos

### PRODUCT CARD
1:1, producto centrado, fondo limpio.

### PRODUCT DETAIL
4:5, producto grande, mayor detalle.

### HERO
16:9, producto hacia un lado si existe espacio de copy.

### SOCIAL
4:5, composición vertical.

---

# 9. REGLAS DE EXPORTACIÓN WEB

Generar:

- WebP como formato principal.
- AVIF cuando el pipeline lo soporte.
- JPG como fallback si es necesario.

Recomendaciones:

- Card: ancho aproximado 800–1200 px.
- Detail: 1200–1600 px.
- Hero: 1600–2400 px dependiendo de necesidad.
- Compresión visualmente sin pérdida perceptible.
- `width` y `height` siempre definidos en HTML.
- Lazy loading debajo del contenido crítico.

---

# 10. NOMENCLATURA

Usar:

`la-tapatia-ahogadas-[producto]-[formato]-[numero].webp`

Ejemplos:

`la-tapatia-ahogadas-tacos-card-01.webp`
`la-tapatia-ahogadas-torta-detail-01.webp`
`la-tapatia-ahogadas-hero-01.webp`

---

# 11. CONTROL DE CALIDAD

Rechazar una imagen si:

- El alimento parece diferente.
- Aparecen ingredientes que no estaban.
- Desaparecieron ingredientes relevantes.
- Cambió el número de piezas.
- La imagen parece generada por IA.
- El alimento tiene textura artificial.
- Hay deformaciones.
- Hay objetos duplicados.
- Hay manos/dedos deformados.
- El producto perdió autenticidad.

---

# 12. IMPORTANTE SOBRE FACEBOOK/TIKTOK

Antes de procesar:

1. Descargar únicamente assets que el negocio tenga derecho a utilizar.
2. Identificar cuáles corresponden a productos reales.
3. Separar fotos de producto de posts promocionales.
4. No reutilizar publicaciones completas como imagen del sitio.
5. Recortar y optimizar la fotografía, no copiar elementos de interfaz de la red social.
