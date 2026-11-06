//! Global layout UI state (sidebar collapse, mobile drawer), shared via context.

use codee::string::FromToStringCodec;
use leptos::prelude::*;
use leptos_use_media_query::use_media_query;
use leptos_use_storage::use_local_storage;

/// localStorage key for the desktop collapse preference.
const COLLAPSED_KEY: &str = "eq.sidebar.collapsed";
/// Must match `$mobile-max` in `styles/_tokens.scss`.
const MOBILE_QUERY: &str = "(max-width: 767px)";

/// Sidebar/drawer state provided by `AppShell`.
#[derive(Clone, Copy)]
pub struct LayoutState {
    /// Desktop: sidebar shows icons only. Persisted across reloads.
    pub collapsed: Signal<bool>,
    set_collapsed: WriteSignal<bool>,
    /// Mobile: drawer is open.
    pub mobile_open: RwSignal<bool>,
    /// Viewport is below the mobile breakpoint.
    pub is_mobile: Signal<bool>,
}

impl LayoutState {
    /// Create the state; call once in `AppShell` and `provide_context` it.
    pub fn new() -> Self {
        let (collapsed, set_collapsed, _) =
            use_local_storage::<bool, FromToStringCodec>(COLLAPSED_KEY);
        Self {
            collapsed,
            set_collapsed,
            mobile_open: RwSignal::new(false),
            is_mobile: use_media_query(MOBILE_QUERY),
        }
    }

    /// Hamburger action: toggles the drawer on mobile, the collapse state on desktop.
    pub fn toggle(&self) {
        if self.is_mobile.get_untracked() {
            self.mobile_open.update(|open| *open = !*open);
        } else {
            self.set_collapsed
                .update(|collapsed| *collapsed = !*collapsed);
        }
    }

    /// Whether the sidebar renders icon-only; the mobile drawer is always full width.
    pub fn icon_only(&self) -> bool {
        self.collapsed.get() && !self.is_mobile.get()
    }
}

/// Access the [`LayoutState`] provided by `AppShell`.
///
/// # Panics
/// If called outside `AppShell` (a programming error, not a runtime condition).
pub fn use_layout_state() -> LayoutState {
    expect_context::<LayoutState>()
}
