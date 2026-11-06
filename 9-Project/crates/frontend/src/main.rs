use leptos::prelude::*;

fn main() {
    console_error_panic_hook::set_once();
    leptos::mount::mount_to_body(App);
}

/// Root component.
#[component]
fn App() -> impl IntoView {
    view! {
        <main>
            <h1>"十方地震監測網"</h1>
            <p>"Earthquake monitoring network — skeleton"</p>
        </main>
    }
}
