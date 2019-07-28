var express = require('express');
var router = express.Router();

const request = require('request'),
    cheerio = require('cheerio'),
    cheerioTableparser = require('cheerio-tableparser'),

    currencyUrl = 'http://abit.1spbgmu.ru/admission/other/lists/2019/konk/lechebniyf-t.31.05.01.s.lech..5.6.0.2.srednee.0.htm';

var Iconv = require('iconv').Iconv;
var fromEnc = 'cp1251';
var toEnc = 'utf-8';
var translator = new Iconv(fromEnc, toEnc);


/* GET users listing. */
router.get('/', function (req, res, next) {
    readData(function (data) {
        res.send(JSON.stringify(data));
    })
});


module.exports = router;

function readData(callback) {
    var ansverAll = [];
    request({url: currencyUrl, encoding: null}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var $ = cheerio.load(translator.convert(body).toString());
            cheerioTableparser($);
            var table = $('table').parsetable(true, true, true);
            //console.log(table);
            var ansver = [];
            //ansver.push([]);

            for (i = 0; i < table[2].length; i++) {
                //var status = 0;
                //console.log('====0====');
                if (table[2][i] === 'Дурнев Константин') {
                    console.log('====1====');
                    ansver.push({fio: table[2][i]});
                    ansver.push({id: table[4][i]});
                    ansver.push({rating: parseInt(table[0][i])});
                    ansver.push({facrating: parseInt(table[1][i])});
                    if (table[13][i] === 'На зачисление'){
                        ansver.push({status: 1});
                    } else if (table[13][i] === 'На зачисление на втором этапе'){
                        ansver.push({status: 2});
                    } else {
                        ansver.push({status: 0});
                    }
                }
            }
            callback(ansver);
        } else {
            console.log(error);
            callback(error);
        }
    });
}


