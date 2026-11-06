use leptos::prelude::*;
use leptos_icons::Icon;
use leptos_router::hooks::use_location;

use crate::components::card::Card;
use crate::config::menu::find_title;

/// Shared "under construction" / "not found" page body.
#[component]
pub fn PlaceholderPage(
    /// Heading.
    title: &'static str,
    /// Explanatory line below the heading.
    message: &'static str,
) -> impl IntoView {
    view! {
        <Card>
            <div class="placeholder-page">
                <span class="placeholder-page__icon">
                    <Icon icon=icondata::LuConstruction />
                </span>
                <h2 class="placeholder-page__title">{title}</h2>
                <p class="placeholder-page__message">{message}</p>
            </div>
        </Card>
    }
}

/// Catch-all route: any menu path without a dedicated page renders the
/// placeholder, so adding a menu entry needs no new route.
#[component]
pub fn MenuRoutePage() -> impl IntoView {
    let location = use_location();
    move || match find_title(&location.pathname.get()) {
        Some(title) => {
            view! { <PlaceholderPage title=title message="此頁面建置中，將於後續階段實作。" /> }
        }
        None => {
            view! { <PlaceholderPage title="找不到頁面" message="請確認網址，或由左側選單進入。" /> }
        }
    }
}
