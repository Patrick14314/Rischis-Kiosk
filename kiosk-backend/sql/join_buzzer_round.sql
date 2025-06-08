create or replace function join_buzzer_round(
  p_round_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
as $$
declare
  v_bet numeric;
begin
  select bet into v_bet from buzzer_rounds where id = p_round_id;

  if exists (
    select 1 from buzzer_participants
    where round_id = p_round_id and user_id = p_user_id
  ) then
    raise exception 'already joined';
  end if;

  insert into buzzer_participants(id, round_id, user_id)
    values (gen_random_uuid(), p_round_id, p_user_id);

  update users
    set balance = balance - v_bet
    where id = p_user_id;
end;
$$;
