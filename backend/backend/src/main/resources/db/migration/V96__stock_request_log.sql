-- create log table for stock requests
CREATE TABLE stock_request_log (
    id BIGSERIAL PRIMARY KEY,
    stock_request_id BIGINT NOT NULL,
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_stock_request_log_request FOREIGN KEY (stock_request_id)
        REFERENCES stock_request(id) ON DELETE CASCADE
);
