const db = require('../db/index');
const express = require('express')
const app = express()
const port = 4000;
require("dotenv").config({ path: '../.env' });

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// app.get('/loaderio-*', (req, res) => {
//   console.log('verify target');
//   res.sendFile(process.env.loaderio);
// })

/*
app.get('/reviews/meta*', (req, res) => {

  let product_id = req.query.product_id;
  // console.log('GET /reviews/meta ', product_id);
  let response = {};
  response.product_id = product_id;

  Promise.resolve(db.getMeta(product_id))
    .then((results) => {
      let reviews_count = 0;
      let characteristics = {};
      let ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

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

      res.send(response);
    })
    .catch(error => {
      res.status(500).send(error);
    })
})

*/

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
        if (JSON.stringify(data[i].photos[0]) === '{}') {
          data[i].photos = [];
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
      res.status(500).send('GET reviews broke!');
    });
})

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


module.exports = app;