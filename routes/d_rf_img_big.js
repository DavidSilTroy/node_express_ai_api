var express = require('express');
var router = express.Router();
var tf = require("@tensorflow/tfjs");
const sharp = require("sharp");
var axios = require("axios");

router.post('/', async(req, res, next) => {
    try {

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

            let roboflowx = await axios({
                method: "POST",
                url: "https://detect.roboflow.com/flowerd-drone/1",
                params: {
                    api_key: "ibSyXKEsNKnMN4pyQIuk"
                },
                data: chunkImage,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })

            flowers += roboflowx.data.predictions.length;
        }
    }
    console.log("Sub Images ready");
    return flowers;

}




















module.exports = router;