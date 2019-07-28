var express = require('express');
var router = express.Router();

const request = require('request'),
    cheerio = require('cheerio'),
    cheerioTableparser = require('cheerio-tableparser'),

    currencyUrl = 'http://abit.1spbgmu.ru/admission/other/lists/2019/konk/lechebniyf-t.31.05.01.s.lech..5.6.0.1.srednee.0.htm';


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
    //var ansverAll = [];
    request({url: currencyUrl, encoding: null}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var $ = cheerio.load(translator.convert(body).toString());
            cheerioTableparser($);
            var table = $('table').parsetable(true, true, true);
            //console.log(table);
            for (n = 0; n < table[0].length; n++) {
                if (table[0][n] === '№ пп' && table[0][n + 1] === '№ пп') {
                    for (i = 0; i < table.length; i++) {
                        table[i].splice(0, n + 2);
                    }
                    break;
                }
            }
            var ansver = [];
            for (i = 0; i < table[2].length; i++) {
                if (table[2][i] === 'Дурнев Константин') {
                    //console.log('====1====');
                    ansver.push({fio: table[2][i]});
                    ansver.push({id: table[4][i]});
                    ansver.push({rating: parseInt(table[0][i])});
                    ansver.push({ballsumm: parseInt(table[6][i])});
                    if (table[1][i] === '') {
                        ansver.push({facrating: 0});
                    } else {
                        ansver.push({facrating: parseInt(table[1][i])});
                    }
                    if (table[13][i] === 'На зачисление') {
                        ansver.push({status: 1});
                    } else if (table[13][i] === 'На зачисление на втором этапе') {
                        ansver.push({status: 2});
                    } else {
                        ansver.push({status: 0});
                    }
                }
            }
            for (i = 0; i < table[0].length; i++) {
                if (table[1][i] !== '') {
                    if (parseInt(table[6][i]) <= ansver[3].ballsumm){
                        ansver.push({potencial: parseInt(table[1][i])});
                        break;
                    }
                }
            }
            //console.log(table);
            callback(ansver);
        } else {
            console.log(error);
            callback(error);
        }
    });
}


