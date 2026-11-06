use leptos::prelude::*;
use leptos_icons::Icon;
use leptos_router::hooks::use_location;

use crate::config::menu::{is_active, MenuEntry};
use crate::state::layout_state::use_layout_state;

/// BEM class list shared by `NavItem` links and `NavGroup` triggers.
pub(crate) fn nav_item_class(active: bool, nested: bool) -> String {
    let mut class = String::from("nav-item");
    if active {
        class.push_str(" nav-item--active");
    }
    if nested {
        class.push_str(" nav-item--nested");
    }
    class
}

/// A single sidebar link: icon, label, optional badge, active highlight.
#[component]
pub fn NavItem(
    /// Menu entry to render.
    entry: &'static MenuEntry,
    /// Rendered inside a group (indented, smaller).
    #[prop(optional)]
    nested: bool,
) -> impl IntoView {
    let location = use_location();
    let layout = use_layout_state();
    let active = move || is_active(entry.path, &location.pathname.get());
    // Labels are hidden when icon-only, so expose them as a native tooltip instead.
    let tooltip = move || (layout.icon_only() && !nested).then_some(entry.label);

    // Plain <a>: leptos_router intercepts same-origin anchor clicks for client-side navigation.
    view! {
        <a
            href=entry.path
            class=move || nav_item_class(active(), nested)
            title=tooltip
            aria-current=move || active().then_some("page")
        >
            <span class="nav-item__icon">
                <Icon icon=entry.icon />
            </span>
            <span class="nav-item__label">{entry.label}</span>
            {entry.badge.then(|| view! { <span class="nav-item__badge" aria-label="有新通知"></span> })}
        </a>
    }
}
