CREATE TABLE reviews(
	id INTEGER,
	product_id INTEGER,
	rating INTEGER,
	date BIGINT,
	summary TEXT,
	body TEXT,
	recommend BOOLEAN,
	reported BOOLEAN,
	reviewer_name TEXT,
	reviewer_email TEXT,
	response TEXT,
	helpfulness INT,
	PRIMARY KEY (id)
	);

CREATE TABLE reviews_photos(
	id INTEGER,
	review_id INTEGER,
	url TEXT,
	PRIMARY KEY (id),
	FOREIGN KEY (review_id) REFERENCES reviews(id)
);

CREATE TABLE characteristic_reviews(
	id INTEGER,
	review_id INTEGER,
	characteristic_id INTEGER,
	value INTEGER,
	PRIMARY KEY (id),
	FOREIGN KEY (review_id) REFERENCES reviews(id),
	FOREIGN KEY (characteristic_id) REFERENCES characteristics(id)
);

CREATE TABLE characteristics(
	id INTEGER,
	product_id INTEGER,
	name TEXT,
	PRIMARY KEY (id)
);

delete from characteristic_reviews where id in (
	SELECT a.id
	FROM characteristic_reviews a
	LEFT JOIN characteristics b
	on a.characteristic_id = b.id
	WHERE
	b.id is null
);

delete from photos where id in (
	SELECT a.review_id
	FROM reviews_photos a
	LEFT JOIN reviews b
	on b.id = a.review_id
	WHERE
	b.id is null
);