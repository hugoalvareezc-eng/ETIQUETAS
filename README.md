# Reetiquetado de Suplementos

App web para acelerar el reetiquetado de suplementos importados (proteínas,
pre-entrenos, creatinas, aminoácidos, vitaminas, etc.) que vienen con la
tabla nutricional en inglés. Permite capturar los datos de la etiqueta
original una sola vez y generar automáticamente la tabla en español, lista
para revisar, imprimir o exportar como imagen.

## ¿Qué hace?

- **Plantillas por tipo de producto**: proteína, pre-entreno, creatina,
  aminoácidos, vitaminas/minerales y genérico. Cada plantilla trae
  precargados los nutrimentos, ingredientes activos, modo de uso y
  advertencias típicos de esa categoría, para no empezar de cero cada vez.
- **Traducción rápida**: un diccionario inglés→español con términos comunes
  de etiquetas de suplementos (nutrimentos, ingredientes activos, frases de
  advertencia). Al escribir un ingrediente en inglés, la app sugiere la
  traducción automáticamente; también puedes ampliar el diccionario con tus
  propios términos desde la pestaña "Diccionario" (se guardan en el
  navegador y quedan disponibles para todos los productos futuros).
- **Tabla nutrimental en español**, con los renglones obligatorios de la
  NOM-051 (contenido energético, proteínas, grasas, carbohidratos, azúcares,
  fibra, sodio) y calcula automáticamente el valor "por 100 g" a partir de
  lo que captures "por porción".
- **Estimación de sellos de advertencia** (EXCESO CALORÍAS, AZÚCARES, GRASAS
  SATURADAS, GRASAS TRANS, SODIO) y leyendas de cafeína/edulcorantes, según
  los umbrales de la NOM-051-SCFI/SSA1-2010 (modificación 2020).
  **Importante**: esto es una estimación orientativa para saber qué revisar
  antes de imprimir. La norma define "azúcares libres" y el cálculo de sodio
  con más detalle del que un formulario simple puede capturar con certeza
  total, así que antes de imprimir en producción conviene validar el
  etiquetado final con tu proveedor de etiquetas, un consultor en
  etiquetado o COFEPRIS/PROFECO, sobre todo si el producto se vende bajo
  registro sanitario.
- **Guarda tus productos** en el navegador (no se necesita servidor ni
  cuenta), para reutilizarlos o duplicarlos cuando llegue un nuevo lote del
  mismo producto.
- **Imprime o exporta la etiqueta** como PNG para pegarla en tus etiquetas
  físicas, o usa "Imprimir / Guardar PDF" para generar un PDF con el
  diálogo de impresión del navegador. El tamaño de página del PDF se ajusta
  solo al tamaño real de la etiqueta (ancho/alto de la etiqueta + margen),
  para no desperdiciar una hoja completa en blanco imprimiendo una sola
  etiqueta chica.
- **Secciones opcionales**: en "¿Qué incluir en la etiqueta?" puedes
  desmarcar lo que no quieras imprimir (encabezado con categoría/nombre/
  marca/sabor/contenido, sellos de advertencia, modo de uso, advertencias,
  ingredientes activos, alérgenos, conservación, etc. — útil si esa
  etiqueta va pegada donde el nombre/marca ya se ve en otro lado). El
  dato sigue guardado, solo se oculta de la vista previa/impresión, así que
  lo puedes reactivar cuando quieras sin volver a capturarlo.
- **Etiqueta en 2 columnas**: si el ancho de la etiqueta es amplio (por
  ejemplo, un bote grande de proteína) pero el contenido queda muy largo/alto,
  activa "Acomodar el contenido en 2 columnas" en "Datos generales" para que
  la tabla nutrimental, ingredientes, modo de uso y advertencias se
  distribuyan en dos columnas y la etiqueta salga bastante más baja.
- **Modo compacto**: si la etiqueta sigue quedando muy alta (por ejemplo, en
  una etiqueta angosta donde no conviene usar 2 columnas), activa "Modo
  compacto" en "Datos generales" para reducir espacios y tamaño de letra sin
  quitar información. Se puede combinar con las 2 columnas para bajar la
  altura todavía más.
- **Escalado continuo por ancho**: la letra, los sellos de advertencia y los
  espacios internos se van achicando en proporción real al ancho de la
  etiqueta (no en saltos fijos), así que una etiqueta muy angosta (2-3 cm)
  se ve chica pero ordenada, en vez de amontonarse o desbordar el borde.
- **Alto fijo de etiqueta** (opcional): si tu papel/etiqueta pre-cortada
  tiene un tamaño exacto, captura "Alto fijo de la etiqueta (cm)" en Datos
  generales. La app encoge la letra lo necesario para que quepa en ese alto;
  si ni así alcanza, te avisa en vez de recortar el contenido en silencio,
  para que agrandes el alto, quites alguna sección opcional, o lo dejes en
  automático.
