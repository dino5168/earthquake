use leptos::prelude::*;

use crate::components::{card::Card, stat_card::StatCard};

/// Placeholder until the data APIs exist (Phase 3/4).
const NO_DATA: &str = "—";

/// Home dashboard: KPI tiles and a trend chart area.
#[component]
pub fn Dashboard() -> impl IntoView {
    view! {
        <div class="dashboard">
            <div class="dashboard__stats">
                <StatCard title="感測器總數" value=NO_DATA hint="等待資料串接" />
                <StatCard title="今日資料筆數" value=NO_DATA hint="每小時更新" />
                <StatCard title="最近一次寫入" value=NO_DATA hint="等待資料串接" />
                <StatCard title="未處理告警" value=NO_DATA hint="等待資料串接" />
            </div>
            <Card title="震動趨勢">
                <div class="dashboard__chart-placeholder">"圖表將於 Phase 4 實作"</div>
            </Card>
        </div>
    }
}
