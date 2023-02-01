var express = require('express');
var router = express.Router();
var yolov5_model = require('../tools/model')
const drone_model = 'https://raw.githubusercontent.com/DavidSilTroy/node_express_ai_api/main/public/models/drone/model.json';

router.post('/', async(req, res, next) => {
    res.redirect(307, '/drone-big-img/roboflow');
});
router.post('/roboflow', async(req, res, next) => {
    let classThreshold = 0.5;
    try {
        //initializing the class for object detection with yolov5 exported model
        const y5m = new yolov5_model();
        // getting the image from the request in the x-www-form-urlencode
        const imgdata = await req.body.base64image;
        // extracting the base64 image string from the request
        const base64img = await imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        // detecting the number of flowers
        let flowers = await y5m.splitImageAndDetect(base64img, 10, classThreshold, true);
        //response with a json {"flowers" : # }
        res.json({ flowers });
    } catch (e) {
        next(e);
    }
});
router.post('/yolov5', async(req, res, next) => {
    let classThreshold = 0.5;
    try {
        //initializing the class for object detection with yolov5 exported model
        const y5m = new yolov5_model();
        //checking the model is loaded
        if (y5m.phoneModel == null) {
            // load the model
            await y5m.loadModel(drone_model, 'drone');
        } else {
            // all good, model was already there
            console.log('Drone model is already loaded');
        }
        // getting the image from the request in the x-www-form-urlencode
        const imgdata = await req.body.base64image;
        // extracting the base64 image string from the request
        const base64img = await imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        // detecting the number of flowers
        let flowers = await y5m.splitImageAndDetect(base64img, 10, classThreshold, false);
        //response with a json {"flowers" : # }
        res.json({ flowers });
    } catch (e) {
        next(e);
    }
});

/* GET . */
router.get('/', function(req, res, next) {
    res.send('Hello friend, this page is working fine for the drone pictures');
});

module.exports = router;