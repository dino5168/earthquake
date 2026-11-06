use leptos::prelude::*;
use leptos_router::hooks::use_location;

use crate::layout::{sidebar::Sidebar, topbar::Topbar};
use crate::state::layout_state::LayoutState;

/// Page skeleton: sidebar, overlay (mobile), topbar, and routed content.
/// Owns and provides [`LayoutState`].
#[component]
pub fn AppShell(children: Children) -> impl IntoView {
    let layout = LayoutState::new();
    provide_context(layout);

    // Navigating from the mobile drawer should reveal the new page.
    let location = use_location();
    Effect::new(move |_| {
        location.pathname.track();
        layout.mobile_open.set(false);
    });

    // All collapse/drawer styling hangs off these root modifiers, so children stay stateless.
    let shell_class = move || {
        let mut class = String::from("app-shell");
        if layout.icon_only() {
            class.push_str(" app-shell--collapsed");
        }
        if layout.mobile_open.get() {
            class.push_str(" app-shell--drawer-open");
        }
        class
    };

    view! {
        <div class=shell_class>
            <Sidebar />
            <div class="app-shell__overlay" on:click=move |_| layout.mobile_open.set(false)></div>
            <div class="app-shell__main">
                <Topbar />
                <main class="app-shell__content">{children()}</main>
            </div>
        </div>
    }
}
