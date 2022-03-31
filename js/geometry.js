function inRect(x, y, rect) {
    return (x >= rect.xMin && x <= rect.xMin + rect.width &&
            y >= rect.yMin && y <= rect.yMin + rect.height
    );
}

function getCenter(rectMask) {
    return {
				x: rectMask.xMin + rectMask.width / 2,
				y: rectMask.yMin + rectMask.height / 2
			};
}

function distSquared(coordA, coordB) {
    return (coordA.x - coordB.x) ** 2 + (coordA.y - coordB.y) ** 2
}