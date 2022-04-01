
// 设置画布初始属性
const canvasMain = document.querySelector('.canvasMain');
const canvas = document.getElementById('canvas');
const resultGroup = document.querySelector('.resultGroup');

// 设置画布宽高背景色
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
canvas.style.background = "#8c919c";

const annotate = new LabelImage({
	canvas: canvas,
	scaleCanvas: document.querySelector('.scaleCanvas'),
	scalePanel: document.querySelector('.scalePanel'),
	annotateState: document.querySelector('.annotateState'),
	canvasMain: canvasMain,
	canvasContent: document.querySelector('.canvasContent'),
	resultGroup: resultGroup,
	crossLine: document.querySelector('.crossLine'),
	labelShower: document.querySelector('.labelShower'),
	screenShot: document.querySelector('.screenShot'),
	screenFull: document.querySelector('.screenFull'),
	recover: document.querySelector('.recover'),
	colorHex: document.querySelector('#colorHex'),
	toolTagsManager: document.querySelector('.toolTagsManager'),
	historyGroup: document.querySelector('.historyGroup')
});

// 初始化交互操作节点
const prevBtn = document.querySelector('.pagePrev');                    // 上一张
const nextBtn = document.querySelector('.pageNext');                    // 下一张
const taskName = document.querySelector('.pageName');                   // 标注任务名称
const processIndex = document.querySelector('.processIndex');           // 当前标注进度
const processSum = document.querySelector('.processSum');               // 当前标注任务总数
const userDiv = document.querySelector('.username');
const taskDiv = document.querySelector('.taskManage');
const taskUL = taskDiv.querySelector('.task-ul');
const saveDiv = document.querySelector('.saveHint');
const removeRange = document.querySelector('.toolRemoveRange');

let taskDivClicked = false;
taskDiv.addEventListener('mouseleave', ()=>{
	if (taskDivClicked) {
		taskDiv.classList.remove("focus");
		taskDiv.classList.add("blur");
	}
})

userDiv.addEventListener('click', ()=>{
	if (taskDiv.className.indexOf("focus") === -1) {
			taskDivClicked = false;
			taskDiv.classList.remove('taskManageInit');
			taskDiv.classList.remove("blur");
			taskDiv.classList.add("focus");
		}else {
			taskDiv.classList.remove("focus");
			taskDiv.classList.add("blur");
		}
});

function updateTasks() {
	taskUL.innerHTML = '';
	let fragment = document.createDocumentFragment()
	console.log("tasks", tasks)
	for (let t in tasks) {
		if (t > 0) {
			let d = document.createElement('div');
			d.classList.add('taskManage-li-div');
			fragment.appendChild(d);
		}
		let li = document.createElement('li');
		li.innerText = tasks[t];
		if (tasks[t] !== task) {
			li.classList.add('taskManage-li');
		} else {
			li.classList.add('taskManage-li-current')
		}

		li.classList.add('taskManage-li-mouse-leave');
		li.onmouseenter = () => {
			console.log("mouseEnter", t)
			li.classList.remove('taskManage-li-mouse-leave');
			li.classList.add('taskManage-li-mouse-enter');
		}
		li.onmouseleave = () => {
			console.log("mouseLeave", t)
			li.classList.add('taskManage-li-mouse-leave');
			li.classList.remove('taskManage-li-mouse-enter');
		}
		li.onclick = () => {
			taskDivClicked = true;
			changeTask(li.innerText, initCallback)
		}
		fragment.appendChild(li);

	}
	taskUL.appendChild(fragment);
}


let imgArray = [];    //选择上传的文件数据集
let imgIndex = 1;       //标定图片默认下标;
let imgSum = () => imgArray.length;
let task = '';
let tasks = [];
initImage();

function getStorage(name) {
	return localStorage.getItem(task + '/' + name);
}

function setStorage(name, val) {
	localStorage.setItem(task + '/' + name, val);
}

// called when imgIndex or imgArray change. show image on screen.
function setImage(fromMemory=false) {
	processIndex.innerText = imgIndex + 1;
	if (taskPermission === 0) {
		processIndex.innerText = '已标注' + (imgIndex + 1);
	}
	processSum.innerText = imgSum();
	if (taskPermission === 0) {
		processSum.innerText = '已分配' +  imgSum()
	}
	let name = imgArray[imgIndex].name;
	taskName.innerText = name;
	console.log("setImage", name);
	let content = null; // getStorage(name);
	// console.log('content', content);
	let img = imgArray[imgIndex];
	fromMemory && content ? annotate.SetImage(img, JSON.parse(content)) :
			annotate.SetImage(img);

}

