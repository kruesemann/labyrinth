let events = {};
let eventHandlers = [];

export function reset() {
    for (let handler of eventHandlers) {
        document.removeEventListener(handler.eventID, handler.callback);
    }
    
    events["soundReady"] = new Event("soundReady");
    events["soundError"] = new Event("soundError");

    events["newLevel"] = new Event("newLevel");
}

export function on(eventID, callback) {
    document.addEventListener(eventID, callback);
    eventHandlers.push({ eventID, callback });
}

export function off(eventID) {
    for (let i = 0; i < eventHandlers.length; i++) {
        if (eventHandlers[i].eventID === eventID) {
            document.removeEventListener(eventHandlers[i].eventID, eventHandlers[i].callback);
            eventHandlers.splice(i, 1);
            return;
        }
    }
}

export function trigger(eventID) {
    document.dispatchEvent(events[eventID]);
}
