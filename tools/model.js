var tf = require("@tensorflow/tfjs");
var tfnode = require("@tensorflow/tfjs-node");
var axios = require("axios");
var sharp = require("sharp");

class Models {
    static instance = null;

    droneModel = null;
    phoneModel = null;
    classThreshold = 0.5;

    static getInstance() {
        if (!Models.instance) {
            Models.instance = new Models();
        }
        return Models.instance;
    }

    async extracBase64Image(imgdata) {
        const base64img = await imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        return base64img;
    }

    async loadModel(model_location, modelName) {
        const yolov_5model = await tf.loadGraphModel(model_location);
        console.log(`${modelName} model ready to use`);
        if (modelName === 'drone') {
            this.droneModel = yolov_5model;
            this.warmingUpModel(this.droneModel);
        } else if (modelName === 'phone') {
            this.phoneModel = yolov_5model;
            this.warmingUpModel(this.phoneModel);
        }
        return yolov_5model;
    }

    async warmingUpModel(model) {
        // warming up model
        const dummyInput = tf.ones(model.inputs[0].shape);
        const warmupResult = await model.executeAsync(dummyInput);
        tf.dispose(warmupResult); // cleanup memory
        tf.dispose(dummyInput); // cleanup memory
    }

    preprocess(source, modelWidth, modelHeight) {
        let xRatio, yRatio;
        const input = tf.tidy(() => {
            const img = tfnode.node.decodeImage(source);
            const [h, w] = img.shape.slice(0, 2);
            const maxSize = Math.max(w, h);
            const imgPadded = img.pad([
                [0, maxSize - h],
                [0, maxSize - w],
                [0, 0],
            ]);
            xRatio = maxSize / w;
            yRatio = maxSize / h;
            return tf.image
                .resizeBilinear(imgPadded, [modelWidth, modelHeight])
                .div(255.0)
                .expandDims(0);
        });
        return [input, xRatio, yRatio];
    }

    async detectImage(imgSource, model, classThreshold) {
        const [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);

        tf.engine().startScope();
        const [input, xRatio, yRatio] = this.preprocess(imgSource, modelWidth, modelHeight);

        let objects_detected = 0;

        await model.executeAsync(input).then((res) => {
            const [boxes, scores, classes] = res.slice(0, 3);
            const boxes_data = boxes.dataSync();
            const scores_data = scores.dataSync();
            const classes_data = classes.dataSync();
            tf.dispose(res);
            for (let i = 0; i < scores_data.length; ++i) {
                if (scores_data[i] > classThreshold) {
                    objects_detected += 1;
                }
            }

        });

        tf.engine().endScope();
        return objects_detected;
        // return result;
    }

    async droneDetect(imgSource, classThreshold = this.classThreshold) {
        if (this.droneModel != null) {
            let detection = await this.detectImage(imgSource, this.droneModel, classThreshold)
            return detection;
        }
        return 0;
    }
    async phoneDetect(imgSource, classThreshold = this.classThreshold) {
        if (this.phoneModel != null) {
            let detection = await this.detectImage(imgSource, this.phoneModel, classThreshold)
            return detection;
        }
        return 0;
    }
    async roboflowDetect(base64imagee) {
        let roboflowx = await axios({
            method: "POST",
            url: "https://detect.roboflow.com/strawberry-flowers-bxn3k/4",
            params: {
                api_key: "DoAZDoMpOCmxigVVKmtg"
            },
            data: base64imagee,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        return roboflowx.data.predictions.length;
    }
    async splitImageAndDetect(src, number, classThreshold = this.classThreshold, useRoboflow = true) {
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
                let flowers_here = 0
                if (useRoboflow) {
                    flowers_here = await this.roboflowDetect(chunkImage);
                } else {
                    const imgBinary = await Buffer.from(chunkImage, 'base64');
                    flowers_here = await this.droneDetect(imgBinary, classThreshold);
                }
                flowers += flowers_here;
            }
        }
        return flowers;
    }
}

module.exports = Models;