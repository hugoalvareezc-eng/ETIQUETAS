// Los navegadores usan 96px = 1 pulgada como referencia para unidades CSS
// físicas (cm, mm, in), tanto en pantalla como al imprimir. Usamos la misma
// constante para convertir de vuelta los px medidos en el DOM a cm.
export const PX_PER_CM = 96 / 2.54;

export function cmToPx(cm: number): number {
  return cm * PX_PER_CM;
}

export function pxToCm(px: number): number {
  return px / PX_PER_CM;
}
