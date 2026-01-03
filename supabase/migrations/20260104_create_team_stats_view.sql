-- Create a view to aggregate team stats for NRR calculation
-- NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)

create or replace view team_tournament_stats as
with team_batting_stats as (
  -- Calculate Runs Scored & Balls Faced (approx for Overs Faced)
  select 
    m.series_id,
    b.team_id,
    count(distinct m.id) as matches_played, -- This might be double counting if counting innings, verify specific logic later
    sum(b.runs) as runs_scored,
    sum(b.balls) as balls_faced
  from batting_innings b
  join tournament_matches m on b.match_id = m.id
  group by m.series_id, b.team_id
),
team_bowling_stats as (
  -- Calculate Runs Conceded & Overs Bowled
  select 
    m.series_id,
    bowl.team_id,
    sum(bowl.runs) as runs_conceded,
    sum(bowl.overs) as overs_bowled_decimal -- stored as 3.4 etc. Need to be careful with decimal overs logic for NRR
  from bowling_innings bowl
  join tournament_matches m on bowl.match_id = m.id
  group by m.series_id, bowl.team_id
)
select
  tb.series_id,
  tb.team_id,
  tb.runs_scored,
  tb.balls_faced,
  tbo.runs_conceded,
  tbo.overs_bowled_decimal,
  -- Basic NRR Calculation (Approximation: treat decimal overs as pure float for now, refine later if needed)
  -- Overs Faced = balls_faced / 6
  -- Overs Bowled = needs conversion from 3.4 to 3.666
  
  -- We'll return raw sums and let client handle precise NRR float math or handle it here?
  -- Let's return raw sums for maximum flexibility in UI
  tbo.overs_bowled_decimal as total_overs_bowled_raw
from team_batting_stats tb
left join team_bowling_stats tbo on tb.series_id = tbo.series_id and tb.team_id = tbo.team_id;
