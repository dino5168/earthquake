use leptos::prelude::*;

/// One embedded 3D viewer page.
///
/// Viewers are static pages built from `9-Project/viz/eq-3d` and copied in by
/// Trunk. URLs use the directory form: Cloudflare Pages 308-redirects
/// `.../index.html` to it.
pub struct Viewer {
    /// iframe source.
    pub src: &'static str,
    /// Accessible iframe title.
    pub title: &'static str,
}

/// 歷史查詢 → 台灣: CWA catalog 1990–2025 over Taiwan terrain.
pub const TAIWAN_VIEWER: Viewer = Viewer {
    src: "/viz/eq-3d/",
    title: "台灣地震 3D 點雲（1990–2025）",
};

/// 歷史查詢 → USGS 全球: globe that queries the USGS event service live.
pub const USGS_VIEWER: Viewer = Viewer {
    src: "/viz/eq-3d/usgs/",
    title: "全球地震 3D（USGS）",
};

/// 歷史查詢 page body: embeds a three.js earthquake viewer.
///
/// An iframe keeps three.js out of the main WASM bundle, isolates its CSS, and
/// frees the WebGL context automatically when the route unmounts.
#[component]
pub fn HistoryPage(
    /// Viewer to embed.
    viewer: &'static Viewer,
) -> impl IntoView {
    view! {
        <div class="history-page">
            <iframe
                class="history-page__viewer"
                src=viewer.src
                title=viewer.title
                allow="fullscreen"
            ></iframe>
        </div>
    }
}
