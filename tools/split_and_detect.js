var tf = require("@tensorflow/tfjs");
var tfnode = require("@tensorflow/tfjs-node");

//For big images, as the drone photos, split the big image into little images and detect the flowers in each sub-image
const splitImageAndDetect = async(src, number) => {
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

            //Only this is different
            const imgBinary = await Buffer.from(chunkImage, 'base64')
            flowers_here = await detection(imgBinary, model, classThreshold);
            //finished different part

            flowers += flowers_here;
        }
    }
    return flowers;

}

module.exports = splitImageAndDetect;