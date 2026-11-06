use leptos::prelude::*;
use leptos_icons::Icon;

use crate::components::{nav_group::NavGroup, nav_item::NavItem};
use crate::config::menu::MENU;

/// Left navigation panel rendered from [`MENU`]. Collapse/drawer styling comes
/// from modifier classes on the parent `AppShell`.
#[component]
pub fn Sidebar() -> impl IntoView {
    let entries = MENU
        .iter()
        .map(|entry| {
            if entry.children.is_empty() {
                view! { <NavItem entry=entry /> }.into_any()
            } else {
                view! { <NavGroup entry=entry /> }.into_any()
            }
        })
        .collect_view();

    view! {
        <aside class="sidebar">
            <div class="sidebar__brand">
                <span class="sidebar__logo">
                    <Icon icon=icondata::LuActivity />
                </span>
                <span class="sidebar__title">"十方地震監測網"</span>
            </div>
            <nav class="sidebar__nav" aria-label="主選單">
                {entries}
            </nav>
        </aside>
    }
}
