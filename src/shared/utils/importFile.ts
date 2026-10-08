export function isValidImportFile(file: Pick<File, "name" | "size">): boolean {
    return file.name.toLowerCase().endsWith(".xlsx") && file.size > 0 && file.size <= 5 * 1024 * 1024
}
