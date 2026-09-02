// Para <select> nativos que representan un booleano con dos opciones fijas en código
// (value="true" / value="false"), en vez de un checkbox. Ver toOptionalNumber.ts para el
// equivalente numérico.
export function toBoolean(value: string): boolean {
    return value === "true"
}
