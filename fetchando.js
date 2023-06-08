///This file is only to test the fetching..
import fetch from 'node-fetch';
import fs from "fs";
import colors from 'colors';




import sharp from "sharp";

//Just to have an idea of the time it takes every request
const getCurrentDate = () => {
    let date_ob = new Date();
    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    return `${day}/${month}/${year}`;
};
const getCurrentTime = (date_ob = new Date()) => {
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();

    return `${hours}:${minutes}:${seconds}`;
};

//In case you want to save the result or something in txt format
const saveData = (text, fileName) => {
    fs.promises.appendFile(`${fileName}.txt`, text, function(err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

//Giving the body the format it has to have
const formBody = (base64String) => {
    var details = {
        'base64image': `data:image/jpeg;base64,${base64String}`
    };

    var formBody = [];

    for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }

    formBody = formBody.join("&");

    return formBody;
};


//Making the request to the url defined and with the image in base64 format
const makeRequestBase64Img = async(url, base64Image) => {

    let newBody = formBody(base64Image);
    // console.log(newBody.substring(0, 50));

    let data = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: newBody
    });
    data = await data.text();

    return data;
};

//Getting the file to then send it in the request
const readFromImageFile = async(url, fileName) => {
    let thefile = await fs.promises.readFile(fileName, async(err, data) => {
        if (err)
            throw err;
        return data;
    });
    let result = await sharp(thefile)
        .toFormat("jpg")
        .toBuffer()
        .then(async(data) => {
            const base64Image = data.toString("base64");
            // saveData(base64Image, "ImageBase64");
            // await splitImage(base64Image);
            let startedAt = new Date();
            let response = await makeRequestBase64Img(url, base64Image);
            response = colors.green(response)
            let timeTaked = colors.yellow(new Date() - startedAt);

            return (`${response} --> ${url} --> Time: ${timeTaked}ms`);


        })
        .catch(err => {
            throw err;
        });

    return result;
}


const StartRequests = async() => {
    //Possible URLs

    let url_11 = 'https://nodebackendproject.azurewebsites.net/phone-big-img?';
    let url_22 = 'https://nodebackendproject.azurewebsites.net/drone-big-img?';
    let url_33 = 'https://nodebackendproject.azurewebsites.net/drone-big-img/yolov5?';
    let url_44 = 'https://nodebackendproject.azurewebsites.net/drone-big-img/roboflow?';
    let url_55 = 'https://nodebackendproject.azurewebsites.net/drone-big-img/yolov5-cropped?';
    let url_66 = 'https://nodebackendproject.azurewebsites.net/drone-big-img/roboflow-cropped?';

    let url_1 = 'http:localhost:8080/phone-big-img?';
    let url_2 = 'http:localhost:8080/drone-big-img?';
    let url_3 = 'http:localhost:8080/drone-big-img/yolov5?';
    let url_4 = 'http:localhost:8080/drone-big-img/roboflow?';
    let url_5 = 'http:localhost:8080/drone-big-img/yolov5-cropped?';
    let url_6 = 'http:localhost:8080/drone-big-img/roboflow-cropped?';

    const phonePicture = "phonetest.jpg";
    const dronePicture = "DJI_20220625110354_0044.jpg";
    const droneSubPicture = "dronetest-sub-1.jpg";

    console.log(`\n\n\n Starting in ${getCurrentDate()} at ${getCurrentTime()}`);

    console.log(`\n\n Requesting to the Localhost..`);

    console.log(colors.bgBlue(`\n Localhost: YOLOv5 big Phone Photo`));
    console.log(await readFromImageFile(url_1, phonePicture));


    console.log(colors.bgBlue(`\n Localhost: YOLOv5 cropped Drone Photo`));
    console.log(await readFromImageFile(url_5, droneSubPicture));


    console.log(colors.bgBlue(`\n Localhost: Roboflow cropped Drone Photo`));
    console.log(await readFromImageFile(url_6, droneSubPicture));


    console.log(colors.bgBlue(`\n Localhost: YOLOv5 big Drone Photo`));
    console.log(await readFromImageFile(url_3, dronePicture));


    console.log(colors.bgBlue(`\n Localhost: Roboflow big Drone Photo`));
    console.log(await readFromImageFile(url_4, dronePicture));

    console.log(colors.bgBlue(`\n Localhost: Roboflow big Drone Photo (redirected)`));
    console.log(await readFromImageFile(url_2, dronePicture));

    console.log(`\n\n Requesting to the Server..`);

    console.log(colors.bgBlue(`\n Server: YOLOv5 big Phone Photo`));
    console.log(await readFromImageFile(url_11, phonePicture));

    console.log(colors.bgBlue(`\n Server: YOLOv5 cropped Drone Photo`));
    console.log(await readFromImageFile(url_55, droneSubPicture));

    console.log(colors.bgBlue(`\n Server: Roboflow cropped Drone Photo`));
    console.log(await readFromImageFile(url_66, droneSubPicture));

    console.log(colors.bgBlue(`\n Server: YOLOv5 big Drone Photo`));
    console.log(await readFromImageFile(url_33, dronePicture));

    console.log(colors.bgBlue(`\n Server: Roboflow big Drone Photo`));
    console.log(await readFromImageFile(url_44, dronePicture));

    console.log(colors.bgBlue(`\n Server: Roboflow big Drone Photo (redirected)`));
    console.log(await readFromImageFile(url_22, dronePicture));

    console.log(`\n End in ${getCurrentDate()} at ${getCurrentTime()} \n\n`);
}

StartRequests();



colors.enable()