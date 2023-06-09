const request = require('request');
const gunzipMaybe = require('gunzip-maybe');
const readline = require('readline');
const mongoose = require('mongoose');

// Підключення до MongoDB
mongoose.connect('mongodb+srv://romanroketskiy:YOUR-KEY@cluster0.h4h4zwe.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, `Помилка з'єднання з базою даних:`));
db.once('open', () => {
  console.log(`З'єднання з базою даних встановлено.`);


  const movieSchema = new mongoose.Schema({}, {strict: false});

  const Movie = mongoose.model('Movie', movieSchema);


  const url = 'https://popwatch-staging.s3.us-east-2.amazonaws.com/movies_1.gz';
  const options = {
    url,
    headers: {
      'Accept-Encoding': 'gzip'
    }
  };

  const req = request(options);
  const gunzip = gunzipMaybe();
  const rl = readline.createInterface({
    input: gunzip
  });

  const promises = []; 

  rl.on('line', line => {
    try {
      const movie = JSON.parse(line);
      const newMovie = new Movie(movie);

      
      promises.push(newMovie.save().then(() => {
          console.log('Фільм успішно залито у базу.');
      }));
    } catch (error) {
      console.error(`Помилка при розпарсуванні рядка: ${error}`);
    }
  });

  rl.on('close', () => {
    Promise.all(promises) 

    .then(() => {
      console.log('Завантаження та залиття даних завершено.');
      db.close();
    })

    .catch(err => {
      console.error(`Помилка при залитті філмів у базу: ${err}`);
      db.close();
    });
  });

  req.pipe(gunzip);
});