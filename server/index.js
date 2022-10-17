const db = require('../db/index');
const express = require('express')
const app = express()
const port = 3000


app.get('/reviews/*', (req, res) => {
  // console.log('id', req.params.id);
  console.log("All query strings: " + JSON.stringify(req.query));
  let product_id = req.query.product_id;
  let page = req.query.page || 0;
  let count = req.query.count || 5;
  let sort;
  if (req.query.sort === 'helpful' || req.query.sort === 'relevant') {
    sort = req.query.sort;
  } else {
    sort = 'date';
  }

  console.log('page, count, sort, id', page, count, sort, product_id);

  const data = Promise.resolve(db.getReviews(page, count, sort, product_id))
    .then((data) => {
      for (var i = 0; i < data.length; ++i) {
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
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})