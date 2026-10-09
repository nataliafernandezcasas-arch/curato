// qr.js no trae tipos. Es lo que usa react-qr-code por dentro; aquí se usa
// para dibujar el QR del correo en el servidor (src/lib/codigo-visita.ts).
declare module "qr.js/lib/QRCode" {
  export default class QRCode {
    constructor(typeNumber: number, errorCorrectLevel: number);
    addData(data: string): void;
    make(): void;
    modules: boolean[][];
    getModuleCount(): number;
  }
}
declare module "qr.js/lib/ErrorCorrectLevel" {
  const niveles: { L: number; M: number; Q: number; H: number };
  export default niveles;
}
