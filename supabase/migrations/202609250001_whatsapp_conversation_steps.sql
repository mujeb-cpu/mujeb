-- Expand the server-only conversation state for language choice, review, and
-- confirmation. Existing journeys keep their current state.

alter table private.whatsapp_flow_state
  drop constraint if exists whatsapp_flow_state_step_check;

alter table private.whatsapp_flow_state
  add constraint whatsapp_flow_state_step_check check (step in (
    'AWAITING_LANGUAGE','MENU','AWAITING_ORDER','AWAITING_ITEM',
    'AWAITING_QUANTITY','AWAITING_REASON','AWAITING_CONDITION',
    'AWAITING_CONFIRMATION','COMPLETE'
  ));
