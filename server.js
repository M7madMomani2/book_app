/* eslint-disable no-unused-vars */
'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT;
const pg=require('pg');
const DATABASE_URL = process.env.DATABASE_URL;

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', renderHomePage);
app.post('/', addBook);
app.get('/books/:id', showBook);



app.get('/searches/new', showForm);
app.post('/searches', createSearch);

app.use('*', (request, response) => response.status(404).send('This route does not exist'));

const dbClient = new pg.Client(DATABASE_URL);
dbClient.on('error', err => {
    console.log('Not found')
});

dbClient.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`app is listning on port ${PORT}`);
    });
}).catch(err => {
    console.log(`Sorry there is Database error ${err}`);
});

function Book(info) {
    const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = info.title || 'No title available';
    this.img = info.imageLinks || placeholderImage;
    this.isbn =info.industryIdentifiers[0].type||'';
    this.description = info.description || 'No description available';
    this.author = info.author || 'No authors ';
}

function renderHomePage(request, response) {
    dbClient.query(`SELECT * FROM books`).then(data => {
        // console.log(data.Results);
        response.render('pages/index' ,{books :data.rows});
        // response.send(data.rows[0]);
    }).catch((error=>{
        response.send(error);
    }))
}

function showForm(request, response) {
    response.render('pages/searches/new.ejs');
}

function createSearch(request, response) {
    let url = 'https://www.googleapis.com/books/v1/volumes?q=';

    // can we convert this to ternary?
    if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
    if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }
    superagent.get(url)
        .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
        .then(results => response.render('pages/show', { searchResults: results })).catch(internalserverError(response));
}

function internalserverError(response) {
    return (error) => {
        response.status(500).send('somthing Went wrong');
    }
}


function addBook(request, response){
    const data = request.body;
    const insertSQL = 'INSERT INTO books (author,title, isbn,image_url,description) VALUES ($1, $2 ,$3 ,$4,$5) RETURNING id;';
    const inputArray = [data.author, data.title ,data.isbn,data.img,data.description];
    dbClient.query(insertSQL, inputArray).then((datadb)=>{
        console.log(datadb.rows[0].id);
        response.redirect(`/books/${datadb.rows[0].id}`);
    }).catch(internalserverError(response));
}


function showBook(request, response){
    const sql ='SELECT * FROM books WHERE id = $1';
    const idDB =[request.params.id];
    console.log(request.params.id);
    dbClient.query(sql,idDB).then(data => {
        // console.log(data.Results);
        console.log(data.rows);
        // response.send(data.rows)
        response.render('pages/books/show' ,{books :data.rows});
    }).catch((error=>{
        console.log(error);
        response.send("error");
    }))
}
