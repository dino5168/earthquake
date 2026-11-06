use leptos::prelude::*;

/// White surface container with optional header.
#[component]
pub fn Card(
    /// Header text; omitted when `None`.
    #[prop(optional, into)]
    title: Option<String>,
    children: Children,
) -> impl IntoView {
    view! {
        <section class="card">
            {title.map(|t| view! { <h2 class="card__header">{t}</h2> })}
            <div class="card__body">{children()}</div>
        </section>
    }
}
