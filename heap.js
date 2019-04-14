export function BinaryHeap(scoreFunction) {
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
        while (i < this.size() && this.content[i] !== node) {
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