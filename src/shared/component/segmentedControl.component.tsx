interface SegmentedControlProps<T extends string> {
    label: string
    value: T
    // `title`: texto completo cuando la etiqueta visible es una abreviatura.
    options: { value: T; label: string; title?: string }[]
    onChange: (value: T) => void
}

// Selector compacto de una opción (botones con aria-pressed). En móvil ocupa todo el ancho en partes iguales.
export function SegmentedControl<T extends string>({ label, value, options, onChange }: Readonly<SegmentedControlProps<T>>) {
    return (
        <div
            role="group"
            aria-label={label}
            className="grid w-full auto-cols-fr grid-flow-col rounded-control border border-line bg-canvas p-0.5 sm:inline-grid sm:w-auto"
        >
            {options.map(option => {
                const selected = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        title={option.title}
                        aria-label={option.title}
                        aria-pressed={selected}
                        onClick={() => onChange(option.value)}
                        className={`min-h-10 whitespace-nowrap rounded-[calc(var(--radius-control)-2px)] px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                            selected ? "bg-surface text-ink-900 shadow-panel" : "text-ink-600 hover:text-ink-900"
                        }`}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
