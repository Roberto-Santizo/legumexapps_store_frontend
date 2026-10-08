import type { TFunction } from "i18next"
import type { AriaLiveMessages, GroupBase } from "react-select"
import type { SearchableSelectOption } from "@/shared/component/searchableSelect.component"

export function searchableSelectMessages(t: TFunction) {
    const ariaLiveMessages: AriaLiveMessages<SearchableSelectOption, false, GroupBase<SearchableSelectOption>> = {
        guidance: ({ context, isSearchable, tabSelectsValue }) => {
            if (context === "menu") return t("common.selectA11y.menu", { tab: tabSelectsValue ? t("common.selectA11y.tab") : "" })
            if (context === "value") return t("common.selectA11y.value")
            return t(isSearchable ? "common.selectA11y.inputSearch" : "common.selectA11y.input")
        },
        onChange: ({ action, label, labels, isDisabled }) => {
            if (isDisabled) return t("common.selectA11y.disabled", { label })
            if (action === "clear") return t("common.selectA11y.cleared")
            if (action === "remove-value" || action === "pop-value" || action === "deselect-option") return t("common.selectA11y.removed", { label })
            if (action === "initial-input-focus") return labels.length ? t("common.selectA11y.selected", { label: labels.join(", ") }) : ""
            return t("common.selectA11y.selected", { label })
        },
        onFocus: ({ label, focused, options, selectValue, context, isDisabled, isSelected }) => {
            const rows = context === "value" ? selectValue : options
            return t("common.selectA11y.focused", {
                label, position: rows.indexOf(focused) + 1, count: rows.length,
                state: isDisabled ? t("common.selectA11y.disabledState") : "",
                selected: isSelected ? t("common.selectA11y.selectedState") : "",
            })
        },
        onFilter: ({ inputValue, resultsMessage }) => t("common.selectA11y.filtered", { input: inputValue, results: resultsMessage }),
    }
    return {
        placeholder: t("common.selectPlaceholder"),
        noOptionsMessage: () => t("common.noOptionsFound"),
        loadingMessage: () => t("common.loading"),
        screenReaderStatus: ({ count }: { count: number }) => t("common.selectA11y.results", { count }),
        ariaLiveMessages,
    }
}
