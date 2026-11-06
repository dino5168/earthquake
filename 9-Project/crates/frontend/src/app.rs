use leptos::prelude::*;
use leptos_router::{
    components::{Route, Router, Routes},
    path,
};

use crate::layout::app_shell::AppShell;
use crate::pages::{dashboard::Dashboard, placeholder::MenuRoutePage};

/// Root component: router + shell + route table.
#[component]
pub fn App() -> impl IntoView {
    view! {
        <Router>
            <AppShell>
                <Routes fallback=MenuRoutePage>
                    <Route path=path!("/") view=Dashboard />
                </Routes>
            </AppShell>
        </Router>
    }
}
