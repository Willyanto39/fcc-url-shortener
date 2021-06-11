require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const url = require('url');
const dns = require('dns');
const Url = require('./models/Url');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log('Connected to database');
  }
});

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const bodyUrl = req.body.url;
  let hostname;

  try {
    const urlObj = new url.URL(bodyUrl);

    /* new URL() will consider url with other protocol
       such as ftp: as valid url*/
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      throw new Error('invalid url');
    }

    hostname = urlObj.hostname;
  } catch(err) {
    return res.json({error: 'invalid url'});
  }

  dns.lookup(hostname, async (err, address, family) => {
    if (err) {
      return res.json({error: err.message});
    }

    if (!address) {
      return res.json({error: 'invalid url'});
    }

    try {
      const urlData = await Url.findOne({originalUrl: bodyUrl});

      if (!urlData) {
        const count = await Url.estimatedDocumentCount();
        const newUrl = new Url({
          originalUrl: bodyUrl,
          shortUrl: count + 1
        });

        await newUrl.save();

        return res.json({
          original_url: newUrl.originalUrl,
          short_url: newUrl.shortUrl
        });
      }

      return res.json({
        original_url: urlData.originalUrl,
        short_url: urlData.shortUrl
      });
    } catch (err) {
      return res.json({error: err.message});
    }
  })
});

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const shortUrl = req.params.shorturl;

  try {
    const urlData = await Url.findOne({shortUrl});

    if (!urlData) {
      return res.json({error: 'No such URL for given input'});
    }

    res.redirect(urlData.originalUrl);
  } catch (err) {

  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
