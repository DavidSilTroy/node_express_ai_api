var express = require('express');
var router = express.Router();
var tf = require("@tensorflow/tfjs");
const sharp = require("sharp");


//Object detection functions
let model = null;
var load_model = require('../tools/load_model')
var detection = require('../tools/object_detection')
const drone_model = 'https://raw.githubusercontent.com/DavidSilTroy/node_express_ai_api/main/public/models/drone/model.json';


router.post('/', async(req, res, next) => {
    try {
        if (model == null) {
            model = await load_model(drone_model);
        } else {
            console.log('Model is good');
        }
        // warming up model
        const dummyInput = tf.ones(model.inputs[0].shape);
        const warmupResult = await model.executeAsync(dummyInput);
        tf.dispose(warmupResult); // cleanup memory
        tf.dispose(dummyInput); // cleanup memory

        const imgdata = await req.body.base64image;

        // to convert base64 format into random filename
        const base64img = await imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');

        let flowers = await splitImage(base64img, 10);

        res.json({ flowers });

    } catch (e) {
        next(e);
    }

});

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('Hello amiga, this page is working fine for the Drone pictures');
});



const splitImage = async(src, number) => {
    const image = sharp(Buffer.from(src, "base64"));
    const { width, height } = await image.metadata();
    const chunkWidth = Math.floor(width / number);
    const chunkHeight = Math.floor(height / number);
    let classThreshold = 0.5;
    let flowers = 0;

    for (let r = 0; r < number; r++) {
        for (let c = 0; c < number; c++) {
            const x = c * chunkWidth;
            const y = r * chunkHeight;

            const chunk = image.clone().extract({
                left: x,
                top: y,
                width: chunkWidth,
                height: chunkHeight
            });

            const chunkImage = await chunk.toBuffer({ resolveWithObject: true }).then(({ data, info }) => {
                return data.toString("base64");
            });

            const imgBinary = await Buffer.from(chunkImage, 'base64')

            flowers_here = await detection(imgBinary, model, classThreshold);

            flowers += flowers_here;
        }
    }
    return flowers;

}























module.exports = router;