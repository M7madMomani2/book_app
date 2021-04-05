'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const app = express();
const PORT = process.env.PORT;
const pg=require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL)


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', renderHomePage);
app.post('/', addBook);
app.get('/searches/new', showForm);
app.post('/searches', createSearch);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

const dbClient = new pg.Client(DATABASE_URL);
dbClient.on('error', err => {
    console.log('Not found')
});



function Book(info) {
    const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = info.title || 'No title available';
    this.img = info.imageLinks || placeholderImage;
    this.ispn =info.industryIdentifiers[0].type||'';
    this.description = info.description || 'No description available';
    this.authors = info.authors || 'No authors ';
}

function renderHomePage(request, response) {
    response.render('pages/index');
}

function showForm(request, response) {
    response.render('pages/searches/new.ejs');
}

function createSearch(request, response) {
    let url = 'https://www.googleapis.com/books/v1/volumes?q=';
    console.log(request.body);
    console.log(request.body.search);

    // can we convert this to ternary?
    if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
    if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }
    superagent.get(url)
        .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
        .then(results => response.render('pages/show', { searchResults: results })).catch(internalserverError(response));
}

function internalserverError(response) {
    return (error) => {
        console.log(error);
        response.status(500).send('somthing Went wrong');
    }
}
function addBook(request, response){
    const data = request.body;
    console.log(data);
    const insertSQL = 'INSERT INTO books (author,title, isbn,image_url,description) VALUES ($1, $2 ,$3 ,$4,$5);';
    const inputArray = [data.author, data.title ,data.isbn,data.img,data.description];
    dbClient.query(insertSQL, inputArray).then((datadb)=>{
        console.log(datadb);
    }).catch((error)=>{
        console.log(error);
    });
    response.render('pages/index',{ myBooks: data });
}

// function fromDB() {
//     locationLatitude = data.rows[0].latitude;
//     locationLongitude = data.rows[0].longitude;
//     response.send(data.rows[0]);

// }

// // Route Middlewares
// app.get('/location', (request, response) => {

//     let search_query = request.query.city;
//     const locationSQL = 'SELECT * FROM location WHERE  search_query=$1;';
//     const sqlData = [search_query];
//     dbClient.query(locationSQL, sqlData)
//         .then((data)=>{
//             if(data.rowCount === 0){
//                 let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${search_query}&format=json`;
//                 superagent.get(url).then(res => {
//                     let data = res.body[0];
//                     let locationObject = new Location(search_query, data);
//                     const insertSQL = 'INSERT INTO location (search_query,formatted_query, latitude,longitude) VALUES ($1, $2 ,$3 ,$4);';
//                     const inputArray = [search_query, locationObject.formatted_query ,locationObject.latitude,locationObject.longitude];
//                     dbClient.query(insertSQL, inputArray);
//                     response.send(locationObject);
//                 })

//             } else {
//                 locationLatitude = data.rows[0].latitude;
//                 locationLongitude = data.rows[0].longitude;
//                 response.send(data.rows[0]);
//             }
//         })

// });
