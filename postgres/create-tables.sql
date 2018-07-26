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

CREATE TABLE IF NOT EXISTS items (
  date_added    timestamp       NOT NULL,
  date_modified timestamp       NULL,
  description   varchar(2048)   NULL,
  id            serial          PRIMARY KEY NOT NULL,
  is_container  boolean         NOT NULL DEFAULT false,
  name          varchar(140)    NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id            serial          PRIMARY KEY NOT NULL,
  date_added    timestamp       NOT NULL,
  date_modified timestamp       NULL,
  description   varchar(2048)   NULL,
  name          varchar(140)    NOT NULL
);

CREATE TABLE IF NOT EXISTS itemlocations (
  item_id       int             NOT NULL REFERENCES items,
  location_id   int             NOT NULL REFERENCES locations,
  date_added    timestamp       NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id            serial          PRIMARY KEY NOT NULL,
  date_added    timestamp       NOT NULL,
  hidden        boolean         NOT NULL DEFAULT false,
  name          varchar(140)    NOT NULL
);

CREATE TABLE IF NOT EXISTS itemtags (
  item_id       int             NOT NULL REFERENCES items,
  tag_id        int             NOT NULL REFERENCES tags,
  date_added    timestamp       NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id            serial          PRIMARY KEY NOT NULL,
  date_added    timestamp       NOT NULL,
  date_modified timestamp       NULL,
  photo         bytea           NOT NULL
);

CREATE TABLE IF NOT EXISTS itemphotos (
  item_id       int             NOT NULL REFERENCES items,
  photo_id      int             NOT NULL REFERENCES photos,
  date_added    timestamp       NOT NULL
);

CREATE TABLE IF NOT EXISTS locationphotos (
  location_id   int             NOT NULL REFERENCES locations,
  photo_id      int             NOT NULL REFERENCES photos,
  date_added    timestamp       NOT NULL
);

