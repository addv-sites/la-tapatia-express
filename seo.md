# SEO.MD — LA TAPATÍA AHOGADAS

## 0. Propósito

Este documento define la estrategia SEO local para el sitio de **La Tapatía Ahogadas**, con prioridad en búsquedas de intención local, descubrimiento de menú, ubicación y pedido.

### Fuentes consideradas

- Master Prompt proporcionado por el negocio.
- Investigación web realizada durante esta ejecución.
- Información pública de plataformas de delivery y directorios, usada únicamente como evidencia secundaria.
- Los precios de la fotografía indicada por el Master Prompt siguen siendo la fuente primaria para el sitio hasta que el negocio los valide.

> **Regla de veracidad:** no publicar como hecho ningún horario, precio, promoción, método de pago, cobertura de entrega, ingrediente o claim que no esté validado por el negocio.

## 1. Hallazgos de investigación

La presencia pública encontrada identifica el establecimiento como **Ahogadas La Tapatía / Ahogadas la tapatía**, en Av. San Juanito Itzícuaro #171, Morelia. Uber Eats muestra una oferta de tacos/comida mexicana y una ventana publicada de aproximadamente 10:10–17:50; DiDi Food también identifica el establecimiento y muestra categorías como tacos, combos y productos de acompañamiento. Estas fuentes presentan precios distintos de los contenidos en la fotografía del Master Prompt, por lo que los precios actuales deben validarse antes de publicar. 

El directorio Restaurant Guru también identifica el teléfono +52 443 328 8181 y la dirección, y muestra señales de reseñas públicas. No deben copiarse reseñas ni convertirlas en testimonios del sitio sin autorización y verificación. 

## 2. Nota crítica sobre identidad y fuentes sociales

Facebook y TikTok fueron proporcionados como fuentes oficiales para estudiar logo, colores, fotografías, lenguaje e identidad. Durante esta ejecución el acceso directo a ambas plataformas fue bloqueado/throttled por el entorno de consulta. Por tanto, **no se debe inventar una paleta, tipografía o elemento de marca atribuyéndolo a esas redes**.

El diseño debe extraer la identidad directamente de los assets que el negocio entregue o que Stitch/Claude pueda consultar posteriormente.

## 3. SEO objetivo

### Keyword primaria

- tacos ahogados en Morelia

### Keywords secundarias

- tacos en Morelia
- comida mexicana en Morelia
- tortas en Morelia
- tostadas en Morelia
- restaurante en Morelia
- tacos cerca de San Juanito Itzícuaro
- comida cerca de Arboledas de Valladolid
- comida para llevar en Morelia
- tacos San Juanito Itzícuaro
- ahogadas Morelia
- tortas ahogadas Morelia
- tacos ahogados cerca de mí

### Long-tail

- dónde comer tacos ahogados en Morelia
- tacos ahogados cerca de San Juanito Itzícuaro
- tacos en Arboledas de Valladolid Morelia
- menú de tacos ahogados Morelia
- pedir tacos ahogados en Morelia
- comida mexicana cerca de Arboledas de Valladolid
- tacos para llevar en Morelia

No introducir “mejor”, “número 1”, “los más famosos” u otros superlativos sin evidencia verificable.

## 4. Search intent

| Intención | Consulta ejemplo | Página/acción |
|---|---|---|
| Local/transaccional | tacos ahogados en Morelia | Home/Menu |
| Comercial | menú tacos ahogados Morelia | Menú |
| Transaccional | pedir tacos Morelia | Menú/Carrito/WhatsApp |
| Navegacional | La Tapatía Ahogadas Morelia | Home |
| Local | tacos San Juanito Itzícuaro | Ubicación |
| Informacional local | comida mexicana Morelia | Home/Contenido |
| Local cercana | comida cerca de Arboledas de Valladolid | Ubicación |

## 5. Title recomendado

**Tacos Ahogados en Morelia | La Tapatía Ahogadas**

Si la investigación futura demuestra que “tacos ahogados” no representa adecuadamente la oferta principal, ajustar el title a la categoría dominante real.

## 6. Meta description

**Tacos, tortas, tostadas y antojitos mexicanos en Morelia. Conoce el menú de La Tapatía Ahogadas, visita nuestra ubicación y arma tu pedido.**

No prometer entrega ni tiempos hasta validar operación.

## 7. H1

**Tacos ahogados y sabor mexicano en Morelia**

## 8. H2 sugeridos

- **Elige lo que se te antoja**
- **Nuestro menú**
- **Arma tu pedido**
- **Visítanos en Morelia**
- **La Tapatía Ahogadas**
- **Encuéntranos y pide**

## 9. Arquitectura SEO