function uploadImage(showSaveDiv=true) {
	let oldName = imgArray[imgIndex].name;
	let size = imgArray[imgIndex].size;
	let content = annotate.Arrays.imageAnnotateMemory;
	sendAnnotation(oldName, content, size);
	if (showSaveDiv) {
		saveDiv.classList.remove("init");
		saveDiv.classList.remove("blur");
		saveDiv.classList.add("focus");
		setTimeout(()=>{
			saveDiv.classList.remove("focus");
			saveDiv.classList.add("blur");
		}, 1000)

	}


}

async function selectImage(index, prev=0, render=true) {
	if (index !== imgIndex) {
		// send information to web
		console.log('imgIndex', imgIndex)
		if (prev === 0) {

			uploadImage();
		}



		console.log("selectImage(" + index + ")")
		openBox('#loading', true);

		console.log("??", index, imgSum())
		if (index >= imgSum()) {
			fetchNewImage(null, (ret_data)=>{
				if (ret_data == null) {
					if (index > 0) {
						selectImage(0, 1, render);
					}

					return;
				}
				imgArray.push(ret_data);
				imgIndex = index;
				if (render)
					setImage();
			});
		} else if (imgArray[index] == null) {
			fetchNewImage(index, (ret_data)=>{
				if (ret_data == null) {
					if (index > 0) {
						selectImage(0, 1);
					}

					return;
				}
				imgArray[index] = ret_data;
				imgIndex = index;
				if (render)
					setImage();
			});
		} else {
			imgIndex = index;
			announceChangeImage(index);
			if (render)
				setImage(true);
		}
	}


}

let initCallbackVar = 0;
let taskPermission = 0;
function initCallback(ret_data){
	colorArray.splice(0, colorArray.length)
	for (let x in colorDict) {
		delete colorDict[x];
	}
	updateColorBox();
	// labelSelector.style.visibility = 'collapse';
	taskPermission = +ret_data.permission;
	let len = ret_data.len;
	imgIndex = ret_data.index;
	if (len === imgIndex) ++len;
	console.log(imgIndex, len);
	imgArray = [];
	for (let i = 0; i < len; ++i) {
		imgArray.push(null);
	}

			imgArray[imgIndex] = ret_data.image;
		console.log(ret_data.image.label)
		task = ret_data.task;
		userDiv.innerText = ret_data.user+ '@' + task ;
		tasks = ret_data.tasks;
		updateTasks();
		setImage();

	// if (ret_data.image == null) {
	// 	if (initCallbackVar === 1) return;
	// 	initCallbackVar = 1;
	// 	fetchNewImage(0, initCallback);
	// } else {
	// 	initCallbackVar = 0;
	// 	imgArray[imgIndex] = ret_data.image;
	// 	task = ret_data.task;
	// 	userDiv.innerText = task + '@' + ret_data.user;
	// 	tasks = ret_data.tasks;
	// 	updateTasks();
	// 	setImage();
	// }

}

// 初始化图片状态
function initImage() {
	hello(initCallback);
	// selectImage(0);
}

// 获取下一张图片
let getNextImage = function() {
	//annotate.Arrays.imageAnnotateMemory.length > 0 &&

	console.log("next Btn");
	selectImage(imgIndex + 1);
}

nextBtn.onclick = getNextImage;

let getPrevImage = function() {
	//annotate.Arrays.imageAnnotateMemory.length > 0 &&
	//setStorage(taskName.textContent, JSON.stringify(annotate.Arrays.imageAnnotateMemory));  // 保存已标定的图片信息
	console.log("prev Btn");
	if (imgIndex === 0) {
		selectImage(imgSum() - 1);
	}
	else {
		selectImage(imgIndex - 1);
	}
}

// 获取上一张图片
prevBtn.onclick = getPrevImage;

//切换操作选项卡
let tool = document.getElementById('tools');
tool.addEventListener('click', function(e) {
	toolClick(e.target);
});


