import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as CONSTANTS from "./constants.js";

function manhattan(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    },

    pop: function() {
        const first = this.content[0];
        const last = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = last;
            this.sinkDown(0);
        }
        return first;
    },

    size: function() {
        return this.content.length;
    },

    remove: function(node) {
        let i = 0;
        while (i < this.size() && this.content[i] != node) {
            i++;
        }
        if (i == this.size() - 1) return;
        const last = this.content.pop();
        this.content[i] = last;
        this.bubbleUp(i);
        this.sinkDown(i);
    },

    bubbleUp: function(i) {
        const element = this.content[i];
        const score = this.scoreFunction(element);
        while (i > 0) {
            const parentInd = Math.floor((i + 1) / 2) - 1;
            const parent = this.content[parentInd];
            if (score >= this.scoreFunction(parent)) break;
            this.content[parentInd] = element;
            this.content[i] = parent;
            i = parentInd;
        }
    },

    sinkDown: function(i) {
        const element = this.content[i];
        const elementScore = this.scoreFunction(element);

        while (true) {
            const child2Ind = (i + 1) * 2;
            const child1Ind = child2Ind - 1;
            let swap = null;

            if (child1Ind < this.size()) {
                const child1 = this.content[child1Ind];
                const child1Score = this.scoreFunction(child1);
                if (child1Score < elementScore) {
                    swap = child1Ind;
                }

                if (child2Ind < this.size()) {
                    const child2 = this.content[child2Ind];
                    const child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap == null ? elementScore : child1Score)) {
                        swap = child2Ind;
                    }
                }
            }

            if (swap == null) break;
            this.content[i] = this.content[swap];
            this.content[swap] = element;
            i = swap;
        }
    },

    rescoreElement: function(element) {
        this.sinkDown(this.content.indexOf(element));
    }
};

function aStar(mapInfo, position, target, object) {
    const { numColumns, numRows } = mapInfo;
    const startTile = MAP.coordsToTile(position.x, position.y);
    const targetTile = MAP.coordsToTile(target.x, target.y);
    let compMap = [];
  
    const weightFunction = function(i, j) {
        if (object.form.isAllowed(i, j)) return 1;
        return 2;
    };
  
    for (let i = 0; i < numColumns; i++) {
        for (let j = 0; j < numRows; j++) {
            compMap.push({
                i: i,
                j: j,
                //allowed: object.form.isAllowed(i, j),
                visited: false,
                closed: false,
                pred: null,
                f: undefined,
                g: undefined
            });
        }
    }
  
    let heap = new BinaryHeap(node => node.f);
  
    let start = compMap[startTile.i * numColumns + startTile.j];
    start.g = 0;
    start.f = manhattan(startTile.i, startTile.j, targetTile.i, targetTile.j);
  
    heap.push(start);
  
    while (heap.size() > 0) {
        let current = heap.pop();

        if (current.i == targetTile.i && current.j == targetTile.j) {
            let path = [];
            while (current) {
                path.push(MAP.tileToCenter(current.i, current.j));
                current = current.pred;
            }

            return path;
        }

        current.closed = true;

        for (let dir of CONSTANTS.DIRECTIONS) {
            const ni = current.i + dir.i;
            const nj = current.j + dir.j;

            const neighbor = compMap[ni * numColumns + nj];

            if (neighbor.closed) continue;
            if (!object.form.isAllowed(ni, nj)) continue;
            if (dir.i != 0
                && dir.j != 0
                && !object.form.isAllowed(current.i + dir.i, current.j)
                && !object.form.isAllowed(current.i, current.j + dir.j))
                continue;

            const nCost = weightFunction(ni, nj);
            const g =
                ni != current.i && nj != current.j
                ? current.g + nCost * 1.5
                : current.g + nCost;

            if (neighbor.visited && g >= neighbor.g) continue;
            neighbor.pred = current;
            neighbor.g = g;
            neighbor.f = g + manhattan(ni, nj, targetTile.i, targetTile.j);

            if (!neighbor.visited) {
                neighbor.visited = true;
                heap.push(neighbor);
            } else {
                heap.rescoreElement(neighbor);
            }
        }
    }

    return;
}

export function test(self, counter) {
    if (counter % 100 == 0) {
        return { update: true, route: aStar(MAP.getTileMapInfo(), self.form.nodes[0], PLAYER.getPosition(), self) };
    }
    return { update: false, route: undefined };
}
