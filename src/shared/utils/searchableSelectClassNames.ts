
function optionClassName(state: { isSelected: boolean; isFocused: boolean }): string {
    if (state.isSelected) return "bg-action-primary text-action-primary-text"
    if (state.isFocused) return "bg-canvas text-ink-900"
    return "text-ink-900"
}

export function buildSearchableSelectClassNames(hasError: boolean) {
    return {
        control: (state: { isFocused: boolean }) =>
            `min-h-control rounded-control border bg-surface px-2 transition ${
                hasError ? "border-danger-border" : "border-line"
            } ${state.isFocused ? "border-focus ring-2 ring-focus ring-offset-2 ring-offset-surface" : ""}`,
        valueContainer: () => "gap-1 py-1",
        placeholder: () => "text-ink-600",
        input: () => "text-ink-900",
        singleValue: () => "text-ink-900",
        indicatorsContainer: () => "gap-1",
        clearIndicator: () => "cursor-pointer px-1 text-ink-600 hover:text-ink-900",
        dropdownIndicator: () => "cursor-pointer px-1 text-ink-600",
        indicatorSeparator: () => "hidden",
        menu: () => "z-20 mt-1 overflow-hidden rounded-control border border-line bg-surface shadow-panel",
        menuList: () => "py-1",
        option: (state: { isSelected: boolean; isFocused: boolean }) => `cursor-pointer px-4 py-2.5 text-sm ${optionClassName(state)}`,
        noOptionsMessage: () => "px-4 py-2.5 text-sm text-ink-600",
    }
}
