-- Consolidated NRR Migration: Table, Permissions, and View

-- 1. Create table for storing team-level innings stats
create table if not exists team_innings_stats (
    match_id text references tournament_matches(id) on delete cascade,
    team_id text,
    innings_number int,
    series_id text,
    runs int, -- Total runs including extras
    wickets int,
    overs_display text, -- e.g. "19.1"
    balls_faced int, -- Actual balls faced
    alloted_balls int, -- Max balls (e.g. 120), used for NRR if team is all out
    is_all_out boolean,
    created_at timestamp with time zone default now(),
    primary key (match_id, team_id)
);

-- 2. Grant permissions immediately
grant all on table team_innings_stats to anon, authenticated, service_role;
grant all on table team_innings_stats to postgres, dashboard_user;

-- 3. Update the view to use this new table
drop view if exists team_tournament_stats;
create or replace view team_tournament_stats as
with team_stats_aggregation as (
  select 
    series_id,
    team_id,
    count(distinct match_id) as matches_played,
    sum(runs) as runs_scored,
    -- NRR Calculation for Overs Faced:
    sum(
      case 
        when is_all_out = true or wickets = 10 then coalesce(alloted_balls, balls_faced)
        else balls_faced 
      end
    ) as total_balls_for_nrr,
    sum(wickets) as wickets_lost
  from team_innings_stats
  group by series_id, team_id
),
opponent_stats_aggregation as (
  -- Calculate Runs Conceded based on Opponents in the same match
  select
    t1.series_id,
    t1.team_id,
    sum(t2.runs) as runs_conceded,
    sum(
      case 
        when t2.is_all_out = true or t2.wickets = 10 then coalesce(t2.alloted_balls, t2.balls_faced)
        else t2.balls_faced 
      end
    ) as total_balls_bowled_for_nrr
  from team_innings_stats t1
  join team_innings_stats t2 on t1.match_id = t2.match_id and t1.team_id != t2.team_id
  group by t1.series_id, t1.team_id
)
select
  ts.series_id,
  ts.team_id,
  ts.matches_played,
  ts.runs_scored,
  ts.total_balls_for_nrr as balls_faced,
  os.runs_conceded,
  os.total_balls_bowled_for_nrr as overs_bowled_decimal
from team_stats_aggregation ts
left join opponent_stats_aggregation os on ts.series_id = os.series_id and ts.team_id = os.team_id;
