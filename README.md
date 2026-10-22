# Sheet Backgrounds Modern

**Fondos personalizados para hojas modernas de personajes de D&D 5e en Foundry VTT.**

> **Proyecto desarrollado con asistencia de inteligencia artificial.** No programé personalmente este módulo. Nació de una necesidad concreta en mi partida de rol: quería personalizar el fondo de las hojas de personaje y el módulo anterior no mostraba el botón en mi versión de Foundry. Con ayuda de ChatGPT (OpenAI) investigué el problema, probé fragmentos de código en la consola de Foundry y preparé esta implementación independiente para poder compartirla con la comunidad. Mi papel fue identificar la necesidad, realizar las pruebas y dirigir el resultado. El código fue generado con ayuda de IA; puede contener errores y agradezco sugerencias y correcciones.

**English / AI-assisted development disclosure:** I did not personally write the module code. This project was created with AI assistance (ChatGPT by OpenAI) to address a practical need in my Foundry VTT game. I identified the issue, tested browser-console prototypes, and guided the resulting solution. The source code was AI-generated and should be reviewed and tested before production use.

## Compatibilidad / Compatibility

- Foundry VTT **13** (desarrollado para **13.351**).
- Sistema **D&D 5e 5.3.3**, hoja moderna `CharacterActorSheet`.
- **Versión preliminar 0.1.0**: se comprobaron por separado las interacciones de botón, selector y fondo en la consola del navegador. **El módulo completo empaquetado aún requiere pruebas en Foundry.**
- No se ha verificado compatibilidad con Foundry 14 u otras versiones del sistema.

## Funciones / Features

- Botón con icono de imagen en el encabezado de la hoja moderna.
- Selector de imágenes integrado con el explorador de Foundry.
- Fondos distintos para cada personaje y persistencia mediante `Actor flags`.
- Clic derecho sobre el botón para restablecer el fondo.
- Configuración del GM para permitir o restringir cambios por parte de los jugadores propietarios.
- Idiomas español e inglés.
- Lectura de fondos guardados por el módulo anterior cuando todavía no hay una selección nueva.

## Instalación desde internet

Cuando se publique una versión en [Releases](https://github.com/Lancelotth/sheet-backgrounds-modern/releases), en Foundry → **Setup → Add-on Modules → Install Module → Manifest URL** introduce:

```text
https://github.com/Lancelotth/sheet-backgrounds-modern/releases/latest/download/module.json
```

> **Nota:** la URL solo funcionará cuando exista una Release con los archivos `module.json` y `sheet-backgrounds-modern.zip`. Subir el código al repositorio no publica automáticamente una versión instalable.

Para una prueba manual, coloca `module.json`, `scripts/` y `lang/` dentro de `Data/modules/sheet-backgrounds-modern/`, reinicia Foundry y activa el módulo en tu mundo.

## Uso

1. **Desactiva** el módulo original **Background Image Customization** para evitar comportamientos duplicados.
2. Activa **Sheet Backgrounds Modern** y abre una hoja moderna de personaje D&D 5e.
3. Pulsa el icono de imagen para seleccionar el fondo.
4. Haz **clic derecho** en ese mismo icono para restablecerlo.
5. En la configuración del módulo, el GM puede permitir que los jugadores cambien el fondo de sus propios personajes.

La desactivación del módulo original no elimina sus datos. La compatibilidad de lectura con sus flags es de mejor esfuerzo y debe probarse con una copia de seguridad.

## Origen y agradecimientos

La idea parte de [Background Image Customization, de kckoch](https://github.com/kckoch/foundryvtt-change-background-image). Esta es una implementación independiente para hojas ApplicationV2: **no incluye código ni arte del módulo original**. Agradecimientos al autor original por la inspiración, a la comunidad de Foundry y a las herramientas de IA que hicieron posible experimentar con una solución.

## Publicación de versiones

El repositorio incluye `.github/workflows/release.yml`. Para publicar la primera versión crea y sube el tag `v0.1.0`; GitHub Actions construirá los archivos instalables y creará una Release, si el repositorio tiene los permisos necesarios. Antes de hacerlo conviene probar el módulo descargado.

## Licencia

MIT. Consulta [LICENSE](LICENSE). Código proporcionado **tal cual**, sin garantías.
