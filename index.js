require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
const validUrl = require("valid-url");

// Defining shortUrl model
const shortUrlSchema = {
  original_url: { type: String, required: true, unique: true },
  short_url: { type: Number, unique: true },
};

const ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI);

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

//ADDING a new URL to the DB.
app.post("/api/shorturl", (req, res) => {
  const regexCheck = validUrl.isUri(req.body.url);
  const urlToCheck = new URL(regexCheck).hostname;
  console.log(urlToCheck);

  // The urlToCheck is the DNS, the hostname.

  dns.lookup(urlToCheck, (err, addresses, family) => {
    // if URL not valid, return error object.
    //console.log(err);
    if (err || req.body.url == false || !regexCheck) {
      //console.log(!regexCheck);
      res.json({ error: "invalid url" });
    } else {
      // If the url is already in the DB, the program will return it with the short url already added

      ShortUrl.find({ original_url: req.body.url }).then((data) => {
        if (data[0]) {
          res.json({
            original_url: data[0]["original_url"],
            short_url: data[0]["short_url"],
          });
        } else {
          // The new url will be added to the DB

          ShortUrl.aggregate([
            { $sort: { short_url: -1 } },
            { $limit: 1 },
            { $project: { _id: 0 } },
          ]).then((data) => {
            const original_url = req.body.url;
            const short_url = data[0].short_url + 1;
            const newShortUrl = new ShortUrl({ original_url, short_url });
            //console.log(newShortUrl);
            newShortUrl.save();
            res.json({ original_url, short_url });
          });
        }
      });
    }
  });
});

//Fetching url from the url shortener API
app.get("/api/shorturl/:short_url", (req, res) => {
  ShortUrl.find({ short_url: req.params.short_url }).then((data) => {
    if (data[0]) {
      res.redirect(data[0]["original_url"]);
    } else {
      res.json({ error: "Wrong format" });
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
