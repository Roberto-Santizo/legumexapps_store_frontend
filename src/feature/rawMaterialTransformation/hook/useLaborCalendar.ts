import { useEffect, useState } from "react"
import { currentLaborCalendar } from "@/feature/rawMaterialTransformation/util/laborTemplateForm"

export function useLaborCalendar() {
    const [calendar, setCalendar] = useState(currentLaborCalendar)
    useEffect(() => {
        const refresh = () => {
            const next = currentLaborCalendar()
            setCalendar(previous => previous.calendarYear === next.calendarYear ? previous : next)
        }
        // Also refresh a form left open across New Year, including a suspended browser tab.
        const timer = setInterval(refresh, 60_000)
        window.addEventListener("focus", refresh)
        return () => { clearInterval(timer); window.removeEventListener("focus", refresh) }
    }, [])
    return calendar
}
