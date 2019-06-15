/**
 * Mobile and Internet 2 Project 2019
 * 
 * DOM-game without using a canvas-object.
 * 
 * When switching between desktop-mobile in developer mode, please refresh your page!
 * 
 * BECAUSE OF TIMECONSTRAINTS I COULDN'T MAKE A GOOD TUNNELPATTERN
 * 
 * @author Maarten Miers
 * 
 * https://github.com/MiersM/MI2_MiersM
 */

;; // wraps code in function to avoid conflicts with other scripts
(function () {
    'use strict';

    //exec code after loading page
    window.addEventListener('load', function () {

        ///////////////////////////////////////////////
        //  ALTER THESE VALUES TO MAKE THE GAME FUN  //  
        ///////////////////////////////////////////////

        //  amount of divs to be rendered per wall  
        let tunnelDivAmount = 40; //40

        //  set speed of tunnel                    
        let speedTunnel = 45; //42

        //  set boost power
        let boostValue = -0.7; // -0.7

        // set gravity value
        let gravValue = 0.8; // 1

        ///////////////////////////////////////////////
        //  ALTER THESE VALUES TO MAKE THE GAME FUN  //  
        ///////////////////////////////////////////////

        // change this value to see how far outside/inside the viewport each new block is rendered
        let renderAheadView = 115;

        // individual tunnel block width in %
        let wallBlockWidth = 30;

        // default block height
        let defaultHeight = 25;

        let isBoost = false;
        let isPaused = true;
        let isCrashed = false; // can be used in future development
        let moveY = 0;
        let speedY = 0;
        let accel = 0;
        let score = 0;
        let highScoreStorage = 0;
        let highScore = 0;
        let waveCounter = 0;

        let topArrayDivs = [];
        let bottomArrayDivs = [];

        let hero = document.getElementById('myHeroDiv');
        let lblScore = document.getElementById('lblScore');
        let lblHighScore = document.getElementById('lblHighScore');
        let btnPaused = document.getElementById('btnPaused');
        let btnFightGravity = document.getElementById('btnFightGravity');
        let btnReset = document.getElementById('btnReset');
        document.getElementById("topTunnel").style.width = (renderAheadView + "%");
        document.getElementById("bottomTunnel").style.width = (renderAheadView + "%");



        // init values, spawn divs, get highscore, etc...
        initialize();

        // initialize tunnel, etc..
        function initialize() {
            moveY = 0;
            speedY = 0;
            isPaused = true;
            lblScore.textContent = "S: " + score;

            updateHighscore();
            addEventListeners(); // adds eventlisteners based on a users type of device
            spawnTunnel(); // build environment
        }



        // really hacky way of adding event listeners based on 
        // whether or not the game is run on mobile or desktop machines.

        function addEventListeners() {

            // dirty way to detect whether or not the code is running on a mobile device
            // https://stackoverflow.com/a/36673184
            let isTouchDevice = ('ontouchstart' in document.documentElement);

            // log type of device detected to console
            console.log("Is this a touchdevice?: " + isTouchDevice);

            // BUTTONS

            // TODO 
            // alternate between touchstart and mousedown for buttons to register on mobile
            // https://stackoverflow.com/questions/11144370/using-mousedown-event-on-mobile-without-jquery-mobile

            // too many event handlers, maybe fix by using passive event listeners?

            // pause button
            btnPaused.addEventListener('click', pauser);

            // reset button
            btnReset.addEventListener('click', resetWorld);

            if (isTouchDevice) {

                // touch start and touch end are used to make the buttons work on mobile.
                btnFightGravity.addEventListener('touchstart', function () {
                    isBoost = true;
                });
                btnFightGravity.addEventListener('touchend', function () {
                    isBoost = false;
                });

            } else {

                // event handler for mousedown event
                btnFightGravity.addEventListener('mousedown', function () {
                    isBoost = true;
                });

                //boost disabled button          
                btnFightGravity.addEventListener("mouseup", function () {
                    isBoost = false;
                });

                // if mouse leaves button while pressing, also disable boost
                btnFightGravity.addEventListener('mouseleave', function () {
                    isBoost = false;
                });
            }
        }



        // function used to reset the world
        function resetWorld() {

            // reset flags
            isCrashed = false;
            btnPaused.disabled = false;

            updateHighscore();

            speedY = 0;
            moveY = 0;
            score = 0;
            isPaused = true;
            amountMoved = 0; // related to divtunnelmover
            waveCounter = 0;
            //sinWaveCounter = 0;
            bottomYval = 100;
            topBlockChanged = 50;

            hero.style.display = ''; // show hero div again
            hero.style.transform = "translateY(" + 0 + "%)"; // reset hero location to center
            btnPaused.innerHTML = "START";
            lblScore.textContent = "S: " + score;

            // reset div positions
            for (let i = 0; i < topArrLength; i++) {
                // reset x-position
                topArrayDivs[i].style.transform = "translateX(" + 0 + "%)";
                bottomArrayDivs[i].style.transform = "translateX(" + 0 + "%)";

                // set default block height
                topArrayDivs[i].style.height = (defaultHeight + "%");
                bottomArrayDivs[i].style.height = (defaultHeight + "%");
            }
        }



        // https://stackoverflow.com/questions/2170923/whats-the-easiest-way-to-call-a-function-every-5-seconds-in-jquery
        // testing setinterval method, though this doesnt work as intended
        // setInterval(gravity, 1000/60);

        // So I used the built-in requestAnimationFrame() method to run my main gameloop.
        function gameLoop() {

            gravity();
            moveTunnel();
            checkCollision();
            scoreCounter();

            // gameLoop stops if the game gets paused somewhere during the gameloop
            // when the hero crashes, it also sets the isPaused-flag to true;
            if (!isPaused) {
                requestAnimationFrame(gameLoop);
            }
        }



        // Uses div.getBoundingClientRect() values to check when the hero div is about to hit another div.
        function checkCollision() {

            let shipDiv = hero.getBoundingClientRect();

            for (let i = 0; i < tunnelDivAmount; i++) {
                let topDivBlock = topArrayDivs[i].getBoundingClientRect();
                let bottomDivBlock = bottomArrayDivs[i].getBoundingClientRect();

                /*
                dirty way of doing collisiondetection, it basically doesn't detect the bottom/top border of the divs properly.
                because it's quite complex when not using a canvas object.
                either way since ill populate the tunnel with many divs, it doesn't matter whether or not collisiondetection
                is done with the bottom. Because at high speeds youll only hit the left side of a tunnelblock.
                */

                // check collision with topblocks
                if ((shipDiv.right >= topDivBlock.left) &&
                    ((shipDiv.top <= topDivBlock.bottom) && (topDivBlock.left >= shipDiv.left))) {
                    isCrashed = true;
                    isPaused = true;
                    btnPaused.disabled = true;
                    hero.style.display = 'none';
                    break;
                }

                // check collision with bottomblocks
                if ((shipDiv.right >= bottomDivBlock.left) &&
                    ((shipDiv.bottom >= bottomDivBlock.top) && (bottomDivBlock.left >= shipDiv.left))) {
                    isCrashed = true;
                    isPaused = true;
                    btnPaused.disabled = true;
                    hero.style.display = 'none';
                    break;
                }
            }
        }



        // spawn tunneldivs
        function spawnTunnel() {

            // fill up topArrayDivs[] with divs.
            for (let i = 0; i < tunnelDivAmount; i++) {

                // fill each array element with divs
                topArrayDivs[i] = document.createElement('div');
                bottomArrayDivs[i] = document.createElement('div');

                // set block id's
                topArrayDivs[i].id = 'topBlocks';
                bottomArrayDivs[i].id = 'bottomBlocks';

                // set default block width
                topArrayDivs[i].style.width = wallBlockWidth + "%";
                bottomArrayDivs[i].style.width = wallBlockWidth + "%";

                // set default block height
                topArrayDivs[i].style.height = (defaultHeight + "%");
                bottomArrayDivs[i].style.height = (defaultHeight + "%");

                // place arraynr in divs for clarity
                // topArrayDivs[i].innerHTML = i;
                // bottomArrayDivs[i].innerHTML = i;

                // add child to toptunnel and bottomtunnel
                document.getElementById('topTunnel').appendChild(topArrayDivs[i]);
                document.getElementById('bottomTunnel').appendChild(bottomArrayDivs[i]);
            }
        }



        //let sinWaveCounter=0;
        let amountMoved = 0;
        let topArrLength = topArrayDivs.length;
        let xChanged = (topArrayDivs.length * 100); // 100 represents the width of 1 block in %
        let bottomYval = 100;
        let topBlockChanged = 50; // decides how much the tunnel will move up or down
        let heightChangeIndex;

        /*
            the moveTunnel algorithm would've been way less confusing if we were allowed to use canvas
            what makes this confusing is that each blocks new location is calculated from the intitial spawn.
            If you could alter the X position based on the current position, this would've been an easier problem to fix.
        */

        function moveTunnel() {

            // decides how many units the tunnel is moved with each iteration of moveTunnel()
            amountMoved += speedTunnel;

            // with each iteration, move tunnel by x-amountMoved of %
            // when a divs getBoundingClientRect().right is <= 0", it means the most left div has moved out of the screen
            for (let i = 0; i < topArrLength; i++) {

                topArrayDivs[i].style.transform = "translateX(" + -(amountMoved) + "%)";
                bottomArrayDivs[i].style.transform = "translateX(" + -(amountMoved) + "%)";

                // only checks boundary of top array elements for performance reasons

                if (topArrayDivs[i].getBoundingClientRect().right <= 0) {

                    // move block to the end of the stack (this is amountmoved + length of arraydivs)
                    topArrayDivs[i].style.transform = "translateX(" + (-amountMoved + xChanged) + "%)";
                    bottomArrayDivs[i].style.transform = "translateX(" + (-amountMoved + xChanged) + "%)";


                    // dirty temporary fix to determine on which index the height should be changed
                    heightChangeIndex = i;

                    //if index reached the end, reset amount moved to 0
                    if (i === (topArrLength - 1)) {
                        amountMoved = 0;
                    }
                }
            }

            // change blockheight when a block is rendered out of the screen
            if ((amountMoved % 100) < speedTunnel) { // 100 represents 1 moved block

                topBlockChanged = changeBlockHeightPattern(topBlockChanged);

                // temp way of keeping tunnel 50% thick, by mirroring the topblockchanged value.
                // alter bottomYval to change thickness of the tunnel
                let bottomBlockChanged = bottomYval - topBlockChanged;

                // change actual height of block
                topArrayDivs[heightChangeIndex].style.height = (topBlockChanged + "%");
                bottomArrayDivs[heightChangeIndex].style.height = (bottomBlockChanged + "%");
            }
        }



        // function to alter the pattern of the tunnelflow
        // still working on a good tunnel pattern using sinus waves...

        // TUNNELPATTERN IS STILL A WORK IN PROGRESS...
        // TODO:
        // - change tunnel width to make the tunnel more narrow
        // - speed up tunnel after a certain amount of time

        // source:
        // https://www.khanacademy.org/computing/computer-programming/programming-natural-simulations/programming-oscillations/a/oscillation-amplitude-and-period

        // y = offsetYTunnel +  sin(TWO_PI * frameCount / period) * amplitude;

        let newBlockCounter = 0;


        let offsetYTunnel = 50;
        let TWO_PI = Math.PI * 2;
        let sinValue;

        let periodTun = 175; // 150
        let periodOffset=0.1;
        let heightOffset=0.2;

        let amplitudeTun = 45;

        function changeBlockHeightPattern(blockHeightValue) {

            
            // count new blocks, for usage in sinusfct
            newBlockCounter += 1;

            // reset counter based on the period
            if (newBlockCounter == periodTun){
                newBlockCounter=0;
            }


            
            bottomYval+=heightOffset;
            

            if (bottomYval >= 153){
                //heightOffset*=-1;
                heightOffset= -0.2;
            }

            if (bottomYval <= 95){
                //heightOffset*=-1;
                heightOffset= 0.2;
            }



            // periodTun+=periodOffset;

            // if (periodTun === 100){
            //     //periodOffset= 0.5;
            //     periodOffset*= -1;
            // } else if(periodTun ===200){
            //     //periodOffset= -0.5;
            //     periodOffset*= -1;
            // }

            sinValue = Math.sin((TWO_PI * newBlockCounter) / periodTun) * amplitudeTun;
            

            //blockHeightValue = offsetYTunnel + Math.sin((TWO_PI * newBlockCounter) / periodTun) * amplitudeTun;
            blockHeightValue = offsetYTunnel + sinValue;

            //hero.style.transform = 'rotate('+ sinValue +'deg)'; 

            // if (newBlockCounter>=TWO_PI){
            //     newBlockCounter=0;
            // }

            // console.log("newBlockCounter: "+newBlockCounter);
            // console.log("periodTun: "+periodTun);
            // console.log("periodOffset: "+periodOffset);
            // console.log("offsetYTunnel: "+offsetYTunnel);
            // console.log("bottomYval: "+bottomYval);
            // console.log("sinValue: "+sinValue);

            return blockHeightValue;
        }



        // applies gravity or boost to hero, and updates hero position
        function gravity() {
            if (isBoost) {
                // when btnFightGravity is held, start accelerating upwards
                accel = boostValue;
            } else {
                accel = gravValue;
            }

            // creates inertia effect(it feels as if you're fighting against gravity)
            moveY += speedY += accel;

            hero.style.transform = "translateY(" + moveY + "%)";

            //hero.style.transform = 'rotate('+ sinValue +'deg)'; 

            //hero.style.transform = "rotate("+ sinValue +"deg) translateY(" + moveY + "%)" ;
            
            // attempt at rotating
            // hero.style.transform = "translateY(" + moveY + "%)  rotate("+ sinValue +"deg)" ;
            // console.log(moveY);
        }



        // keep adding score every time the requestAnimationFrame-loop is called
        function scoreCounter() {
            score++;
            lblScore.textContent = "S: " + score;
        }



        // use localStore to retrieve highscore
        function updateHighscore() {
            highScoreStorage = localStorage.getItem("highscore");

            // if the current score is higher than the highscore, set localStorage "highscore" to new value.
            if (score > highScoreStorage) {
                localStorage.setItem("highscore", score);
            }
            highScore = highScoreStorage;
            lblHighScore.textContent = "H: " + highScore;
        }



        // handles pausing-flag
        function pauser() {
            if (isPaused) {
                isPaused = false;
                btnPaused.innerHTML = "PAUSE";
                updateHighscore();
                startAndResumeCounter();

            } else if (!isPaused) { // if game is not paused when the pauser function is called, pause the game
                btnPaused.innerText = "RESUME";
                isPaused = true;
            }
        }



        // handles the countdowntimer using setinterval
        function startAndResumeCounter() {
            let countDown = 3;
            btnPaused.disabled = true;
            counterFct(); // perform counter once before setinterval starts
            let timerInterval = setInterval(counterFct, 700);

            function counterFct() {
                hero.innerHTML = countDown;
                if (countDown <= 0) {
                    speedY = 0;
                    clearInterval(timerInterval);
                    hero.innerHTML = "";
                    btnPaused.disabled = false;
                    // when counter is finished counting, restart gameLoop
                    requestAnimationFrame(gameLoop);
                }
                countDown--;
            }
        }
    });
})();

/*
    Some Sources

    https://www.w3schools.com/jsref/met_element_getboundingclientrect.asp
    https://hammerjs.github.io/
    https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    https://stackoverflow.com/questions/46300964/requestanimationframe-javascript-constant-frame-rate-smooth-graphics
    https://css-tricks.com/using-requestanimationframe/
    https://flaviocopes.com/requestanimationframe/
    https://www.sitepoint.com/simple-animations-using-requestanimationframe/

    https://rogiervdl.github.io/JS-course/
*/