use leptos::prelude::*;
use leptos_icons::Icon;
use leptos_router::hooks::use_location;

use crate::components::icon_button::IconButton;
use crate::config::menu::find_title;
use crate::state::layout_state::use_layout_state;

/// Top toolbar: sidebar toggle, current page title, user area placeholder.
#[component]
pub fn Topbar() -> impl IntoView {
    let layout = use_layout_state();
    let location = use_location();
    let title = move || find_title(&location.pathname.get()).unwrap_or_default();

    view! {
        <header class="topbar">
            <IconButton
                icon=icondata::LuMenu
                label="切換選單"
                primary=true
                on_click=Callback::new(move |()| layout.toggle())
            />
            <h1 class="topbar__title">{title}</h1>
            <div class="topbar__actions">
                <Icon icon=icondata::LuCircleUser />
            </div>
        </header>
    }
}
