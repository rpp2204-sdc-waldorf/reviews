const request = require("supertest")
const app = require('../server/index.js');

// describe("Example tests", function () {
//
//     // Individual tests can be run using the "it" or "test" methods, they are aliased and are equivalent
//     it("1 should be 1", function () {
//         /* This test suite is written in Jest. There are many more methods other than "toBe"
//         Go to: https://jestjs.io/docs/en/expect
//         to find more options if "toBe" doesn't fit your use case.
//         */
//         expect(1).toBe(1);
//     });
// });



describe("Server tests", function () {
    test("GET /reviews?product_id=71701&count=3&sort=helpful", async () => {
        const app = require('../server/index.js');

        let mockResult =
        {
            "product": "71701",
            "page": 0,
            "count": "3",
            "results": [
                {
                    "review_id": 413987,
                    "rating": 1,
                    "summary": "Nulla neque labore omnis quas neque quaerat.",
                    "recommend": false,
                    "response": "null",
                    "body": "Voluptatem omnis et qui quisquam sint beatae eos adipisci minima. Ullam laborum aliquid aut ea necessitatibus a voluptatem. Mollitia aliquid blanditiis laudantium labore dolorum quia qui est. Sit porro qui.",
                    "date": "2021-02-10T02:27:38.907Z",
                    "reviewer_name": "Orval_Boyer",
                    "helpfulness": 23,
                    "photos": []
                },
                {
                    "review_id": 413986,
                    "rating": 5,
                    "summary": "Sit eum sed est accusamus inventore praesentium assumenda.",
                    "recommend": true,
                    "response": "null",
                    "body": "Nemo enim voluptatum vero quia. Rem quo quae doloribus. Quas vel aliquam expedita. Ut repellat iusto ut illo aut quo voluptatem molestiae eum. Dolorem culpa quia quia debitis quod commodi perferendis quos consequuntur.",
                    "date": "2020-11-22T04:43:20.858Z",
                    "reviewer_name": "Kendall64",
                    "helpfulness": 10,
                    "photos": [
                        {
                            "id": 196200,
                            "url": "https://images.unsplash.com/photo-1447879027584-9d17c2ca0333?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1651&q=80"
                        }
                    ]
                },
                {
                    "review_id": 413988,
                    "rating": 1,
                    "summary": "Est adipisci repudiandae et.",
                    "recommend": false,
                    "response": "null",
                    "body": "Maiores odit vel cupiditate aliquam cum hic fuga distinctio. Porro quaerat eum deserunt error beatae possimus sequi. Unde ut cum voluptas vel expedita et. Repudiandae ducimus tenetur in unde nobis eum eveniet. Tenetur voluptates assumenda suscipit ipsam provident quaerat. Nobis ea dolorem.",
                    "date": "2020-05-23T12:05:40.737Z",
                    "reviewer_name": "Audreanne_Mohr80",
                    "helpfulness": 10,
                    "photos": [
                        {
                            "id": 196201,
                            "url": "https://images.unsplash.com/photo-1550188053-b4e1e8e4f94f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2775&q=80"
                        }
                    ]
                }
            ]
        }

        const response = await request(app).get("/reviews?product_id=71701&count=3&sort=helpful")
        expect(response.statusCode).toBe(200)
        expect(response.text).toBe(JSON.stringify(mockResult))
    });


});