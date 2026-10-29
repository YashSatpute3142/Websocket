
let count = 0;

function checkForUpdates() {
    count++;

    console.log(`Checking server... Request ${count}`);

    if (count === 3) {
        console.log("New message received!");
    }
}

setInterval(checkForUpdates, 2000);
