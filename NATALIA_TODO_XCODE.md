# Lo que necesito de ti para seguir con la app

Todo lo que se podía adelantar sin compilar ya está hecho y commiteado en
`feature/capacitor-app`. Lo que queda son cosas que requieren tu contraseña de
administrador o tu identidad como persona, así que no las puedo hacer yo.

Están en orden. El paso 1 es el único urgente.

---

## 1. Desbloquear Xcode (5 minutos, gratis)

Xcode 26.6 ya está instalado en tu Mac, pero está "dormido" por dos motivos: el
sistema apunta a una versión reducida de las herramientas, y nunca se aceptó la
licencia de Apple. Hasta resolver eso no se puede compilar ni abrir el
simulador.

Abrí la app **Terminal** (Cmd + Espacio, escribí "Terminal") y pegá estos tres
comandos, uno por uno. Te va a pedir tu contraseña de Mac en el primero, y no
se ve nada mientras la escribís, es normal.

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Le dice al sistema que use el Xcode completo en vez de las herramientas
reducidas.

```bash
sudo xcodebuild -license accept
```

Acepta la licencia de Apple. Sin esto todo comando de Xcode se niega a correr.

```bash
sudo xcodebuild -runFirstLaunch
```

Instala los componentes que Xcode deja pendientes tras instalarse. Puede tardar
unos minutos.

**Cómo saber si funcionó:** pegá `xcrun simctl list devices available` y tenés
que ver una lista de iPhones. Si aparece, avisame y sigo con el build y la
prueba de login.

---

## 2. Programa de Desarrollador de Apple (99 €/año)

Necesario para: publicar en la App Store, notificaciones push, y arreglar el
link de recuperación de contraseña dentro de la app. **No** hace falta para
probar en el simulador, así que el paso 1 no depende de esto.

1. Entrá a https://developer.apple.com/programs/enroll/
2. Iniciá sesión con tu Apple ID. Conviene que sea el que vas a usar siempre
   para Curato, porque después es un dolor moverlo.
3. Activá la verificación en dos pasos si te la pide, es obligatoria.
4. Elegí el tipo de cuenta:
   - **Individual**: más rápido, sale a tu nombre. La app aparece publicada por
     "Natalia Fernández".
   - **Organización**: la app aparece publicada por "Curato". Requiere número
     de registro legal de la empresa (un D-U-N-S) y tarda más, a veces semanas.
   - Si Curato ya es una sociedad y querés que la tienda diga Curato, elegí
     organización y empezá ya, porque el D-U-N-S es lo más lento de todo.
5. Pagá los 99 € y esperá el mail de confirmación (de horas a días).

### Cuando esté aprobada, pasame estos datos

- **Team ID**: son 10 caracteres tipo `A1B2C3D4E5`. Está en
  https://developer.apple.com/account, sección "Membership details".

Con eso puedo dejar configurado:

- **Universal Links**, que es lo que hace que el link de recuperación de
  contraseña abra dentro de la app en vez de mandar a Safari. Hoy ese flujo está
  roto en la app y esta es la única solución real.
- El archivo de capacidades para push.

### Lo que vas a tener que hacer vos desde Xcode (te guío cuando llegue)

- Iniciar sesión con tu Apple ID en Xcode (Settings, Accounts).
- Activar la capacidad **Push Notifications** en el proyecto. Es un botón.
- Activar **Associated Domains** para los Universal Links.
- Crear una **APNs Key** en el portal de Apple, que es el permiso para
  mandarnos notificaciones. Se descarga una sola vez, guardala bien.

Los certificados de firma los genera Xcode solo si dejás activado "Automatically
manage signing", así que no te preocupes por esa parte.

---

## 3. Android (opcional por ahora)

Ahora mismo no hay nada de Android instalado en tu Mac, así que el emulador no
se puede ni abrir. El código de la app Android ya está listo y commiteado, solo
falta el entorno.

1. **JDK 21**: https://adoptium.net/temurin/releases/?version=21
   Elegí el instalador `.pkg` para macOS y tu chip (Apple Silicon = aarch64).
2. **Android Studio**: https://developer.android.com/studio
   Al abrirlo por primera vez elegí la instalación estándar, que baja el SDK y
   crea un emulador solo.

Para publicar en Google Play son 25 € por única vez, en
https://play.google.com/console/signup. No corre apuro, se puede hacer después
de iOS.

---

## 4. Lo único que no puedo probar yo

Cuando el simulador esté andando, la prueba crítica es iniciar sesión de verdad
dentro de la app. Yo no escribo contraseñas en formularios, así que ese paso lo
hacés vos: escribís las credenciales de la cuenta de prueba y yo verifico lo que
importa, que la sesión sobreviva a recargar y a cerrar y reabrir la app.
