use leptos::prelude::*;

use crate::components::card::Card;

/// Single KPI tile: caption, value, and a muted hint line.
#[component]
pub fn StatCard(
    /// Caption above the value.
    #[prop(into)]
    title: String,
    /// Main figure.
    #[prop(into)]
    value: String,
    /// Secondary note below the value.
    #[prop(optional, into)]
    hint: Option<String>,
) -> impl IntoView {
    view! {
        <Card>
            <p class="stat-card__title">{title}</p>
            <p class="stat-card__value">{value}</p>
            {hint.map(|h| view! { <p class="stat-card__hint">{h}</p> })}
        </Card>
    }
}
