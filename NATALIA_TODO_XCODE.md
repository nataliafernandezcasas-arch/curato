# Lo que necesito de ti para la app

Estado al 26 de septiembre de 2026. Lo que queda son cosas que piden tu
contraseña o tu identidad como persona, así que no las puedo hacer yo.

---

## Resuelto

- **Xcode.** Instalado, licencia aceptada, simuladores disponibles.
- **Cuenta de Apple Developer.** Usamos la de Isabella Fernandez Abrahan, cuenta
  individual, Team ID `P76GMA4YCZ`, vigente hasta el 10 de abril de 2027.
- **App creada en App Store Connect** como *Curato Collective*, con Bundle ID
  `com.curatocollective.app`.
- **Primer build subido a TestFlight** el 6 de septiembre, versión 1.0 (1).

En el repo quedó configurado el equipo de firma, la declaración de criptografía
(`ITSAppUsesNonExemptEncryption`) y el manifiesto de privacidad
(`PrivacyInfo.xcprivacy`), que Apple exige desde 2024.

---

## 1. Antes de invitar a los testers

**Rellenar App Privacy** en App Store Connect, en la barra lateral izquierda de
la app. Hace falta antes de poder distribuir a testers externos. El contenido
sale de lo que ya está escrito en `/privacidad`.

**Rellenar Test Information** en la pestaña TestFlight: un email de contacto y
las credenciales de una cuenta de prueba. Sin la cuenta, el revisor de Apple se
topa con el login y no puede entrar, y eso es rechazo seguro. Para eso sirve la
cuenta `apercu` que ya existe.

**Los testers van en un grupo externo.** El primer build de un grupo externo
pasa por Beta App Review, que tarda uno o dos días. Los testers internos no
pasan revisión, pero un tester interno es un usuario de la cuenta de tu hermana,
así que no sirve para gente de fuera.

---

## 2. El riesgo que hay que vigilar

Curato es una web dentro de una cáscara nativa, y la **regla 4.2 de Apple**
rechaza apps que no aportan nada sobre el sitio. Lo que salva a una app así son
las notificaciones. Ya están construidas enteras de este lado: la tabla, el
registro del aparato, el emisor que habla con APNs y los cuatro avisos. Solo
falta la llave de Apple, que es el punto 3.

---

## 3. Notificaciones push: lo que falta es tuyo

Todo lo demás está hecho. Quedan tres cosas que piden tu cuenta:

1. **Crear la APNs Key** en el portal de Apple, en Certificates, Identifiers &
   Profiles → Keys, marcando *Apple Push Notifications service*. Se descarga un
   archivo `.p8` **una sola vez**: guardalo bien, no se puede volver a bajar.
   Anotá también el Key ID, que son diez caracteres.
2. **Pasarme las dos cosas** para ponerlas en Vercel: `APNS_KEY_ID` y
   `APNS_PRIVATE_KEY` (el contenido del `.p8`). Sin ellas la app funciona
   igual, simplemente no sale ningún aviso.
3. **En Xcode**, pestaña *Signing & Capabilities* del target App: botón
   **+ Capability** → **Push Notifications**, y comprobar que **Associated
   Domains** también aparece. Los dos ya están escritos en `App.entitlements`,
   así que Xcode debería mostrarlos solos; si no, se añaden con ese botón.

Los cuatro avisos, y ninguno más: visita confirmada, visita rechazada, quedan
seis horas para publicar y, para la casa, nueva demanda. Cada uno abre su
pantalla. No hay bandeja de entrada.

Nadie recibe nada sin haberlo pedido: la app no pregunta al arrancar, hay una
fila en Réglages que dice de qué se avisa y ahí se enciende.

---

## 4. Universal Links: hecho

Recuperar la contraseña dentro de la app estaba roto porque el enlace del correo
abría Safari y la sesión se quedaba fuera. Ya está: la app reclama
`curatocollective.com` en `App.entitlements` y el sitio sirve el archivo que
Apple pide en `/.well-known/apple-app-site-association`.

Dos avisos: el archivo tiene que estar publicado **antes** de instalar la app,
porque iOS lo comprueba al instalar; y si algún día se cambia el Team ID, hay
que cambiarlo también en `src/app/.well-known/apple-app-site-association/`.

---

## 5. Android, cuando quieras

No hay nada de Android instalado en tu Mac. El código ya está listo y
commiteado, falta el entorno.

1. **JDK 21**: https://adoptium.net/temurin/releases/?version=21 (instalador
   `.pkg`, chip Apple Silicon = aarch64).
2. **Android Studio**: https://developer.android.com/studio, instalación
   estándar.

Publicar en Google Play son 25 € por única vez, en
https://play.google.com/console/signup.

---

## 6. Lo único que no puedo probar yo

Iniciar sesión de verdad dentro de la app. Yo no escribo contraseñas en
formularios, así que ese paso lo hacés vos y yo verifico lo que importa: que la
sesión sobreviva a recargar y a cerrar y reabrir la app.
