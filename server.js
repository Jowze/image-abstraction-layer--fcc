const express = require('express');
const fetch = require('node-fetch');
const mongo = require('mongodb').MongoClient;
const app = express();

const dbUrl = process.env.MONGO_URL;
function makeQueryUrl(query, offset) {
	const gURL = `https://www.googleapis.com/customsearch/v1?key=${process.env.API_KEY}&cx=${process.env.CX}&searchType=image&start=${offset}&q=${query}`;
	return gURL;
}

app.listen(3000, function() {
	console.log('listening on 3000');
});

app.get('/imagesearch/:query', (req, res) => {
	let query = req.params.query.replace(' ', '%20');
	let offset = req.query.offset;
	const URL = makeQueryUrl(query, offset);

	mongo.connect(dbUrl, (err, client) => {
		if (err) return console.log(err);
		const db = client.db('imageabstraction');

		const dbEntry = { query: query, date: Date() };
		db.collection('latestsearchs').insert(dbEntry);
	});

	fetch(URL)
		.then(response => response.json())
		.then(myJson => {
			let result = [];
			myJson.items.forEach(item => {
				result.push({
					imgURL: item.link,
					altText: item.title,
					pageURL: item.image.contextLink,
				});
			});

			res.send(result);
		});
});

app.get('/latest/imagesearch', (req, res) => {
	mongo.connect(dbUrl, (err, client) => {
		if (err) return console.log(err);
		const db = client.db('imageabstraction');

		db
			.collection('latestsearchs')
			.find()
			.project({ _id: 0 })
			.toArray(function(err, results) {
				if (err) return console.log(err);
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(results));
			});
	});
});

app.get('/', (req, res) => {
const txt = "To make a search: https://image-abstraction-layer--fcc.glitch.me/imagesearch/[QUERYHERE]?offset[RESULT OFFSET HERE] <br> For latest search results: https://image-abstraction-layer--fcc.glitch.me/latest/imagesearch" ;
res.send(txt);
});