- **Exportar / importar catálogo (JSON)**: desde "Mis productos" puedes
  descargar todos tus productos en un archivo `.json` (respaldo, o para
  pasarlo a otra computadora), y volver a importarlo con "Importar catálogo".
  También sirve para cargar de golpe una lista de productos que te haya
  armado alguien más (por ejemplo, un archivo con la info ya investigada de
  varios productos): solo necesita traer los campos que de verdad importan
  (nombre, marca, tabla nutrimental, ingredientes, etc.) — lo demás se
  completa solo con la plantilla de esa categoría.
- **Buscador y filtro por categoría** en "Mis productos" y en "Imprimir hoja",
  para encontrar rápido un producto por nombre, marca o sabor cuando el
  catálogo crece.
- **Hoja de impresión con varias etiquetas** (pestaña "Imprimir hoja"):
  elige cuántas copias de cada producto necesitas y la app las acomoda solas
  en hojas tamaño Carta o A4 para aprovechar el papel, respetando el ancho de
  etiqueta configurado por producto (una proteína grande no ocupa lo mismo
  que un pre-entreno chico). Si el contenido de una etiqueta es más alto que
  el espacio disponible en la hoja, te avisa para que agrandes el ancho de
  esa etiqueta o la imprimas aparte.

## Cómo correrlo

Necesitas [Node.js](https://nodejs.org/) 18 o superior instalado.

```bash
npm install
npm run dev
```

Abre la URL que aparece en la terminal (normalmente `http://localhost:5173`).

Para generar una versión estática que puedas subir a cualquier hosting
(Netlify, Vercel, GitHub Pages, o simplemente abrir el `index.html` en un
navegador):

```bash
npm run build
```

Los archivos listos quedan en la carpeta `dist/`.

## Dónde se guardan los datos

Todo se guarda en el `localStorage` del navegador donde abras la app (tus
productos y tu diccionario personalizado). Si cambias de computadora o de
navegador, no vas a ver los productos guardados anteriormente. Si más
adelante quieres que varias personas del negocio compartan el mismo catálogo
de productos desde distintos dispositivos, se puede agregar un backend, pero
eso queda fuera de esta primera versión.

## Formato del JSON para importar productos

Un archivo para importar es una lista de objetos. Todos los campos son
opcionales excepto `category` (`proteina` | `preentreno` | `creatina` |
`aminoacidos` | `vitaminas` | `generico`); lo que no incluyas se completa
con la plantilla de esa categoría:

```json
[
  {
    "category": "preentreno",
    "brand": "MarcaX",
    "productNameEn": "Pre-Workout Extreme",
    "productNameEs": "Pre-Entreno Extremo",
    "flavor": "Sandía",
    "netContent": "300 g",
    "servingSizeText": "1 scoop (10 g)",
    "servingSizeGrams": 10,
    "servingsPerContainer": 30,
    "nutrients": [
      { "labelEs": "Contenido energético", "unit": "kcal", "amount": 15 },
      { "labelEs": "Sodio", "unit": "mg", "amount": 120 }
    ],
    "activeIngredients": [
      { "nameEn": "Caffeine Anhydrous", "nameEs": "Cafeína anhidra", "amount": 200, "unit": "mg" }
    ],
    "containsCaffeine": true,
    "caffeineMgPerServing": 200,
    "ingredientsListEs": "Cafeína anhidra, beta-alanina, ácido cítrico, sucralosa."
  }
]
```

`nutrients` solo necesita traer los renglones que quieras llenar (por
`labelEs` o `labelEn`); el resto de la tabla obligatoria de la NOM-051 se
completa vacía y cualquier renglón que no coincida con la plantilla se
agrega al final (útil para vitaminas/minerales extra).

## Fuentes usadas para los umbrales de sellos (NOM-051)

- Exceso de calorías: ≥275 kcal/100 g (sólidos) o ≥70 kcal/100 ml (líquidos)
- Exceso de azúcares: cuando los azúcares aportan ≥10% de la energía total
- Exceso de grasas saturadas: cuando aportan ≥10% de la energía total
- Exceso de grasas trans: cuando aportan ≥1% de la energía total
- Exceso de sodio: ≥350 mg/100 g (sólidos) o ≥45 mg/100 ml (líquidos)
- Leyenda de cafeína: cuando el producto declara cafeína añadida
- Leyenda de edulcorantes: cuando el producto declara edulcorantes no
  calóricos

Repite: son los valores de referencia más citados públicamente sobre la
norma; no son un sustituto de la verificación legal formal para tu producto
específico.
