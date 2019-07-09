var express = require('express');
var router = express.Router();

const request = require('request'),
    cheerio = require('cheerio'),
    cheerioTableparser = require('cheerio-tableparser'),

    //Лечфак
    currencyUrlLechRFBug = 'http://abit.1spbgmu.ru/admission/other/lists/2019/lechebniyf-t.31.05.01.s.lech..5.6.0.1.srednee.0.htm',
    currencyUrlLechRFCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/lechebniyf-t.31.05.01.s.lech..5.6.0.2.srednee.0.htm',
    currencyUrlLechInoCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/lechebniyf-t.31.05.01.s.lech.medicine.5.6.0.2.srednee.0.htm',

    //Педиатрия
    //currencyUrlPedInoCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/pediatricheskiyf-t.31.05.02.s.pediatr..5.6.0.1.srednee.0.htm',
    currencyUrlPedInoCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/pediatricheskiyf-t.31.05.02.s.pediatr.pediatrics.5.6.0.2.srednee.0.htm',
    currencyUrlPedRFCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/pediatricheskiyf-t.31.05.02.s.pediatr..5.6.0.2.srednee.0.htm',
    currencyUrlPedRFBug = 'http://abit.1spbgmu.ru/admission/other/lists/2019/pediatricheskiyf-t.31.05.02.s.pediatr..5.6.0.1.srednee.0.htm',

    //Стоматология
    currencyUrlStomInoCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/stomatologich.f-t.31.05.03.s.stomat.dentistry.5.5.0.2.srednee.0.htm',
    currencyUrlStomRFBug = 'http://abit.1spbgmu.ru/admission/other/lists/2019/stomatologich.f-t.31.05.03.s.stomat..5.5.0.1.srednee.0.htm',
    currencyUrlStomRFCont = 'http://abit.1spbgmu.ru/admission/other/lists/2019/stomatologich.f-t.31.05.03.s.stomat..5.5.0.2.srednee.0.htm';

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
    request({url: currencyUrlPedInoCont, encoding: null}, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var $ = cheerio.load(translator.convert(body).toString());
            cheerioTableparser($);
            var table = $('table').parsetable(true, true, true);
            //console.log(table);
            var ansver = [];
            var ansverSort = [];
            for (i = 0; i < table.length; i++) {
                var status = 0;
                ansver.push([]);
                //console.log('====0====');
                for (n = 0; n < table[0].length; n++) {
                    //console.log('====1====');
                    if (table[i][n] === '№ пп' || table[i][n] === 'Фамилия Имя Отчество' || table[i][n] === '№ личного дела' || table[i][n] === 'Типы экзаменов' || table[i][n] === 'Сумма баллов' || table[i][n] === 'Статус') {
                        status++;
                    }
                    if (status === 2 && n !== table[0].length - 1) {
                        if (i === 0) {
                            ansver[i].push(parseInt(table[i][n + 1]));
                        } else if (i === 5) {
                            //console.log(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                            ansver[i].push(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                        } else {
                            ansver[i].push(table[i][n + 1]);
                        }
                    }
                }
            }
            for (l = 0; l < ansver[0].length; l++) {
                if (ansver[1][l] === 'Дурнев Константин') {
                    for (n = -1; n < 2; n++) {
                        ansverSort.push([]);
                        ansverSort[n + 1].push({rating: ansver[0][l + n]});
                        ansverSort[n + 1].push({name: ansver[1][l + n]});
                        ansverSort[n + 1].push({code: ansver[3][l + n]});
                        ansverSort[n + 1].push({summofball: ansver[5][l + n]});
                        ansverSort[n + 1].push({status: ansver[6][l + n]});
                    }
                }
            }
            /*
        *Начало
        */
            let a = 0, b = 0, vacansy;
            ansverSort.push([]);
            for (i = 0; i < table[0].length; i++) {
                if (table[0][i] === 'Вакантных мест:'||table[0][i] === 'Вакантных\n  мест:') {
                    vacansy = parseInt(table[2][i]);
                    ansverSort[3].push({vacancy: vacansy});
                }
                if (table[0][i] === '№ пп') {
                    a = i;
                }
                if (a !== 0 && table[0][i] === '') {
                    b = i - 1;
                    //console.log('=================================================');
                    //console.log(a, b);
                    //console.log(table[0].length, table[5].length);
                    ansverSort[3].push({quantity: b - a});
                    if ((b - a) > vacansy) {
                        ansverSort[3].push({minball: parseFloat(table[5][a + vacansy].replace(',', '.')).toFixed(2)});
                    } else {
                        //console.log(table[5][b]);
                        ansverSort[3].push({minball: parseFloat(table[5][b].replace(',', '.')).toFixed(2)});
                    }
                    break
                }
            }
            //console.log('====================');
            //console.log(a, b);
            /*
            *Конец
            */
            ansverAll.push({pedinocont: ansverSort});
            //console.log(ansver);
            //callback(ansverSort);
            request({url: currencyUrlPedRFBug, encoding: null}, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var $ = cheerio.load(translator.convert(body).toString());
                    cheerioTableparser($);
                    var table = $('table').parsetable(true, true, true);
                    //console.log(table);
                    var ansver = [];
                    var ansverSort = [];
                    for (i = 0; i < table.length; i++) {
                        var status = 0;
                        ansver.push([]);
                        //console.log('====0====');
                        for (n = 0; n < table[0].length; n++) {
                            //console.log('====1====');
                            if (table[i][n] === '№ пп' || table[i][n] === 'Фамилия Имя Отчество' || table[i][n] === '№ личного дела' || table[i][n] === 'Типы экзаменов' || table[i][n] === 'Сумма баллов' || table[i][n] === 'Статус') {
                                status++;
                            }
                            if (status === 2 && n !== table[0].length - 1) {
                                if (i === 0) {
                                    ansver[i].push(parseInt(table[i][n + 1]));
                                } else if (i === 5) {
                                    //console.log(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                                    ansver[i].push(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                                } else {
                                    ansver[i].push(table[i][n + 1]);
                                }
                            }
                        }
                    }
                    for (l = 0; l < ansver[0].length; l++) {
                        if (ansver[1][l] === 'Дурнев Константин') {
                            for (n = -1; n < 2; n++) {
                                ansverSort.push([]);
                                ansverSort[n + 1].push({rating: ansver[0][l + n]});
                                ansverSort[n + 1].push({name: ansver[1][l + n]});
                                ansverSort[n + 1].push({code: ansver[3][l + n]});
                                ansverSort[n + 1].push({summofball: ansver[5][l + n]});
                                ansverSort[n + 1].push({status: ansver[6][l + n]});
                            }
                        }
                    }
                    /*
        *Начало
        */
                    let a = 0, b = 0, vacansy;
                    ansverSort.push([]);
                    for (i = 0; i < table[0].length; i++) {
                        if (table[0][i] === 'Вакантных мест:'||table[0][i] === 'Вакантных\n  мест:') {
                            vacansy = parseInt(table[2][i]);
                            ansverSort[3].push({vacancy: vacansy});
                        }
                        if (table[0][i] === '№ пп') {
                            a = i;
                        }
                        if (a !== 0 && table[0][i] === '') {
                            b = i - 1;
                            //console.log('=================================================');
                            //console.log(a, b);
                            //console.log(table[0].length, table[5].length);
                            ansverSort[3].push({quantity: b - a});
                            if ((b - a) > vacansy) {
                                ansverSort[3].push({minball: parseFloat(table[5][a + vacansy].replace(',', '.')).toFixed(2)});
                            } else {
                                //console.log(table[5][b]);
                                ansverSort[3].push({minball: parseFloat(table[5][b].replace(',', '.')).toFixed(2)});
                            }
                            break
                        }
                    }
                    //console.log('====================');
                    //console.log(a, b);
                    /*
                    *Конец
                    */
                    ansverAll.push({pedrfbug: ansverSort});
                    request({url: currencyUrlPedRFCont, encoding: null}, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            var $ = cheerio.load(translator.convert(body).toString());
                            cheerioTableparser($);
                            var table = $('table').parsetable(true, true, true);
                            //console.log(table);
                            var ansver = [];
                            var ansverSort = [];
                            for (i = 0; i < table.length; i++) {
                                var status = 0;
                                ansver.push([]);
                                //console.log('====0====');
                                for (n = 0; n < table[0].length; n++) {
                                    //console.log('====1====');
                                    if (table[i][n] === '№ пп' || table[i][n] === 'Фамилия Имя Отчество' || table[i][n] === '№ личного дела' || table[i][n] === 'Типы экзаменов' || table[i][n] === 'Сумма баллов' || table[i][n] === 'Статус') {
                                        status++;
                                    }
                                    if (status === 2 && n !== table[0].length - 1) {
                                        if (i === 0) {
                                            ansver[i].push(parseInt(table[i][n + 1]));
                                        } else if (i === 5) {
                                            //console.log(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                                            ansver[i].push(parseFloat(table[i][n + 1].replace(',', '.')).toFixed(2));
                                        } else {
                                            ansver[i].push(table[i][n + 1]);
                                        }
                                    }
                                }
                            }
                            for (l = 0; l < ansver[0].length; l++) {
                                if (ansver[1][l] === 'Дурнев Константин') {
                                    for (n = -1; n < 2; n++) {
                                        ansverSort.push([]);
                                        ansverSort[n + 1].push({rating: ansver[0][l + n]});
                                        ansverSort[n + 1].push({name: ansver[1][l + n]});
                                        ansverSort[n + 1].push({code: ansver[3][l + n]});
                                        ansverSort[n + 1].push({summofball: ansver[5][l + n]});
                                        ansverSort[n + 1].push({status: ansver[6][l + n]});
                                    }
                                }
                            }
                            /*
        *Начало
        */
                            let a = 0, b = 0, vacansy;
                            ansverSort.push([]);
                            for (i = 0; i < table[0].length; i++) {
                                if (table[0][i] === 'Вакантных мест:'||table[0][i] === 'Вакантных\n  мест:') {
                                    vacansy = parseInt(table[2][i]);
                                    ansverSort[3].push({vacancy: vacansy});
                                }
                                if (table[0][i] === '№ пп') {
                                    a = i;
                                }
                                if (a !== 0 && table[0][i] === '') {
                                    b = i - 1;
                                    //console.log('=================================================');
                                    //console.log(a, b);
                                    //console.log(table[0].length, table[5].length);
                                    ansverSort[3].push({quantity: b - a});
                                    if ((b - a) > vacansy) {
                                        ansverSort[3].push({minball: parseFloat(table[5][a + vacansy].replace(',', '.')).toFixed(2)});
                                    } else {
                                        //console.log(table[5][b]);
                                        ansverSort[3].push({minball: parseFloat(table[5][b].replace(',', '.')).toFixed(2)});
                                    }
                                    break
                                }
                            }
                            //console.log('====================');
                            //console.log(a, b);
                            /*
                            *Конец
                            */
                            ansverAll.push({pedrfcont: ansverSort});
                            //console.log(ansverAll);
                            callback(ansverAll);
                        } else {
                            console.log(error);
                            callback(error);
                        }
                    })
                    //console.log(ansver);
                    //callback(ansverSort);
                } else {
                    console.log(error);
                    callback(error);
                }
            })
        } else {
            console.log(error);
            callback(error);
        }
    });
}