let toolClick = function(target) {
	for (let i=0; i<tool.children.length; i++) {
		tool.children[i].classList.remove('focus');
	}
	target.classList.add('focus');
	switch(true) {
		case target.className.indexOf('toolDrag') > -1:  // 拖拽
			toolDragSelect();
			break;
		case target.className.indexOf('toolRect') > -1:  // 矩形
			rectSelect();
			break;
		case target.className.indexOf('toolPolygon') > -1:  // 多边形
			annotate.SetFeatures('polygonOn', true);
			break;
		case target.className.indexOf('toolTagsManager') > -1:  // 标签管理工具
			annotate.SetFeatures('tagsOn', true);
			break;
		case target.className.indexOf('toolRemoveRange') > -1: // range remove
			annotate.SetFeatures('removeRangeOn', true)
		default:
			break;
	}
}

let toolDragSelect = function() {
	annotate.SetFeatures('dragOn', true);
}

let rectSelect = function() {
	annotate.SetFeatures('rectOn', true);
}

document.addEventListener('keydown', ev => {
	if (ev.key === 'd' || ev.key === 'D') {
		toolClick(tool.getElementsByClassName('toolDrag')[0]);
	}
	if (ev.key === 'f' || ev.key === 'F') {
		toolClick(tool.getElementsByClassName('toolRect')[0]);
	}
	if (ev.key === 'Backspace' || ev.key === 'Delete' || ev.key === 'r' || ev.key === 'R') {
		if (annotate.Arrays.selectIndex !== -1) {
			annotate.DeleteSomeResultLabel(annotate.Arrays.selectIndex);
		}
	}
	if (ev.key === 'e' || ev.key === 'E') {
		toolClick(tool.getElementsByClassName('toolRemoveRange')[0]);
	}
	if (ev.ctrlKey && (ev.key === 's' || ev.key === 'S')) {
		uploadImage();
		ev.preventDefault();
	}
	if (ev.key === 'w' || ev.key === 'W') {
		getNextImage();
	}
	if (ev.key === 'q' || ev.key === 'Q') {
		getPrevImage();
	}
	if (ev.key === 'ArrowDown') {
		console.log("??")
		annotate.selectLabel('d');
	}
	if (ev.key === 'ArrowUp') {
		annotate.selectLabel('u');
	}if (ev.key === 'ArrowLeft') {
		annotate.selectLabel('l');
	}if (ev.key === 'ArrowRight') {
		annotate.selectLabel('r');
	} if (ev.ctrlKey && (ev.key === 'z' || ev.key === 'Z')) {
		annotate.undo();
	}
	console.log(ev.key);
})


// document.querySelector('.openFolder').addEventListener('click', function() {
// 	document.querySelector('.openFolderInput').click()
// });
//
// function changeFolder(e) {
// 	imgArray = e.files;
// 	processSum.innerText = imgSum();
// 	imgIndex = 0;
// 	new Promise(() => {
// 		selectImage(0)
// 	}).then(() => {});
// }


document.querySelector('.saveJson').addEventListener('click', function() {
	console.log("???")
	uploadImage();
});
// document.querySelector('.saveJson').addEventListener('click', function() {
// 	let filename = taskName.textContent.split('.')[0] + '.json';
// 	annotate.Arrays.imageAnnotateMemory.length > 0 ? saveJson(annotate.Arrays.imageAnnotateMemory, filename): alert('当前图片未有有效的标定数据');
// });

function saveJson(data, filename) {
	if (!data) {
		alert('保存的数据为空');
		return false;
	}
	if (!filename) {
		filename = 'json.json';
	}
	if (typeof data === 'object') {
		data = JSON.stringify(data, undefined, 4);
	}
	let blob = new Blob([data], {type: 'text/json'}),
		e = document.createEvent('MouseEvent'),
		a = document.createElement('a');
		a.download = filename;
		a.href = window.URL.createObjectURL(blob);
		a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
		e.initMouseEvent('click', true, false, window,  0, 0, 0, 0, 0, false, false, false, false, 0, null);
		a.dispatchEvent(e)
}

//弹出框
function openBox (e, isOpen) {
	let el = document.querySelector(e);
	let maskBox = document.querySelector('.mask_box');
	if (isOpen) {
		maskBox.style.display = "block";
		el.style.display = "block";
	}
	else {
		maskBox.style.display = "none";
		el.style.display = "none";
	}
}