CREATE TABLE one_step_closer (
     id BIGSERIAL PRIMARY KEY,
     title VARCHAR(100) NOT NULL,
     description TEXT,
     current_amount NUMERIC(20,2) NOT NULL DEFAULT 0,
     target_amount NUMERIC(20,2) NOT NULL,
     image_url VARCHAR(250),
     status VARCHAR(20),
     created_date TIMESTAMP,
     completed_date TIMESTAMP
);


CREATE TABLE one_step_closer_deposit_history (
     id BIGSERIAL PRIMARY KEY,
     osc_id BIGINT NOT NULL,
     deposit_amount NUMERIC(20,2) NOT NULL,
     created_date TIMESTAMP
);