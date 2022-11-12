const db = require('../db/index');
const express = require('express')
const app = express()
const port = 4000;
require("dotenv").config({ path: '../.env' });
const Redis = require('redis');

const redisClient = Redis.createClient();
redisClient.connect();

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get('/reviews/meta', async (req, res) => {
  await getOrSetCache(`/reviews/meta?product_id=${req.query.product_id}`, db.getMeta(req.query.product_id))
    .then((results) => {
      res.status(200).send(results);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})


// app.get('/reviews/meta', async (req, res) => {
//   await db.getMeta(req.query.product_id)
//     .then((results) => {
//       res.status(200).send(results);
//     })
//     .catch(error => {
//       res.status(500).send(error);
//     })
// })

/*
app.get('/reviews/meta*', (req, res) => {

  let product_id = req.query.product_id;
  // console.log('GET /reviews/meta ', product_id);
  let response = {};
  response.product = product_id;

  Promise.all([
    db.getRatingsDistr(product_id),
    db.getRecommendedCount(product_id),
    db.getCharacteristics(product_id)
  ])
  .then((results) => {
    // console.log('results', results[0]);
    let ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      if (Object.keys(results[0]).length !== 0) {
        results[0].map((result) => {
          ratings[result['rating']] = Number(result['ratings_count']);
        })
      }
      response.ratings = ratings;
      try {
        response['recommended'] = { '0': results[1][0]['recommend_count'] };
      } catch (error) {
        // console.log('results[1][0][recommend_count] undefined');
        response['recommended'] = { '0': 0 };
      }

      let characteristics = {};
      if (Object.keys(results[2]).length !== 0) {
        results[2].map((result) => {
          // console.log(result['avg']);
          characteristics[result['name']] = { 'id': result['id'], 'value': result['avg'] };
        })
      }
      response['characteristics'] = characteristics;
      res.send(response);
    })
    .catch(err => {
      // console.log('error with query, res 500')
      res.status(500).send('GET reviews/meta broke!');
    });
  })
*/

app.get('/reviews', async (req, res) => {
  console.log(`/reviews?product_id=${JSON.stringify(req.query)}`);
  await getOrSetCache(`/reviews?product_id=${JSON.stringify(req.query)}`, db.getReviews(req.query))
    .then(results => {
      res.status(200).send(results);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})
// app.get('/reviews*', (req, res) => {

//   Promise.resolve(db.getReviews(req.query))
//     .then(results => {
//       res.status(200).send(results);
//     })
//     .catch(error => {
//       res.status(500).send(error);
//     })
// })

app.post('/reviews', (req, res) => {
  let review = req.body;
  // console.log('insert into review: ', review);
  Promise.resolve(db.insertReview(review.product_id, review.rating, review.summary, review.body, review.recommend, review.name, review.email, review.photos, review.characteristics))
    .then((response) => {
      res.send(response);
    })
    .catch((err) => {
      res.status(500).send('POST reviews broke!');
    });
})

app.put('/reviews/:review_id/helpful', (req, res) => {
  console.log('req.params.review_id', req.params.review_id)
  db.incrementHelpful(req.params.review_id)
    .then(results => {
      res.send(results);
    })
    .catch(err => {
      res.status(500).send('PUT helpful broke!')
    });
})

app.put('/reviews/:review_id/report', (req, res) => {
  console.log('req.params.review_id', req.params.review_id)
  db.reportReview(req.params.review_id)
    .then(results => {
      res.send(results);
    })
    .catch(err => {
      res.status(500).send('PUT report broke!')
    });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})



const getOrSetCache = (key, callback) => {
  return new Promise(async (resolve, reject) => {
    const cacheVal = await redisClient.get(key);
    if (cacheVal !== null) {
      // console.log('hit');
      return resolve(JSON.parse(cacheVal));
    } else if (cacheVal === null) {

      const dbData = await callback;
      redisClient.set(key, JSON.stringify(dbData))
      // console.log('miss');
      return resolve(dbData);

    }
  })
}


module.exports = app;