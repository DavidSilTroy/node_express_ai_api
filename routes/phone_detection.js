var express = require('express');
var router = express.Router();
var yolov5_model = require('../tools/model')
const phone_model = 'https://raw.githubusercontent.com/DavidSilTroy/node_express_ai_api/main/public/models/phone/model.json';
const y5m = new yolov5_model();
if (y5m.droneModel == null) y5m.loadModel(phone_model, 'phone');

router.post('/', async(req, res, next) => {
    let classThreshold = 0.5;
    try {
        // getting the image from the request in the x-www-form-urlencode
        const imgdata = await req.body.base64image;
        // extracting the base64 image string from the request
        const base64img = await y5m.extracBase64Image(imgdata);
        // transforming the base64 image into binary format
        const imgBinary = await Buffer.from(base64img, 'base64')
            // detecting the number of flowers
        let flowers = await y5m.phoneDetect(imgBinary, classThreshold);
        //response with a json {"flowers" : # }
        res.json({ flowers });
    } catch (e) {
        next(e);
    }
});

/* GET . */
router.get('/', function(req, res, next) {
    res.send('Hello friend, this page is working fine for the phone pictures');
});

module.exports = router;