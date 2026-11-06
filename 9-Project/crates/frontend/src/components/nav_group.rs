use leptos::prelude::*;
use leptos_icons::Icon;
use leptos_router::hooks::use_location;

use crate::components::nav_item::{nav_item_class, NavItem};
use crate::config::menu::{is_active, MenuEntry};

/// Expandable sidebar group.
///
/// Expanded sidebar: the trigger toggles an accordion. Icon-only sidebar: children
/// appear as a hover/focus flyout (pure CSS, see `_nav-group.scss`).
#[component]
pub fn NavGroup(
    /// Group entry; its `children` are rendered as nested items.
    entry: &'static MenuEntry,
) -> impl IntoView {
    let location = use_location();
    let active = Memo::new(move |_| is_active(entry.path, &location.pathname.get()));
    let open = RwSignal::new(active.get_untracked());

    // Navigating into the group (e.g. via a deep link) should reveal the current child.
    Effect::new(move |_| {
        if active.get() {
            open.set(true);
        }
    });

    let group_class = move || {
        if open.get() {
            "nav-group nav-group--open"
        } else {
            "nav-group"
        }
    };

    view! {
        <div class=group_class>
            <button
                type="button"
                class=move || format!("{} nav-group__trigger", nav_item_class(active.get(), false))
                aria-expanded=move || open.get().to_string()
                on:click=move |_| open.update(|o| *o = !*o)
            >
                <span class="nav-item__icon">
                    <Icon icon=entry.icon />
                </span>
                <span class="nav-item__label">{entry.label}</span>
                <span class="nav-item__chevron">
                    <Icon icon=icondata::LuChevronRight />
                </span>
            </button>
            <div class="nav-group__children">
                <div class="nav-group__flyout-title">{entry.label}</div>
                {entry
                    .children
                    .iter()
                    .map(|child| view! { <NavItem entry=child nested=true /> })
                    .collect_view()}
            </div>
        </div>
    }
}
