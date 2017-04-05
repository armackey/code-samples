var storage = require('../storage');

exports.compare_selected = function (currentPerson, selected) {

    // return new Promise(function (resolve, reject) {
    var currentLevelId = storage.getCurrentLevelId();

    var levels = currentPerson.levels;

    if (levels[currentLevelId] && levels[currentLevelId].answered) {

        for (var key in levels[currentLevelId]) {

            if (key !== 'answered' && key !== 'type') { // have to avoid that key or it'll add to strikes   
                //we have to compare the button pseudoid to the key of the selection {a: false: { 'would you rather..' } } (button.id === 'a') // a is the key

                currentPerson.answer = key === selected ? 'O' : 'X';

            }

        }

    }

    return currentPerson;
    // resolve(currentPerson);
    // });

};


exports.compare_levels = function (myLevels, currentPerson) {



    return new Promise(function (resolve, reject) {
        var strikes = '';
        var levelsObjects = currentPerson.levels;
        var myAnswerKeyList = getAnsweredLevelKeys(myLevels);
        var personAnswerKeyList = getAnsweredLevelKeys(levelsObjects)

        compareAnswers(myAnswerKeyList, myLevels, levelsObjects).then(function (counts) {

            do {
                if (counts.agreeCount > 0) {
                    strikes += 'O ';
                    counts.agreeCount -= 1;
                } else if (counts.disagreeCount > 0) {
                    strikes += 'X ';
                    counts.disagreeCount -= 1
                }
            }
            while (counts.agreeCount > 0 || counts.disagreeCount > 0);

            currentPerson.strikes = strikes;

        });


        resolve(currentPerson);

    });

};

function compareAnswers(myAnswerKeyList, myLevelsObjects, levelsObjects) {

    var agreeCount = 0;

    var disagreeCount = 0;

    return new Promise(function (resolve, reject) {

        for (var levelKey in myAnswerKeyList) {

            if (myLevelsObjects[levelKey] && levelsObjects[levelKey]) { // my answered levelKey must exist in thiers for comparisons

                for (var uniqueId in myLevelsObjects[levelKey]) { // we need the key/unique id inside of our levels

                    if (uniqueId !== 'answered' && myLevelsObjects[levelKey].answered) { // we dont want this key value pair

                        if (myLevelsObjects[levelKey][uniqueId]['true'] && levelsObjects[levelKey][uniqueId]['true']) { // we agree

                            agreeCount += 1;

                        } else if (myLevelsObjects[levelKey][uniqueId]['false'] && levelsObjects[levelKey][uniqueId]['true']) { // we disagree

                            disagreeCount += 1;

                        }
                    }
                }
            }
        }

        resolve({

            agreeCount: agreeCount,
            disagreeCount: disagreeCount

        })

    });
}

function getAnsweredLevelKeys(levelsObjects) {

    var answeredObj = {};

    for (var key in levelsObjects) {

        var hasAnswered = levelsObjects[key].answered;

        if (hasAnswered) {

            answeredObj[key] = key;

        }

    }

    return answeredObj;

}

exports.set_levels = function (myAnsweredLevels, currentPerson) {

    var levels = {};    

    return new Promise(function (resolve, reject) {

        var level = JSON.parse(JSON.stringify(currentPerson.levels));

        for (var levelKey in level) {

            if (!myAnsweredLevels[levelKey] || !myAnsweredLevels[levelKey].answered) {

                levels[levelKey] = level[levelKey];


                levels[levelKey].answered = false;

                for (var innerKey in levels[levelKey]) {

                    if (!innerKey) continue;

                    for (var key in levels[levelKey][innerKey]) {

                        if (levels[levelKey][innerKey]['true']) {

                            levels[levelKey][innerKey] = { false: levels[levelKey][innerKey]['true'] }

                        }

                    }

                }

            }

        }

        if (Object.keys(levels).length < 1) {

            log('no new levels');

            reject('no new levels');

        }


        storage.setPlayableLevels(levels);
        resolve(levels);

    });

};

exports.set_current_level = function () {
    // remove previous level and go on to next

    return new Promise(function (resolve, reject) {


        var newLevel = {};
        var levelList = storage.getPlayableLevels();
        var currentLevelId = storage.getCurrentLevelId();
        
        levelList = remove_level_from_list(levelList, currentLevelId);
        
        for (var levelKey in levelList) {

            if (levelKey !== currentLevelId && Object.keys(newLevel).length < 2) {

                newLevel[levelKey] = levelList[levelKey];

                break;
            }

        }

        
        storage.setCurrentLevel(newLevel);
        
        resolve(true);

    });

};

function remove_level_from_list(currentLevelList, currentLevel) {
    delete currentLevelList[currentLevel];
    return currentLevelList;
}

function twoOutOfThreeHelper(strikes) {

    var array = strikes.split('');
    var obj = {};
    var count = 1;

    return new Promise(function (resolve, reject) {

        for (var index = 0; index < array.length; index += 1) {
            if (array[index] === ' ') continue;
            if (obj[array[index]]) {
                count += 1;
                obj[array[index]] = count;
                continue;
            }
            obj[array[index]] = count;
        }
        for (key in obj) {
            if (obj[key] === 2 && key === 'X') {
                // if X appears 2/3 you've struck out
                // use credits to match with them or play another game with them.. not sure yet
                resolve('reconcile');
            } else if (obj[key] === 2 && key === 'O' && array.length > 2) {
                resolve('closeenough');
            } else if (obj[key] > 2 && key === 'O') {
                resolve('match');
            }
        }
        resolve('nomatch')
    });
}

exports.twoOutOfThreeHelper = twoOutOfThreeHelper;