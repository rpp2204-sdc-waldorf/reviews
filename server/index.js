const db = require('../db/index');
const express = require('express')
const app = express()
const port = 4000

// For parsing application/json
app.use(express.json());

// For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.get('/reviews/meta*', (req, res) => {
  console.log('meta');
  let product_id = req.query.product_id;

  let response = {};
  response.product = product_id;


  Promise.all([
    db.getRatingsDistr(product_id),
    db.getRecommendedCount(product_id),
    db.getCharacteristics(product_id)
  ])
    .then((results) => {
      let ratings = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
      results[0].map((result) => {
        ratings[result['rating']] = Number(result['ratings_count']);
        response.ratings = ratings;
      })

      response['recommended'] = { '0': results[1][0]['recommend_count'] };

      // console.log(results[2]);

      let characteristics = {};
      results[2].map((result) => {
        // console.log(result['avg']);
        characteristics[result['name']] = { 'id': result['id'], 'value': result['avg'] };
      })
      response['characteristics'] = characteristics;
      console.log(response);
      res.send(response);
    })




})

app.get('/reviews*', (req, res) => {
  console.log('id', req.params.id);
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

  console.log('page, count, sort, id', page, count, sort, product_id);

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
  console.log('insert into review: ',review);
  Promise.resolve(db.insertReview(review.product_id, review.rating, review.summary, review.body, review.recommend, review.name, review.email, review.photos, review.characteristics))
    .then((response) => {
      res.send(response);
    });

})


app.put('/reviews/:review_id/helpful', (req, res) => {
  db.incrementHelpful(req.params.review_id)
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

/*
[
  { rating: 2, ratings_count: '1' },
  { rating: 3, ratings_count: '1' },
  { rating: 4, ratings_count: '2' },
  { rating: 5, ratings_count: '1' }
]

[ { recommend_count: '3' } ]

[ { name: 'Quality', avg: '4.2000000000000000' } ]





{
  "product_id": "2",
  "ratings": {
    2: 1,
    3: 1,
    4: 2,
    // ...
  },
  "recommended": {
    0: 5
    // ...
  },
  "characteristics": {
    "Size": {
      "id": 14,
      "value": "4.0000"
    },
    "Width": {
      "id": 15,
      "value": "3.5000"
    },
    "Comfort": {
      "id": 16,
      "value": "4.0000"
    },
    // ...
}

*/