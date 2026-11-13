//! Sidebar menu definition (data-driven) and pure path helpers.
//!
//! Adding a page: append a [`MenuEntry`] here. Routes without a dedicated page
//! automatically render the shared placeholder page (see `pages::placeholder`).

use icondata::Icon;

/// One sidebar entry. Entries with `children` render as an expandable group.
pub struct MenuEntry {
    /// Display label.
    pub label: &'static str,
    /// Route path; for groups, the common prefix of all children.
    pub path: &'static str,
    /// Lucide icon.
    pub icon: Icon,
    /// Show a red notification dot.
    pub badge: bool,
    /// Sub-entries; empty for a plain link.
    pub children: &'static [MenuEntry],
}

impl MenuEntry {
    const fn link(label: &'static str, path: &'static str, icon: Icon) -> Self {
        Self {
            label,
            path,
            icon,
            badge: false,
            children: &[],
        }
    }

    const fn with_badge(mut self) -> Self {
        self.badge = true;
        self
    }
}

/// Sidebar menu, top to bottom.
pub static MENU: &[MenuEntry] = &[
    MenuEntry::link("儀表板", "/", icondata::LuLayoutDashboard),
    MenuEntry::link("即時監測", "/realtime", icondata::LuActivity),
    MenuEntry {
        label: "歷史查詢",
        path: "/history",
        icon: icondata::LuHistory,
        badge: false,
        children: &[
            MenuEntry::link("台灣", "/history/taiwan", icondata::LuMapPin),
            MenuEntry::link("USGS 全球", "/history/usgs", icondata::LuGlobe),
        ],
    },
    MenuEntry::link("感測器管理", "/sensors", icondata::LuRadioTower),
    MenuEntry::link("告警事件", "/alerts", icondata::LuBellRing).with_badge(),
    MenuEntry::link("報表", "/reports", icondata::LuChartColumn),
    MenuEntry {
        label: "子選單測試",
        path: "/demo",
        icon: icondata::LuFlaskConical,
        badge: false,
        children: &[
            MenuEntry::link("子頁 A", "/demo/a", icondata::LuFileText),
            MenuEntry::link("子頁 B", "/demo/b", icondata::LuFileText),
        ],
    },
    MenuEntry::link("系統設定", "/settings", icondata::LuSettings),
];

/// Whether a menu path should be highlighted for the current location.
///
/// `/` matches only itself; other paths match themselves and their sub-paths
/// on a segment boundary (`/demo` matches `/demo/a` but not `/demolition`).
pub fn is_active(entry_path: &str, current: &str) -> bool {
    let current = normalize(current);
    if entry_path == "/" {
        return current == "/";
    }
    current == entry_path
        || current
            .strip_prefix(entry_path)
            .is_some_and(|rest| rest.starts_with('/'))
}

/// Label of the menu entry (or sub-entry) whose path equals `path`.
pub fn find_title(path: &str) -> Option<&'static str> {
    let path = normalize(path);
    MENU.iter()
        .flat_map(|entry| std::iter::once(entry).chain(entry.children))
        .find(|entry| entry.path == path)
        .map(|entry| entry.label)
}

/// Strip a trailing slash so `/history/` and `/history` are treated alike.
fn normalize(path: &str) -> &str {
    match path.trim_end_matches('/') {
        "" => "/",
        trimmed => trimmed,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn menu_paths_are_unique() {
        let mut seen = HashSet::new();
        for entry in MENU
            .iter()
            .flat_map(|e| std::iter::once(e).chain(e.children))
        {
            assert!(seen.insert(entry.path), "duplicate path {}", entry.path);
        }
    }

    #[test]
    fn children_share_group_prefix() {
        for group in MENU.iter().filter(|e| !e.children.is_empty()) {
            for child in group.children {
                assert!(
                    is_active(group.path, child.path),
                    "{} outside {}",
                    child.path,
                    group.path
                );
            }
        }
    }

    #[test]
    fn root_matches_only_itself() {
        assert!(is_active("/", "/"));
        assert!(!is_active("/", "/history"));
    }

    #[test]
    fn prefix_matches_on_segment_boundary() {
        assert!(is_active("/demo", "/demo"));
        assert!(is_active("/demo", "/demo/a"));
        assert!(is_active("/demo", "/demo/"));
        assert!(!is_active("/demo", "/demolition"));
    }

    #[test]
    fn find_title_resolves_entries_and_children() {
        assert_eq!(find_title("/"), Some("儀表板"));
        assert_eq!(find_title("/history/"), Some("歷史查詢"));
        assert_eq!(find_title("/history/usgs"), Some("USGS 全球"));
        assert_eq!(find_title("/demo/b"), Some("子頁 B"));
        assert_eq!(find_title("/nope"), None);
    }
}
