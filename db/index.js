
require("dotenv").config({ path: '../.env' });
// require("dotenv").config();
const csv = require('csv-parser')
const fs = require('fs')


const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  "max": 20,
  "connectionTimeoutMillis": 100,
  "idleTimeoutMillis": 100
});

const getReviews = (page, count, sort, product_id) => {

  let getReviewsQuery =
    `
    SELECT
      id,
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
      console.log(data.rows);
      return data.rows;
    })
    .catch((error) => {
      console.log('error with query', error);
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
      for (var i = 0; i < keys.length ; i++) {

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

// test();

module.exports.getReviews = getReviews;
module.exports.getRatingsDistr = getRatingsDistr;
module.exports.getRecommendedCount = getRecommendedCount;
module.exports.getCharacteristics = getCharacteristics;
module.exports.insertReview = insertReview;
module.exports.incrementHelpful = incrementHelpful;
module.exports.reportReview = reportReview;


// getRatingsDistr(2);
// getRecommendedCount(2);
// getCharacteristics(2);

/*
CHARACTERISTIC_REVIEWS
id,characteristic_id,review_id,value
1,1,1,4
2,2,1,3
3,3,1,5
4,4,1,4
5,1,2,4
6,2,2,4
7,3,2,5
8,4,2,4
9,5,3,4
10,5,4,5
11,5,5,5
12,5,6,3
13,5,7,4
14,10,8,2
15,11,8,3
16,12,8,2
17,13,8,1
18,10,9,4
19,11,9,3

CHARACTERISTICS
id,product_id,name
1,1,"Fit"
2,1,"Length"
3,1,"Comfort"
4,1,"Quality"
5,2,"Quality"
6,3,"Fit"
7,3,"Length"
8,3,"Comfort"
9,3,"Quality"
10,4,"Fit"
11,4,"Length"
12,4,"Comfort"
13,4,"Quality"
14,5,"Size"
15,5,"Width"
16,5,"Comfort"
17,5,"Quality"
18,6,"Size"
19,6,"Width"
20,6,"Comfort"


id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
1,1,5,1596080481467,"This product was great!","I really did or did not like this product based on whether it was sustainably sourced.  Then I found out that its made from nothing at all.",true,false,"funtime","first.last@gmail.com",null,8
2,1,4,1610178433963,"This product was ok!","I really did not like this product solely because I am tiny and do not fit into it.",false,false,"mymainstreammother","first.last@gmail.com",null,2
3,2,4,1609325851021,"I am liking these glasses","They are very dark.  But that's good because I'm in very sunny spots",true,false,"bigbrotherbenjamin","first.last@gmail.com","Glad you're enjoying the product!",5
4,2,4,1593628485253,"They look good on me","I so stylish and just my aesthetic.",true,false,"fashionperson","first.last@gmail.com",null,1
5,2,3,1615987717620,"I'm enjoying wearing these shades","Comfortable and practical.",true,false,"shortandsweeet","first.last@gmail.com",null,5
6,2,5,1593564521722,"I'm not a fan!","I don't like them",false,false,"negativity","first.last@gmail.com","Sorry to hear. Is there anything in particular you don't like?",0
7,2,2,1609522845466,"This product was ok!","They're fine but I wouldn't buy again.",false,false,"anyone","first.last@gmail.com",null,0
8,4,4,1599505939632,"These pants are fine","I do like these pants",true,false,"shopaddict","first.last@gmail.com",null,2
9,4,5,1609325851021,"These pants are great!","I really like these pants. Best fit ever!",true,false,"figuringitout","first.last@gmail.com",null,2
10,4,2,1592977554987,"These pants are ok!","A little tight on the waist.",false,false,"bigbrother","first.last@gmail.com",null,2
11,5,4,1612509984089,"Great shoes!","Now I can get to stomping!",true,false,"chingy","first.last@gmail.com",null,12
12,5,3,1594890076276,"They're heavy but great","I like them but they run wide.",true,false,"thinfootjim","first.last@gmail.com",null,3
13,7,5,1602721790544,"Ye is good at everything","I mortgaged my house to pay for these",true,false,"yecrazy","first.last@gmail.com",null,2
14,7,1,1619382006414,"I don't like Kanye","I didn't buy the shoes but I don't like the man behind them",false,true,"taylor","first.last@gmail.com",null,0
15,12,2,1594060020687,"Fugit voluptas aut accusamus iure maiores.","Doloribus ut beatae sed. Qui autem voluptatum laboriosam incidunt ipsa animi aliquid qui. Ut aperiam laboriosam occaecati laudantium id voluptatem vel qui. Ullam aut esse pariatur voluptatum sint natus.",true,false,"Steve.Witting98","Makenna1@gmail.com",null,11
16,12,1,1591588933102,"Possimus et dignissimos et sed.","Temporibus debitis cumque ipsum. Nisi eum praesentium reiciendis saepe. Rerum amet modi et rerum et delectus. Sed consectetur voluptatem optio dolore possimus nihil quasi dolore facilis.",false,false,"America_Schuppe","Antonetta.Kautzer@gmail.com",null,15
17,12,3,1598726311040,"Et assumenda aliquam omnis quia dolorem et perferendis et perspiciatis.","Magnam consequatur est. Nihil unde iste nemo quisquam. Ipsum nam officiis animi cum illo consectetur maxime.",true,false,"Brady_Berge10","Kaleigh.Greenfelder75@hotmail.com",null,4
18,12,2,1605292482741,"Eligendi quae nihil nihil qui dolor ut.","Ullam nihil consequatur in magnam. Maiores vero quisquam facere dolorum eos est veritatis in id. Necessitatibus quos aut molestiae quia. Quae unde beatae.",true,false,"Curtis_King46","Dolly.Muller75@hotmail.com",null,12
19,12,2,1591265584988,"Delectus molestiae qui laborum possimus veritatis.","Et deserunt modi et perferendis unde impedit perferendis. Vel occaecati minus sunt inventore atque. Officia ratione vel ut laudantium eaque natus ut odio. Maxime voluptates vitae accusantium iure laborum ducimus sunt maiores nulla. Autem deserunt cumque doloremque rem fugiat.",true,false,"Kip.Streich","Kristy_Schiller@gmail.com",null,12


id,review_id,url
1,5,"https://images.unsplash.com/photo-1560570803-7474c0f9af99?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=975&q=80"
2,5,"https://images.unsplash.com/photo-1561693532-9ff59442a7db?ixlib=rb-1.2.1&auto=format&fit=crop&w=975&q=80"
3,5,"https://images.unsplash.com/photo-1487349384428-12b47aca925e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"
4,9,"https://images.unsplash.com/photo-1542574621-e088a4464f7e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=3028&q=80"
5,9,"https://images.unsplash.com/photo-1560294559-1774a164fb0a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1650&q=80"
6,9,"https://images.unsplash.com/photo-1555689502-c4b22d76c56f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80"
8,10,"https://images.unsplash.com/photo-1560829675-11dec1d78930?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1652&q=80"
7,10,"https://images.unsplash.com/photo-1549812474-c3cbd9a42eb9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80"
9,10,"https://images.unsplash.com/photo-1559709319-3ae960cda614?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80"
10,15,"https://images.unsplash.com/photo-1519689373023-dd07c7988603?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80"
11,17,"https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1650&q=80"
12,18,"https://images.unsplash.com/photo-1529108750117-bcbad8bd25dd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=662&q=80"
13,20,"https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1650&q=80"
14,23,"https://images.unsplash.com/photo-1550188053-b4e1e8e4f94f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2775&q=80"
15,25,"https://images.unsplash.com/photo-1529108750117-bcbad8bd25dd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=662&q=80"
16,26,"https://images.unsplash.com/photo-1517720359744-6d12f8a09b10?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1567&q=80"
17,29,"https://images.unsplash.com/photo-1507920676663-3b72429774ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
18,31,"https://images.unsplash.com/photo-1470282312847-28b943046dc1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1652&q=80"
19,32,"https://images.unsplash.com/photo-1507920676663-3b72429774ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80"
*/



