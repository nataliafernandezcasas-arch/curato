# Curato → App (App Store + Play Store)

Plan para publicar Curato como app descargable usando **Capacitor**.
La app carga el sitio de producción (`curatocollective.com`) dentro de una cáscara
nativa y le agrega funciones nativas (push, splash, ícono). Así reutilizamos toda
la web que ya existe, sin rehacer nada.

---

## ✅ Hecho (rama `feature/capacitor-app`)
- Instalado Capacitor (core, cli, ios, android) — v8.4.2
- `capacitor.config.ts` → appId `com.curatocollective.app`, appName **Curato**, apunta a `https://www.curatocollective.com`
- `mobile/www/index.html` → pantalla de respaldo si no hay internet
- **CocoaPods instalado** (Homebrew, v1.17.0)
- **Proyecto iOS creado** (`ios/`, usa Swift Package Manager)
- **Proyecto Android creado** (`android/`)
- **Ícono generado** = la "c" con la línea del logo (igual al favicon), fondo oscuro
- **Splash generado** = wordmark "curato" centrado en fondo oscuro
- Assets aplicados a iOS + Android (`assets/icon.png`, `assets/splash.png`)

## ⏳ Pendiente técnico (yo lo hago)
1. **Build de prueba** en simulador iOS / emulador Android
2. **Probar el login de Supabase** dentro del WebView (punto crítico)
3. **Notificaciones push** (clave para que Apple no rechace por "solo web"):
   plugin `@capacitor/push-notifications` + Firebase (Android) y APNs (iOS)
4. Ajustes nativos: safe-area (notch), status bar oscuro, gestos de retroceso, pantalla offline

## 🙋 Haces TÚ (cuando estemos listos para publicar)
1. **Apple Developer Program** — 99 €/año → developer.apple.com
2. **Google Play Console** — 25 € una vez → play.google.com/console
3. Textos e imágenes de la ficha de tienda (descripción, capturas, categoría)
4. Política de privacidad pública (ya tienes `/privacidad`, sirve)
5. Aprobar la publicación desde tu cuenta

## ⚠️ Riesgos a tener en cuenta
- **Apple, regla 4.2:** rechazan apps que son "solo una web envuelta". Se resuelve
  agregando push + experiencia nativa (splash, gestos, offline). Lo haremos.
- **Login:** el inicio de sesión de Supabase debe funcionar dentro del WebView
  (revisar redirecciones de auth). Es un punto a probar bien.
- **Cada cambio de la web** se refleja solo en la app (porque carga la web en vivo),
  salvo cambios nativos (ícono, push), que requieren volver a publicar.

## Comandos útiles (referencia)
```bash
npx cap add ios          # crea el proyecto Xcode (necesita CocoaPods)
npx cap add android      # crea el proyecto Android Studio
npx cap sync             # sincroniza config y plugins
npx cap open ios         # abre en Xcode
npx cap open android     # abre en Android Studio
```
