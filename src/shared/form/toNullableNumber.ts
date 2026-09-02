// Como toOptionalNumber, pero devuelve null (no undefined) al vaciar el input. Necesario para
// campos que se pueden "eliminar" explícitamente: axios/JSON.stringify omite las claves en
// undefined, así que un update nunca borraría un valor ya guardado -- con null sí se manda la
// clave y el backend limpia la columna. Ver Product.additionalCostPerUnit.
export function toNullableNumber(value: string): number | null {
    return value === "" ? null : Number(value)
}
