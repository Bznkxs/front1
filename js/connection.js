const const_backend = 'http://166.111.121.22:3000'
let backend = const_backend;

// function getBackend() {
//     let request = new XMLHttpRequest;
//     request.open("GET", const_backend + '/ip.txt', false);
//     request.send();
//     backend = request.responseText;
//     console.log(backend);
// }
//
// getBackend();



function applyUser() {
    let request = new XMLHttpRequest;
    request.open("GET", backend + '/exchange/apply_user', false);
    request.send();
    const data = JSON.parse(request.responseText);
    localStorage.setItem('user', data.user);
    return data.user;
}

function parseLabel(labelBase64) {
    let x = atob(labelBase64);

    let split1 = x.split(/\n+\s*/);
    if (x.length > 200) {
        console.log(x.substring(0, 200) + '...');
    } else {
        console.log(x)
    }

    let labels = [];
    for (let i in split1) {
        if (split1[i] === '') {
            continue;
        }
        let line = split1[i].split(/\s+/);
        let id = i;
        let cls = line[0];
        let coords = [];
        for (let i = 1; i <= 4; ++i) {
            coords.push(+line[i]);
        }
        let prob = 1;
        if (line.length > 5) {
            prob = +line[5];
        }
        labels.push({
            id,
            class: cls,
            coords,
            prob
        });
    }
    let below = (a, b) => {  // a is below b
        if (a[1] <= b[1]) return false;
        return true;
    }
    let rightOf = (a, b) => {  // a is right of b
        if (a[0] - a[2] / 2 <= b[0] + b[2] / 2) return false;
        return true;
    }
    labels.sort((a, b) => {
        if (a.class < b.class) return -1;
        if (b.class < a.class) return 1;
        let ac = a.coords, bc = b.coords;
        if (rightOf(ac, bc)) return -1;
        if (rightOf(bc, ac)) return 1;
        if (below(ac, bc)) return 1;
        if (below(bc, ac)) return -1;


        return ac[1]-bc[1];
    })
    // console.log("label =", labels)
    return labels;
}

function parseImage(imgName, image, label, size) {
    let labelVal = null, original = null;
    if (label.marked === 1) {
        original = label.original;
        labelVal = label.latest;
    } else {
        original = label.original;
        labelVal = label.original;
    }
    return {
        imageVal: image,
        labelVal,
        labelOriginal: original,
        size: size,
        name: imgName
    }
}

function readImageFromWebData(image) {
    let ret = null;
    if (image.valid === 1) {
        console.log("valid,", "(label marked) =", image.label.marked)
        let labelOriginal = parseLabel(image.label.original);
        let labelMarked = image.label.marked;
        let labelLatest = null;
        if (labelMarked) {
            labelLatest = parseLabel(image.label.latest);
        }
        ret = parseImage(image.name, image.image,
            {marked: labelMarked, original: labelOriginal, latest: labelLatest}, image.size);
    } else {
        console.log(image.valid, "invalid")
    }
    return ret;
}

function init_user(request, user, callback) {
    return () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                const data = JSON.parse(request.responseText);
                console.log("Hello", data.task, data.len);

                let image = readImageFromWebData(data.image);
                callback({
                    user,
                    image,
                    task: data.task,
                    tasks: data.tasks,
                    index: data.index,
                    len: data.len,
                    permission: data.permission
                });
            }
        }
        if (request.status === 502) {
            document.getElementById('maskbox').style.display = "block";
            document.getElementById('backend').style.setProperty('visibility', 'visible');

        }
    }
}

function hello(callback) {
    console.log("Hello")
    let user = localStorage.getItem('user');
    if (user == null) {
        user = applyUser();
    }
    let request = new XMLHttpRequest();

    request.open("GET", backend + '/exchange/hello?user=' + user, true);
    request.onreadystatechange = init_user(request, user, callback)
    request.send();
}

function changeTask(task, callback) {
    console.log("change task")
    let user = localStorage.getItem('user');
    if (user == null) {
        user = applyUser();
    }
    let request = new XMLHttpRequest();

    request.open("GET", backend + '/exchange/change_task?user=' + user + '&task=' + task, true);
    request.onreadystatechange = init_user(request, user, callback)
    request.send();
}


function fetchNewImage(newIndex, callback) {
    let user = localStorage.getItem('user');

    let request = new XMLHttpRequest();
    let index = newIndex == null ? '' : '&index=' + newIndex
    request.open("GET", backend + '/exchange/image?user=' + user + index, true);
    request.withCredentials = true;
    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                const data = JSON.parse(request.responseText);
                // console.log(JSON.stringify(data));
                let image = readImageFromWebData(data);
                callback(image);
            }
        }
    }
    request.send();
}

function announceChangeImage(newIndex, callback) {
    let user = localStorage.getItem('user');
    let request = new XMLHttpRequest();
    let index = newIndex == null ? '' : '&index=' + newIndex
    request.open("GET", backend + '/exchange/change_image?user=' + user + index, true);
    request.send();
}


function convertAnnotation(data, size) {
    let retStr = '';
    // console.log(data);
    for (let i in data) {

        let rectMask = data[i].rectMask;
        let x = rectMask.xMin, y = rectMask.yMin, w = rectMask.width, h = rectMask.height, W = size[0], H = size[1];
        x /= W; y /= H; w /= W; h /= H;
        x += w / 2; y += h / 2;
        if (i > 0) retStr += '\n';
        retStr += data[i].labels.labelName + ' ' + x.toString() + ' ' + y.toString() + ' ' + w.toString() + ' ' + h.toString();
    }
    // console.log("retStr", retStr);
    return retStr;


}

function sendAnnotation(name, data, size) {
    let user = localStorage.getItem('user');

    let request = new XMLHttpRequest();
    request.open("POST", backend + '/exchange/feed', true);
    new Promise((resolve => {
        let data1 = convertAnnotation(data, size);
        resolve(data1);
    })).then((data) => {
        request.send(JSON.stringify({
            'user': user,
            'name': name,
            'data': data
        }))
    })

}