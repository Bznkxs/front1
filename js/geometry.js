function inRect(x, y, rect) {
    return (x >= rect.xMin && x <= rect.xMin + rect.width &&
            y >= rect.yMin && y <= rect.yMin + rect.height
    );
}