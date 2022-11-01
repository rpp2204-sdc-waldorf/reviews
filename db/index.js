require("dotenv").config({ path: '../.env' });
const { Pool } = require('pg')

const pool = new Pool({
  // host: 'ec2-52-8-104-138.us-west-1.compute.amazonaws.com',
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  "max": 500,
  "connectionTimeoutMillis": 300,
  "idleTimeoutMillis": 0
});
// pool.connect();

const getReviews = (page, count, sort, product_id) => {
  let getReviewsQuery =
    `
    SELECT
      id as review_id,
      product_id,
      rating,
      summary,
      recommend,
      response,
      body,
      date,
      reviewer_name,
      helpfulness,
      array_remove(array_agg(rjp.url),NULL) as photos

    FROM
      (
      SELECT a.*, b.url
      FROM reviews as a
      LEFT JOIN reviews_photos as b
      ON a.id = b.review_id
      WHERE product_id = ${product_id}
      ) as rjp

      GROUP BY rjp.id, rjp.product_id, rjp.rating, rjp.date, rjp.summary, rjp.body, rjp.recommend,
      rjp.reported, rjp.reviewer_name, rjp.reviewer_email, rjp.response, rjp.helpfulness

    ${sort}
    LIMIT ${count} OFFSET ${count * page};
    `;
  return pool.query(getReviewsQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      // console.log('error with query', error);
      return error;
    })
}

const getRatingsDistr = product_id => {
  let getRatingsDistrQuery =
    `
  SELECT rating,count(id) as ratings_Count
  FROM reviews
  WHERE product_id = ${product_id}
  GROUP BY rating;
  `;
  return pool.query(getRatingsDistrQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
      return error;
    })

}

const getRecommendedCount = product_id => {
  let getRatingsDistrQuery =
    `
  SELECT count(id) as recommend_Count
  FROM reviews
  WHERE product_id = ${product_id} AND recommend = 'true'
  `;
  return pool.query(getRatingsDistrQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
      return error;
    })
}

const getCharacteristics = product_id => {
  let getCharacteristicsQuery =
    `
    SELECT a.name, a.id, AVG(b.value)
    FROM characteristics a
    LEFT JOIN characteristic_reviews b
    ON a.id = b.characteristic_id
    WHERE product_id = ${product_id}
    GROUP BY name, a.id;
    `;
  return pool.query(getCharacteristicsQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
      return error;
    })
}

const insertReview = (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email, photos, characteristics) => {
  let insertReviewQuery =
    `
  INSERT INTO reviews (id,product_id,rating,summary,body,recommend,reviewer_name,reviewer_email,helpfulness)
  VALUES (nextval('reviews_id_seq'), ${product_id}, ${rating}, '${summary}', '${body}', ${recommend}, '${reviewer_name}', '${reviewer_email}', 0)
  RETURNING id;
  `;
  return pool.query(insertReviewQuery)
    .then((res) => {
      let reviewId = res.rows[0].id;

      for (var i = 0; i < photos.length; i++) {

        let insertPhotoQuery =
          `
          INSERT INTO reviews_photos (id,review_id,url)
          VALUES (nextval('reviews_photos_id_seq'), '${reviewId}', '${photos[i]}');
          `;
        pool.query(insertPhotoQuery)
          .catch(err => {
            console.log(err);
          });
      }
      let keys = Object.keys(characteristics)
      for (var i = 0; i < keys.length; i++) {
        let insertCharacteristicQuery =
          `
          INSERT INTO characteristic_reviews (id, characteristic_id,review_id,value)
          VALUES (nextval('characteristic_reviews_id_seq'), '${keys[i]}', '${reviewId}', '${characteristics[keys[i]]}');
          `;
        pool.query(insertCharacteristicQuery)
          .catch(err => {
            console.log(err);
          });
      }
    })
    .catch(err => {
      console.log(err);
    })
}

const incrementHelpful = review_id => {
  let incrementHelpfulQuery =
    `
    UPDATE reviews
    SET helpfulness = helpfulness+1
    WHERE id=${review_id};
  `;
  return pool.query(incrementHelpfulQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
    })
}

const reportReview = review_id => {
  let reportReviewQuery =
    `
    UPDATE reviews
    SET reported = true
    WHERE id=${review_id};
  `;
  return pool.query(reportReviewQuery)
    .then((data) => {
      // console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
    })
}

module.exports.getReviews = getReviews;
module.exports.getRatingsDistr = getRatingsDistr;
module.exports.getRecommendedCount = getRecommendedCount;
module.exports.getCharacteristics = getCharacteristics;
module.exports.insertReview = insertReview;
module.exports.incrementHelpful = incrementHelpful;
module.exports.reportReview = reportReview;