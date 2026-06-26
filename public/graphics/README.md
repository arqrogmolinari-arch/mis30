# Gráficos / Elementos visuales

Subí acá tus elementos gráficos (pixel art girly Y2K). Todo lo que pongas en esta
carpeta queda servido en `/graphics/<archivo>` y lo podés usar desde el código o el CSS.

## Cómo se usan

En CSS o estilos inline referencialos con la ruta absoluta `/graphics/...`:

```css
background-image: url('/graphics/mi-fondo.png');
```

```tsx
<img src="/graphics/sticker-corazon.png" alt="" />
```

## Archivos que el diseño ya espera (opcionales — si los subís, se usan)

| Archivo                 | Para qué sirve                                              |
|-------------------------|------------------------------------------------------------|
| `bg-hearts.svg`         | Wallpaper pixel-art de corazones (ya incluido). Reemplazalo si querés otro patrón. |
| `background.png`        | Fondo de pantalla completo alternativo (ver nota abajo).   |
| `sticker-*.png`         | Stickers / adornos sueltos para usar donde quieras.        |

## Recomendaciones para que se vea pixel-art nítido

- Exportá en PNG con transparencia, tamaño chico (ej. 16×16, 32×32, 64×64 px).
- Si lo escalás en pantalla, agregá `image-rendering: pixelated;` para que no se vea borroso.
- Paleta sugerida (la del proyecto): rosa `#FF4FB6`, rosa burbuja `#FFB6D9`,
  rosa pálido `#FAE7ED`, lila `#C58BE0`, crema `#FFF6EE`, tinta `#5A2A4A`.

## Reemplazar el fondo general

El fondo vive en `src/styles/global.css` (regla `body`). Si subís `background.png`
y querés usarlo, cambiá la `background-image` del `body` por
`url('/graphics/background.png')`.
