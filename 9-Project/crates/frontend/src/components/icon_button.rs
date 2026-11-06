use icondata::Icon as IconData;
use leptos::prelude::*;
use leptos_icons::Icon;

/// Square icon-only button (toolbar actions).
#[component]
pub fn IconButton(
    /// Lucide icon.
    icon: IconData,
    /// Accessible label, also shown as tooltip.
    label: &'static str,
    /// Click handler.
    on_click: Callback<()>,
    /// Filled accent style instead of the soft default.
    #[prop(optional)]
    primary: bool,
) -> impl IntoView {
    let class = if primary {
        "icon-button icon-button--primary"
    } else {
        "icon-button"
    };
    view! {
        <button type="button" class=class aria-label=label title=label on:click=move |_| on_click.run(())>
            <Icon icon=icon />
        </button>
    }
}
