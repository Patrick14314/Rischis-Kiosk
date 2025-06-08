create or replace function refund_buzzer_round(
  p_round_id uuid
)
returns void
language plpgsql
as $$
declare
  v_bet numeric;
begin
  select bet into v_bet from buzzer_rounds where id = p_round_id;

  update users
    set balance = balance + v_bet
    where id in (
      select user_id from buzzer_participants where round_id = p_round_id
    );
end;
$$;
