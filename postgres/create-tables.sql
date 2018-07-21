CREATE TABLE IF NOT EXISTS tasks (
  id            serial          PRIMARY KEY NOT NULL,
  assigned_to   varchar(200)    NULL,
  cancelled     bit             NULL,
  completed_by  varchar(100)    NULL,
  date_completed timestamp      NULL,
  description   varchar(2048)   NULL,
  start_time    timestamp       NULL,
  title         varchar(140)    NOT NULL
);

