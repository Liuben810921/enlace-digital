-- NOT EXECUTED. Disposable psql only, after a successful committed A/B run.
\set ON_ERROR_STOP on
SET ROLE ed_intent_pool;
SELECT ed_delivery_intent_lab.apply_intent(:intent_id, :'nonce_hash') AS replay_result \gset
\if :{?replay_result}
\else
  \echo 'ERROR: no replay result'
  \quit 1
\endif
-- psql does not provide a portable SQL assertion on its variable; compare using SQL:
SELECT set_config('ed_lab.replay_result', :'replay_result', false);
DO $$ BEGIN
 IF current_setting('ed_lab.replay_result') <> 'PENDIENTE' THEN
  RAISE EXCEPTION 'Replay was not rejected';
 END IF;
END $$;
RESET ROLE;
