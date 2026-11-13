use leptos::prelude::*;
use leptos_router::{
    components::{Redirect, Route, Router, Routes},
    path,
};

use crate::layout::app_shell::AppShell;
use crate::pages::{
    dashboard::Dashboard,
    history::{HistoryPage, TAIWAN_VIEWER, USGS_VIEWER},
    placeholder::MenuRoutePage,
};

/// Root component: router + shell + route table.
#[component]
pub fn App() -> impl IntoView {
    view! {
        <Router>
            <AppShell>
                <Routes fallback=MenuRoutePage>
                    <Route path=path!("/") view=Dashboard />
                    // Pre-split bookmarks of /history keep working
                    <Route path=path!("/history") view=|| view! { <Redirect path="/history/taiwan" /> } />
                    <Route
                        path=path!("/history/taiwan")
                        view=|| view! { <HistoryPage viewer=&TAIWAN_VIEWER /> }
                    />
                    <Route
                        path=path!("/history/usgs")
                        view=|| view! { <HistoryPage viewer=&USGS_VIEWER /> }
                    />
                </Routes>
            </AppShell>
        </Router>
    }
}
