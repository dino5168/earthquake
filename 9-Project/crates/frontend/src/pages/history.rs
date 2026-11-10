use leptos::prelude::*;

/// Static sub-site built from `9-Project/viz/eq-3d` and copied in by Trunk.
const VIEWER_URL: &str = "/viz/eq-3d/index.html";

/// 歷史查詢: embeds the three.js earthquake point-cloud viewer.
///
/// An iframe keeps three.js out of the main WASM bundle, isolates its CSS, and
/// frees the WebGL context automatically when the route unmounts.
#[component]
pub fn HistoryPage() -> impl IntoView {
    view! {
        <div class="history-page">
            <iframe
                class="history-page__viewer"
                src=VIEWER_URL
                title="台灣地震 3D 點雲（1990–2025）"
                allow="fullscreen"
            ></iframe>
        </div>
    }
}
