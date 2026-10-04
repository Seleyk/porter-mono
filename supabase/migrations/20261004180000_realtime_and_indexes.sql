-- Turn on Realtime for the tables the apps subscribe to, and add the indexes
-- the job feed and history screens need.

alter publication supabase_realtime add table
  public.service_requests,
  public.porter_locations,
  public.messages;

create index if not exists service_requests_customer_id_idx on public.service_requests (customer_id, created_at desc);
create index if not exists service_requests_porter_id_idx   on public.service_requests (porter_id, created_at desc);
create index if not exists service_requests_open_idx        on public.service_requests (created_at) where status = 'pending' and porter_id is null;
create index if not exists messages_request_id_idx          on public.messages (request_id, created_at);
create index if not exists ratings_request_id_idx           on public.ratings (request_id);
create index if not exists ratings_rated_id_idx             on public.ratings (rated_id);
create index if not exists delivery_tracking_request_id_idx on public.delivery_tracking (service_request_id);
create index if not exists porter_box_orders_customer_idx   on public.porter_box_orders (customer_id) where is_collected = false;

-- Advisor warning: function with a mutable search_path.
alter function public.update_updated_at_column() set search_path = '';
