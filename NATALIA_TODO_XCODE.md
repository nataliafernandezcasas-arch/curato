# Lo que necesito de ti para la app

Estado al 6 de septiembre de 2026. Lo que queda son cosas que piden tu
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
rechaza apps que no aportan nada sobre el sitio. Lo que normalmente salva a una
app así son las notificaciones push, y hoy están a medias: el cliente escucha,
pero no hay tabla donde guardar el token ni nada que envíe nada.

Si Beta App Review lo rechaza, lo primero a construir es el backend de push.

---

## 3. Notificaciones push, cuando toque

En el portal de Apple hay que crear una **APNs Key**. Se descarga una sola vez,
guardala bien porque no se puede volver a bajar.

Y en Xcode, activar la capacidad **Push Notifications** en el target. Es un
botón en la pestaña Signing & Capabilities.

Del lado del servidor falta una tabla `device_tokens` y un emisor que hable con
APNs. Eso lo hago yo cuando exista la key.

---

## 4. Universal Links

Recuperar la contraseña dentro de la app está roto y no tiene arreglo sin esto.
Hace falta activar **Associated Domains** en Xcode y publicar un archivo en el
dominio. Con el Team ID ya lo puedo dejar preparado.

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
