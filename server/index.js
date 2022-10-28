const db = require('../db/index');
const express = require('express')
const app = express()
const port = 4000;
require("dotenv").config({ path: '../.env' });

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get('/loaderio-*', (req, res) => {
  console.log('verify target');
  res.sendFile('/home/ubuntu/reviews/server/loaderio-3ba255ee13cc427a0d5c5bb9f13a4f98.txt');
})


app.get('/reviews/meta*', (req, res) => {

  let product_id = req.query.product_id;
  console.log('GET /reviews/meta ', product_id);
  let response = {};
  response.product = product_id;

  Promise.all([
    db.getRatingsDistr(product_id),
    db.getRecommendedCount(product_id),
    db.getCharacteristics(product_id)
  ])
    .catch(err => {
      res.send(err);
    })
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

      response['recommended'] = { '0': results[1][0]['recommend_count'] };

      let characteristics = {};
      if (Object.keys(results[2]).length !== 0) {
        results[2].map((result) => {
          // console.log(result['avg']);
          characteristics[result['name']] = { 'id': result['id'], 'value': result['avg'] };
        })
      }
      response['characteristics'] = characteristics;
      res.send(response);
    });
})

app.get('/reviews*', (req, res) => {
  // console.log("All query strings: " + JSON.stringify(req.query));
  let product_id = req.query.product_id;
  let page = req.query.page || 0;
  let count = req.query.count || 5;
  let sort;

  switch (req.query.sort) {
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

  Promise.resolve(db.getReviews(page, count, sort, product_id))
    .then((data) => {
      for (var i = 0; i < data.length; ++i) {
        data[i].date = new Date(Number(data[i].date));

        let photosJSONArray = [];
        if (data[i].photos.length > 0) {
          for (var j = 0; j < data[i].photos.length; j++) {
            let photoJSON = { 'id': j + 1, 'url': data[i].photos[j] };
            photosJSONArray.push(photoJSON);
          }
          data[i].photos = photosJSONArray;
        }
      }
      let response = {};
      response.product = product_id;
      response.page = page;
      response.count = count;
      response.results = data;
      res.send(response);

    })
    .catch(err => {
      res.send(err);
    });
})

app.post('/reviews', (req, res) => {
  let review = req.body;
  // console.log('insert into review: ', review);
  Promise.resolve(db.insertReview(review.product_id, review.rating, review.summary, review.body, review.recommend, review.name, review.email, review.photos, review.characteristics))
    .then((response) => {
      res.send(response);
    });
})

app.put('/reviews/:review_id/helpful', (req, res) => {
  console.log('req.params.review_id', req.params.review_id)
  db.incrementHelpful(req.params.review_id)
    .then(results => {
      res.send(results);
    })
    .catch(err => {
      res.send(err);
    });
})

app.put('/reviews/:review_id/report', (req, res) => {
  console.log('req.params.review_id', req.params.review_id)
  db.reportReview(req.params.review_id)
    .then(results => {
      res.send(results);
    })
    .catch(err => {
      res.send(err);
    });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


module.exports = app;