require("dotenv").config({ path: '../.env' });
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  "max": 250,
  "connectionTimeoutMillis": 0,
  "idleTimeoutMillis": 0
});
// pool.connect();

const getReviews = (params) => {

  let product_id = params.product_id;
  let page = params.page || 0;
  let count = params.count || 5;
  let sort;

  switch (params.sort) {
    case 'newest':
      sort = 'ORDER BY date DESC';
      break;
    case 'helpful':
      sort = 'ORDER BY helpfulness DESC'
      break;
    case 'relevant':
      sort = 'ORDER BY helpfulness DESC, date DESC';
      break;
    default:
      sort = ''
  }

  let getReviewsQuery =
    `
    SELECT
      rjp.id as review_id,
      rating,
      summary,
      recommend,
      response,
      body,
      date,
      reviewer_name,
      helpfulness,
      array_agg(
        json_strip_nulls(
          json_build_object('id', rjp.photo_id, 'url', rjp.url)
        )
      ) as photos


    FROM
    (
      SELECT a.*, b.id as photo_id, b.url
      FROM reviews as a
      LEFT JOIN reviews_photos as b
      ON a.id = b.review_id
      WHERE product_id = ${product_id}
      ) rjp

      GROUP BY rjp.id, rjp.product_id, rjp.rating, rjp.date, rjp.summary, rjp.body, rjp.recommend,
      rjp.reported, rjp.reviewer_name, rjp.reviewer_email, rjp.response, rjp.helpfulness

    ${sort}
    LIMIT ${count} OFFSET ${count * page};
    `;
  return pool.query(getReviewsQuery)
    .then((data) => {
      let results = data.rows
      for (var i = 0; i < results.length; ++i) {
        results[i].date = new Date(Number(results[i].date));
        if (JSON.stringify(results[i].photos[0]) === '{}') {
          results[i].photos = [];
        }

      }
      let response = {};
      response.product = product_id;
      response.page = page;
      response.count = count;
      response.results = results;
      return response;
    })
    .catch((error) => {
      console.log('error with query', error);
      throw error;
    })
}


const getMeta = product_id => {
  let getMetaQuery =
    `
  SELECT
    product_id,
    array_agg(
      json_build_object(rating, ratings_count)
    ) as ratings,
    recommend_count,
    name,
    characteristic_id,
    avg

  FROM
  (
    SELECT
      A.product_id,
      rating,
      ratings_count,
      recommend_count,
      array_agg(
        name
      ) as name,
      array_agg(
        id
      ) as characteristic_id,
      array_agg(
        avg
      ) as avg

    FROM
    (
      SELECT product_id, rating,count(*) as ratings_Count
      FROM reviews
      WHERE product_id = ${product_id}
      GROUP BY product_id,rating
    ) A
    LEFT JOIN
    (
      SELECT product_id, count(id) as recommend_Count
      FROM reviews
      WHERE product_id = ${product_id} AND recommend = 'true'
      GROUP BY product_id
    ) B
    on A.product_id=B.product_id

    LEFT JOIN
    (
      SELECT product_id, a.name, a.id, AVG(b.value)
      FROM characteristics a
      LEFT JOIN characteristic_reviews b
      ON a.id = b.characteristic_id
      WHERE product_id = ${product_id}
      GROUP BY a.name, a.id
    ) C
    on A.product_id=C.product_id

    GROUP BY A.product_id, rating, ratings_count, recommend_count
  ) META

  GROUP BY product_id, recommend_count, name, characteristic_id, avg
  `;
  return pool.query(getMetaQuery)
    .then((data) => {
      let results = data.rows;
      let response = {};
      response.product_id = product_id;

      let reviews_count = 0;
      let characteristics = {};
      let ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      if (results.length === 0) {
        response.ratings = ratings;
        response.characteristics = characteristics;
        response.recommended = {true: 0, false: 0};
      } else if (results.length !==0) {

        for (var i = 0; i < results[0]['ratings'].length; ++i) {
          ratings[Object.keys(results[0]['ratings'][i])[0]] = Object.values(results[0]['ratings'][i])[0];
          reviews_count += Object.values(results[0]['ratings'][i])[0];
        }
        response.ratings = ratings;

        response.recommended = { true: Number(results[0]['recommend_count']), false: reviews_count - results[0]['recommend_count'] }

        for (var i = 0; i < results[0].name.length; ++i) {
          let characteristics_name = results[0]['name'][i];
          let characteristics_id = results[0]['characteristic_id'][i];
          let characteristics_value = results[0]['avg'][i];
          characteristics[characteristics_name] = { "id": characteristics_id, 'value': characteristics_value };
        }
        response.characteristics = characteristics;

      }
      return response;
    })
    .catch((error) => {
      console.log('error with query', error);
      throw error;
    })

}


const getRatingsDistr = product_id => {
  let getRatingsDistrQuery =
    `
  SELECT rating,count(*) as ratings_Count
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
module.exports.insertReview = insertReview;
module.exports.incrementHelpful = incrementHelpful;
module.exports.reportReview = reportReview;
module.exports.getMeta = getMeta;
module.exports.getRatingsDistr = getRatingsDistr;
module.exports.getRecommendedCount = getRecommendedCount;
module.exports.getCharacteristics = getCharacteristics;