- `/`
- `/#menu`
- `/#tacos`
- `/#tortas`
- `/#tostadas`
- `/#extras`
- `/#postres`
- `/#pedido`
- `/#ubicacion`
- `/#contacto`

Para una primera versión no crear URLs independientes para cada producto si no existe contenido único suficiente.

## 10. NAP

**Nombre:** La Tapatía Ahogadas  
**Dirección proporcionada:** Av. San Juanito Itzicuaro 171, Arboledas de Valladolid, Morelia, Michoacán, México.  
**WhatsApp/teléfono:** 4433288181

Usar exactamente la misma variante de nombre, dirección y teléfono en el sitio, Schema y perfiles donde sea posible.

## 11. Schema.org

Implementar:

1. `Restaurant`
2. `LocalBusiness` como base semántica cuando corresponda
3. `PostalAddress`
4. `GeoCoordinates` únicamente si las coordenadas se obtienen de una fuente confiable
5. `Menu` / `MenuItem` cuando el marcado sea apropiado
6. `WebSite`
7. `BreadcrumbList` si se crean páginas jerárquicas
8. `FAQPage` únicamente para preguntas y respuestas reales, no para manipular resultados.

No inventar `openingHours`, precio promedio, rating, reviewCount, aggregateRating, amenidades o deliveryArea.

## 12. Google Business Profile

Revisar y mantener consistentes:

- Nombre
- Categoría principal
- Categorías secundarias reales
- Dirección
- Teléfono
- Sitio web
- Horarios
- Menú
- Fotografías
- Servicios reales
- URL de pedido si existe
- Atributos disponibles

Solicitar reseñas reales a clientes. No ofrecer incentivos prohibidos ni publicar reseñas creadas por el negocio.

## 13. Open Graph

`og:title`: Tacos Ahogados en Morelia | La Tapatía Ahogadas  
`og:description`: Tacos, tortas, tostadas y antojitos mexicanos en Morelia.  
`og:type`: website  
`og:image`: fotografía gastronómica real optimizada  
`og:locale`: es_MX

## 14. Twitter/X Cards

- `twitter:card`: summary_large_image
- `twitter:title`
- `twitter:description`
- `twitter:image`

## 15. Canonical

Canonical absoluta a la URL final oficial del sitio. No inventar dominio final si todavía no fue definido.

## 16. Sitemap y robots

Crear `sitemap.xml` con las URLs públicas reales.

Crear `robots.txt` permitiendo rastreo de páginas públicas y apuntando al sitemap.

## 17. Imágenes

Convención:

`la-tapatia-ahogadas-[producto]-morelia-[formato].webp`

Ejemplos:

- `la-tapatia-ahogadas-tacos-morelia-1x1.webp`
- `la-tapatia-ahogadas-torta-morelia-4x5.webp`
- `la-tapatia-ahogadas-hero-morelia-16x9.webp`

Alt text descriptivo y factual:

- `Tacos de La Tapatía Ahogadas en Morelia`
- `Torta de La Tapatía Ahogadas`
- `Jericalla de La Tapatía Ahogadas`

No usar keywords de manera artificial.

## 18. Contenido local

Crear contenido solo si puede mantenerse auténtico:

- Menú
- Cómo llegar
- Información del restaurante
- Especialidades reales
- Preguntas frecuentes reales
- Novedades/promociones reales

Evitar páginas artificiales del tipo “tacos en cada colonia de Morelia” sin contenido diferencial.

## 19. Core Web Vitals

Prioridades:

- LCP: hero optimizado
- CLS: reservar dimensiones de imágenes
- INP: JavaScript mínimo
- Lazy loading debajo del fold
- WebP/AVIF
- Fuentes limitadas
- Evitar librerías pesadas
- Evitar sliders innecesarios
- Cargar primero contenido crítico

## 20. Analítica SEO/CRO

Eventos:

- `page_view`
- `menu_view`
- `product_view`
- `add_to_cart`
- `remove_from_cart`
- `begin_order`
- `generate_whatsapp_order`
- `click_whatsapp`
- `click_maps`
- `click_facebook`
- `click_tiktok`

IDs de GA/GTM deben quedar como placeholders configurables.

## 21. Validación antes de publicar

Checklist:

- [ ] Nombre y NAP consistentes
- [ ] Menú validado
- [ ] Precios validados
- [ ] Horarios validados
- [ ] URL final configurada
- [ ] Schema validado
- [ ] Sitemap generado
- [ ] robots.txt
- [ ] Open Graph
- [ ] imágenes comprimidas
- [ ] alt text
- [ ] enlaces sociales
- [ ] WhatsApp correcto
- [ ] Google Maps correcto
- [ ] no claims no comprobados
