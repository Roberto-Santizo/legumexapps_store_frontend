// Rango de fechas "YYYY-MM-DD" (hora de Guatemala), tal como los produce un <input type="date">.
// null = sin límite en ese extremo.
export interface DateRange {
    startDate: string | null
    endDate: string | null
}
