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


function segmentDist(p0, p1, pA, pB) {
    // distance between (p0, p1) and (pA, pB)
    let d1 = p1 - pA;
    let d2 = p0 - pB;
    if (d1 * d2 <= 0) return 0;
    return Math.min(Math.abs(d1), Math.abs(d2));
}

function rectDistSquared(rect1, rect2) {
    let x0 = rect2.xMin, x1 = x0 + rect2.width, y0 = rect2.yMin, y1 = y0 + rect2.height;
    let xA = rect1.xMin, xB = rect1.xMin + rect1.width,
        yA = rect1.yMin, yB = rect1.yMin + rect1.height
    // intersection
    if (x1 >= xA && x0 <= xB &&
        y1 >= yA && y0 <= yB) {
        return 0;
    }
    let xDist = segmentDist(x0, x1, xA, xB);
    let yDist = segmentDist(y0, y1, yA, yB);
    return xDist ** 2 + yDist ** 2;

}