import * as SCENE from "./scene.js";
import * as INPUT from "./input.js";
import * as MAP from "./map.js";
import * as PLAYER from "./player.js";

INPUT.initialize();
MAP.initialize();
MAP.create();
PLAYER.initialize();

let counter = 0;

function animate() {
    if (MAP.collisionWithPlayer()) {
        alert("COLLISION!! AHHHHHH!!!");
        return;
    }
    requestAnimationFrame(animate);

    if (counter == 1000) {
        counter = 0;
    } else {
        counter++;
    }
    
    MAP.planObjects(counter);
    MAP.moveObjects();
    PLAYER.move();
    PLAYER.center();

    SCENE.render();
}
animate();
