use chrono::{NaiveDate, Utc};
use rusqlite::{Connection, params};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Clone)]
pub struct SessionEntry {
    pub id: i64,
    pub state: String,
    pub elapsed: f64,
    pub timestamp: String,
    pub date: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct DayStat {
    pub date: String,
    pub count: i64,
    pub total_minutes: f64,
}

impl Database {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        std::fs::create_dir_all(&app_data_dir)?;
        let db_path = app_data_dir.join("database.sqlite");
        let conn = Connection::open(db_path)?;

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                state TEXT NOT NULL,
                elapsed REAL NOT NULL,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);",
        )?;

        // 1 yıldan eski oturumları temizle
        let cutoff = (Utc::now() - chrono::Duration::days(365))
            .format("%Y-%m-%d")
            .to_string();
        let _ = conn.execute("DELETE FROM sessions WHERE date < ?1", params![cutoff]);

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn save_session(
        &self,
        state: &str,
        elapsed: f64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let now = Utc::now();
        let timestamp = now.to_rfc3339();
        let date = now.format("%Y-%m-%d").to_string();

        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO sessions (state, elapsed, timestamp, date) VALUES (?1, ?2, ?3, ?4)",
            params![state, elapsed, timestamp, date],
        )?;
        Ok(())
    }

    pub fn get_daily_stats(
        &self,
        date: &str,
    ) -> Result<DayStat, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT COUNT(*), COALESCE(SUM(elapsed), 0) FROM sessions WHERE date = ?1 AND state = 'work'",
        )?;

        let (count, total_seconds): (i64, f64) =
            stmt.query_row(params![date], |row| Ok((row.get(0)?, row.get(1)?)))?;

        Ok(DayStat {
            date: date.to_string(),
            count,
            total_minutes: total_seconds / 60.0,
        })
    }

    pub fn get_range_stats(
        &self,
        start_date: &str,
        end_date: &str,
    ) -> Result<Vec<DayStat>, Box<dyn std::error::Error>> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare(
            "SELECT date, COUNT(*), COALESCE(SUM(elapsed), 0)
             FROM sessions
             WHERE date >= ?1 AND date <= ?2 AND state = 'work'
             GROUP BY date
             ORDER BY date",
        )?;

        let rows = stmt.query_map(params![start_date, end_date], |row| {
            Ok(DayStat {
                date: row.get(0)?,
                count: row.get(1)?,
                total_minutes: {
                    let secs: f64 = row.get(2)?;
                    secs / 60.0
                },
            })
        })?;

        let mut stats = Vec::new();
        for row in rows {
            stats.push(row?);
        }
        Ok(stats)
    }

    pub fn get_weekly_stats(
        &self,
        week_start: &str,
    ) -> Result<Vec<DayStat>, Box<dyn std::error::Error>> {
        let start = NaiveDate::parse_from_str(week_start, "%Y-%m-%d")?;
        let end = start + chrono::Duration::days(6);
        self.get_range_stats(week_start, &end.format("%Y-%m-%d").to_string())
    }

    pub fn get_monthly_stats(
        &self,
        year: i32,
        month: u32,
    ) -> Result<Vec<DayStat>, Box<dyn std::error::Error>> {
        let start = NaiveDate::from_ymd_opt(year, month, 1)
            .ok_or("Invalid date")?;
        let end = if month == 12 {
            NaiveDate::from_ymd_opt(year + 1, 1, 1)
        } else {
            NaiveDate::from_ymd_opt(year, month + 1, 1)
        }
        .ok_or("Invalid date")?
            - chrono::Duration::days(1);

        self.get_range_stats(
            &start.format("%Y-%m-%d").to_string(),
            &end.format("%Y-%m-%d").to_string(),
        )
    }
}
